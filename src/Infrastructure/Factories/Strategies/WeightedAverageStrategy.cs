using InventoryManagement.Interfaces.Factories;
using InventoryManagement.Interfaces.Repositories;

namespace InventoryManagement.Infrastructure.Factories.Strategies;

public class WeightedAverageStrategy : InventoryManagement.Interfaces.Factories.IInventoryValuationStrategy
{
    private readonly IStockLevelRepository _stockLevelRepository;
    private readonly IProductRepository _productRepository;

    public WeightedAverageStrategy(IStockLevelRepository stockLevelRepository, IProductRepository productRepository)
    {
        _stockLevelRepository = stockLevelRepository;
        _productRepository = productRepository;
    }

    public async Task<decimal> CalculateValuationAsync(Guid productId)
    {
        var product = await _productRepository.GetByIdAsync(productId);
        if (product == null) return 0;
        
        var stocks = await _stockLevelRepository.GetByProductIdAsync(productId);
        var totalQuantityOnHand = stocks.Sum(s => s.QuantityOnHand);

        if (totalQuantityOnHand <= 0) return 0;

        // Get all purchases for average calculation
        var purchases = (await _productRepository.GetByIdWithTransactionsAsync(productId))?.StockTransactions
            .Where(t => t.TransactionType == "Purchase")
            .ToList();

        if (purchases == null || !purchases.Any())
        {
            return totalQuantityOnHand * product.Cost;
        }

        var totalCost = purchases.Sum(p => p.Quantity * (p.UnitPrice > 0 ? p.UnitPrice : product.Cost));
        var totalQty = purchases.Sum(p => p.Quantity);

        decimal avgCost = totalQty > 0 ? totalCost / totalQty : product.Cost;

        return totalQuantityOnHand * avgCost;
    }
}
