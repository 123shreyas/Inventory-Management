using InventoryManagement.Application.Features.Stock.Commands;
using InventoryManagement.Application.Features.Stock.DTOs;
using InventoryManagement.Application.Features.Stock.Queries;
using InventoryManagement.Domain.Entities;
using InventoryManagement.Domain.Enums;
using InventoryManagement.Interfaces;
using InventoryManagement.Interfaces.Pipelines;
using InventoryManagement.Interfaces.Repositories;
using InventoryManagement.Interfaces.Services;
using Microsoft.Extensions.Logging;
using AutoMapper;

using InventoryManagement.Shared.Exceptions;

namespace InventoryManagement.Infrastructure.Services;

public class StockService : IStockService
{
    private readonly IStockTransactionRepository _transactionRepository;
    private readonly IStockLevelRepository _stockLevelRepository;
    private readonly IGenericRepository<StockBatch> _batchRepository;
    private readonly IGenericRepository<StockReservation> _reservationRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IStockTransactionValidationPipeline _validationPipeline;
    private readonly ILogger<StockService> _logger;
    private readonly IMapper _mapper;
    private readonly IStockNotificationService _notificationService;

    public StockService(
        IStockTransactionRepository transactionRepository,
        IStockLevelRepository stockLevelRepository,
        IGenericRepository<StockBatch> batchRepository,
        IGenericRepository<StockReservation> reservationRepository,
        IUnitOfWork unitOfWork,
        IStockTransactionValidationPipeline validationPipeline,
        ILogger<StockService> logger,
        IMapper mapper,
        IStockNotificationService notificationService)
    {
        _transactionRepository = transactionRepository;
        _stockLevelRepository = stockLevelRepository;
        _batchRepository = batchRepository;
        _reservationRepository = reservationRepository;
        _unitOfWork = unitOfWork;
        _validationPipeline = validationPipeline;
        _logger = logger;
        _mapper = mapper;
        _notificationService = notificationService;
    }

    public async Task<Guid> CreateStockTransactionAsync(Guid productId, Guid warehouseId, Guid? destinationWarehouseId, string transactionType, int quantity, string referenceNumber, DateTime transactionDate, Guid? batchId = null)
    {
        TransactionType type;
        if (int.TryParse(transactionType, out int enumValue))
        {
            type = (TransactionType)enumValue;
        }
        else if (!Enum.TryParse<TransactionType>(transactionType, true, out type))
        {
            throw new BadRequestException($"Invalid transaction type: {transactionType}");
        }

        if (type == TransactionType.Transfer && !destinationWarehouseId.HasValue)
        {
            throw new BadRequestException("Destination Warehouse is required for Transfers.");
        }

        // 1. Run Validation Pipeline (Checks basic logic like non-negative stock)
        var requestContext = new TransactionRequestContext { ProductId = productId, WarehouseId = warehouseId, Quantity = quantity, TransactionType = type };
        await _validationPipeline.ValidateAsync(requestContext);

        // 2. Check Reservations if it's an Outbound transaction (Sale/Transfer)
        if (type == TransactionType.Sale || type == TransactionType.Transfer)
        {
            var reservations = (await _reservationRepository.GetAllAsync())
                .Where(r => r.ProductId == productId && r.WarehouseId == warehouseId && r.Status == ReservationStatus.Pending)
                .Sum(r => r.Quantity);
            
            var stock = await _stockLevelRepository.GetByProductAndWarehouseAsync(productId, warehouseId);
            int onHand = stock?.QuantityOnHand ?? 0;
            
            if (onHand - reservations < quantity)
            {
                throw new BadRequestException($"Insufficient available stock. On Hand: {onHand}, Reserved: {reservations}, Requested: {quantity}");
            }
        }

        await _unitOfWork.BeginTransactionAsync();
        try
        {
            // 3. Update Stock Level
            var stock = await _stockLevelRepository.GetByProductAndWarehouseAsync(productId, warehouseId);
            if (stock == null)
            {
                stock = new StockLevel { StockLevelId = Guid.NewGuid(), ProductId = productId, WarehouseId = warehouseId, QuantityOnHand = 0 };
                await _stockLevelRepository.AddAsync(stock);
            }

            int quantityChange = type switch
            {
                TransactionType.Purchase => quantity,
                TransactionType.Sale => -quantity,
                TransactionType.Adjustment => quantity,
                TransactionType.Return => quantity,
                TransactionType.Transfer => -quantity,
                _ => quantity
            };
            stock.QuantityOnHand += quantityChange;

            // 4. Update Batch if applicable
            if (batchId.HasValue)
            {
                var batch = await _batchRepository.GetByIdAsync(batchId.Value);
                if (batch != null)
                {
                    batch.Quantity += quantityChange;
                    if (batch.Quantity < 0) throw new BadRequestException("Insufficient quantity in selected batch.");
                    _batchRepository.Update(batch);
                }
            }
            else if (type == TransactionType.Purchase)
            {
                // Auto-create a batch for purchases if none specified? 
                // Or let the caller decide. For now, let's keep it simple.
            }

            // 5. Record Transaction
            var transaction = new StockTransaction
            {
                TransactionId = Guid.NewGuid(),
                ProductId = productId,
                WarehouseId = warehouseId,
                TransactionType = type.ToString(),
                Quantity = quantity,
                UnitPrice = 0, // Should be passed in or fetched from PO
                Reference = string.IsNullOrWhiteSpace(referenceNumber) ? "N/A" : referenceNumber,
                TransactionDate = transactionDate != default ? transactionDate : DateTime.UtcNow
            };
            await _transactionRepository.AddAsync(transaction);

            // 6. Handle Transfer Destination
            if (type == TransactionType.Transfer && destinationWarehouseId.HasValue)
            {
                var destStock = await _stockLevelRepository.GetByProductAndWarehouseAsync(productId, destinationWarehouseId.Value);
                if (destStock == null)
                {
                    destStock = new StockLevel { StockLevelId = Guid.NewGuid(), ProductId = productId, WarehouseId = destinationWarehouseId.Value, QuantityOnHand = 0 };
                    await _stockLevelRepository.AddAsync(destStock);
                }
                destStock.QuantityOnHand += quantity;

                var destTransaction = new StockTransaction { TransactionId = Guid.NewGuid(), ProductId = productId, WarehouseId = destinationWarehouseId.Value, TransactionType = "TransferIn", Quantity = quantity, Reference = $"From: {warehouseId}", TransactionDate = transaction.TransactionDate };
                await _transactionRepository.AddAsync(destTransaction);
            }

            await _unitOfWork.CommitAsync();

            if (stock.Product != null)
                await _notificationService.NotifyStockUpdateAsync(productId, stock.Product.ProductName, stock.QuantityOnHand, stock.Product.ReorderLevel);

            return transaction.TransactionId;
        }
        catch
        {
            await _unitOfWork.RollbackAsync();
            throw;
        }
    }

