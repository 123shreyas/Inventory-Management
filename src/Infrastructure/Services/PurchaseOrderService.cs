using InventoryManagement.Domain.Entities;
using InventoryManagement.Interfaces;
using InventoryManagement.Interfaces.Repositories;
using InventoryManagement.Interfaces.Services;
using InventoryManagement.Shared.Exceptions;
using Microsoft.Extensions.Logging;

namespace InventoryManagement.Infrastructure.Services;

public class PurchaseOrderService : IPurchaseOrderService
{
    private readonly IGenericRepository<PurchaseOrder> _poRepository;
    private readonly IGenericRepository<PurchaseOrderDetail> _detailRepository;
    private readonly IStockService _stockService;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<PurchaseOrderService> _logger;

    public PurchaseOrderService(
        IGenericRepository<PurchaseOrder> poRepository,
        IGenericRepository<PurchaseOrderDetail> detailRepository,
        IStockService stockService,
        IUnitOfWork unitOfWork,
        ILogger<PurchaseOrderService> logger)
    {
        _poRepository = poRepository;
        _detailRepository = detailRepository;
        _stockService = stockService;
        _unitOfWork = unitOfWork;
        _logger = logger;
    }

    public async Task<Guid> CreatePurchaseOrderAsync(Guid supplierId, IEnumerable<(Guid productId, int quantity, decimal unitPrice)> items)
    {
        await _unitOfWork.BeginTransactionAsync();
        try
        {
            var po = new PurchaseOrder
            {
                PurchaseOrderId = Guid.NewGuid(),
                OrderNumber = $"PO-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString().Substring(0, 4).ToUpper()}",
                SupplierId = supplierId,
                OrderDate = DateTime.UtcNow,
                Status = PurchaseOrderStatus.Ordered,
                TotalAmount = items.Sum(i => i.quantity * i.unitPrice)
            };

            await _poRepository.AddAsync(po);

            foreach (var item in items)
            {
                var detail = new PurchaseOrderDetail
                {
                    PurchaseOrderDetailId = Guid.NewGuid(),
                    PurchaseOrderId = po.PurchaseOrderId,
                    ProductId = item.productId,
                    QuantityOrdered = item.quantity,
                    QuantityReceived = 0,
                    UnitPrice = item.unitPrice
                };
                await _detailRepository.AddAsync(detail);
            }

            await _unitOfWork.CommitAsync();
            return po.PurchaseOrderId;
        }
        catch
        {
            await _unitOfWork.RollbackAsync();
            throw;
        }
    }

    public async Task ReceivePurchaseOrderAsync(Guid purchaseOrderId, Guid warehouseId)
    {
        var po = await _poRepository.GetByIdAsync(purchaseOrderId);
        if (po == null) throw new NotFoundException("Purchase Order not found.");
        if (po.Status == PurchaseOrderStatus.Received) throw new BadRequestException("Purchase Order already received.");

        await _unitOfWork.BeginTransactionAsync();
        try
        {
            // For simplified logic, we receive everything at once
            foreach (var detail in po.Details)
            {
                detail.QuantityReceived = detail.QuantityOrdered;
                
                // Create stock transaction for each received item
                await _stockService.CreateStockTransactionAsync(
                    detail.ProductId, 
                    warehouseId, 
                    null, 
                    "Purchase", 
                    detail.QuantityOrdered, 
                    po.OrderNumber, 
                    DateTime.UtcNow
                );
            }

            po.Status = PurchaseOrderStatus.Received;
            _poRepository.Update(po);
            
            await _unitOfWork.CommitAsync();
        }
        catch
        {
            await _unitOfWork.RollbackAsync();
            throw;
        }
    }

    public async Task<object> GetPurchaseOrderByIdAsync(Guid id)
    {
        return await _poRepository.GetByIdAsync(id);
    }

    public async Task<IEnumerable<object>> GetAllPurchaseOrdersAsync()
    {
        return await _poRepository.GetAllAsync();
    }
}
