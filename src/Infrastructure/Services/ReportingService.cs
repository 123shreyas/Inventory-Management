using InventoryManagement.Interfaces.Repositories;
using InventoryManagement.Interfaces.Services;
using InventoryManagement.Domain.Entities;
using System.Linq;

namespace InventoryManagement.Infrastructure.Services;

public class ReportingService : IReportingService
{
    private readonly IProductRepository _productRepository;
    private readonly IStockLevelRepository _stockLevelRepository;
    private readonly IGenericRepository<StockBatch> _batchRepository;
    private readonly IStockTransactionRepository _transactionRepository;

    public ReportingService(
        IProductRepository productRepository,
        IStockLevelRepository stockLevelRepository,
        IGenericRepository<StockBatch> batchRepository,
        IStockTransactionRepository transactionRepository)
    {
        _productRepository = productRepository;
        _stockLevelRepository = stockLevelRepository;
        _batchRepository = batchRepository;
        _transactionRepository = transactionRepository;
    }

    public async Task<object> GetABCAnalysisAsync()
    {
        var products = await _productRepository.GetAllAsync();
        var stocks = await _stockLevelRepository.GetAllAsync();

        var table = products.Select(p => {
            var qty = stocks.Where(s => s.ProductId == p.ProductId).Sum(s => s.QuantityOnHand);
            return new { 
                p.ProductId, 
                p.ProductName, 
                Value = qty * p.Cost 
            };
        }).OrderByDescending(x => x.Value).ToList();

        decimal totalVal = table.Sum(x => x.Value);
        decimal cumulative = 0;

        var result = table.Select(x => {
            cumulative += x.Value;
            var pct = totalVal > 0 ? (cumulative / totalVal) * 100 : 0;
            string category = pct <= 70 ? "A" : (pct <= 90 ? "B" : "C");
            return new { x.ProductId, x.ProductName, x.Value, Category = category };
        });

        return result;
    }

    public async Task<object> GetStockAgingReportAsync()
    {
        var batches = await _batchRepository.GetAllAsync();
        var now = DateTime.UtcNow;

        var aging = batches.Select(b => new {
            b.BatchNumber,
            b.ProductId,
            b.WarehouseId,
            b.Quantity,
            DaysInStock = (now - b.DateReceived).Days,
            Status = (now - b.DateReceived).Days > 90 ? "Old" : "Fresh"
        });

        return aging;
    }

    public async Task<object> GetInventoryTurnoverAsync()
    {
        var transactions = await _transactionRepository.GetAllAsync();
        var stocks = await _stockLevelRepository.GetAllAsync();
        var products = await _productRepository.GetAllAsync();

        // Simplified COGS calculation based on Sales
        decimal cogs = 0;
        foreach (var tx in transactions.Where(t => t.TransactionType == "Sale"))
        {
            var p = products.FirstOrDefault(prod => prod.ProductId == tx.ProductId);
            if (p != null) cogs += tx.Quantity * p.Cost;
        }

        decimal avgInventory = products.Sum(p => {
            var qty = stocks.Where(s => s.ProductId == p.ProductId).Sum(s => s.QuantityOnHand);
            return qty * p.Cost;
        });

        decimal turnover = avgInventory > 0 ? cogs / avgInventory : 0;

        return new { COGS = cogs, AverageInventory = avgInventory, TurnoverRatio = turnover };
    }
}