    public async Task<IEnumerable<object>> GetAllStockAsync()
    {
        var stock = await _stockLevelRepository.GetAllAsync();
        return _mapper.Map<IEnumerable<StockLevelDto>>(stock);
    }

    public async Task<IEnumerable<object>> GetStockByProductAsync(Guid productId)
    {
        var stock = await _stockLevelRepository.GetByProductIdAsync(productId);
        return _mapper.Map<IEnumerable<StockLevelDto>>(stock);
    }

    public async Task<IEnumerable<object>> GetStockByWarehouseAsync(Guid warehouseId)
    {
        var stock = await _stockLevelRepository.GetByWarehouseIdAsync(warehouseId);
        return _mapper.Map<IEnumerable<StockLevelDto>>(stock);
    }

    public async Task<Guid> CreateReservationAsync(Guid productId, Guid warehouseId, int quantity, DateTime expiryDate, string reference)
    {
        var stock = await _stockLevelRepository.GetByProductAndWarehouseAsync(productId, warehouseId);
        int onHand = stock?.QuantityOnHand ?? 0;
        
        var existingReservations = (await _reservationRepository.GetAllAsync())
            .Where(r => r.ProductId == productId && r.WarehouseId == warehouseId && r.Status == ReservationStatus.Pending)
            .Sum(r => r.Quantity);

        if (onHand - existingReservations < quantity)
        {
            throw new BadRequestException("Insufficient available stock to create reservation.");
        }

        var reservation = new StockReservation
        {
            ReservationId = Guid.NewGuid(),
            ProductId = productId,
            WarehouseId = warehouseId,
            Quantity = quantity,
            ExpiryDate = expiryDate,
            Reference = reference,
            Status = ReservationStatus.Pending
        };

        await _reservationRepository.AddAsync(reservation);
        await _unitOfWork.SaveChangesAsync();
        return reservation.ReservationId;
    }

    public async Task CancelReservationAsync(Guid reservationId)
    {
        var reservation = await _reservationRepository.GetByIdAsync(reservationId);
        if (reservation == null) throw new NotFoundException("Reservation not found.");
        
        reservation.Status = ReservationStatus.Cancelled;
        _reservationRepository.Update(reservation);
        await _unitOfWork.SaveChangesAsync();
    }

    public async Task<IEnumerable<object>> GetActiveBatchesAsync(Guid productId, Guid warehouseId)
    {
        var batches = (await _batchRepository.GetAllAsync())
            .Where(b => b.ProductId == productId && b.WarehouseId == warehouseId && b.Quantity > 0 && (b.ExpiryDate == null || b.ExpiryDate > DateTime.UtcNow))
            .OrderBy(b => b.ExpiryDate ?? DateTime.MaxValue);
            
        return batches; // In a real app, Map to DTO
    }
}
