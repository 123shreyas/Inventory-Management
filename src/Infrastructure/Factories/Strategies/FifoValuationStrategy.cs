using InventoryManagement.Interfaces.Factories;
using InventoryManagement.Interfaces.Repositories;

namespace InventoryManagement.Infrastructure.Factories.Strategies;

public class FifoValuationStrategy : InventoryManagement.Interfaces.Factories.IInventoryValuationStrategy
{
    private readonly IStockLevelRepository _stockLevelRepository;
    private readonly IStockTransactionRepository _transactionRepository;
    private readonly IProductRepository _productRepository;

    public FifoValuationStrategy(IStockLevelRepository stockLevelRepository, IStockTransactionRepository transactionRepository, IProductRepository productRepository)
    {
        _stockLevelRepository = stockLevelRepository;
        _transactionRepository = transactionRepository;
        _productRepository = productRepository;
    }

    public async Task<decimal> CalculateValuationAsync(Guid productId)
    {
        var product = await _productRepository.GetByIdAsync(productId);
        if (product == null) return 0;
        
        var stocks = await _stockLevelRepository.GetByProductIdAsync(productId);
        var totalQuantityOnHand = stocks.Sum(s => s.QuantityOnHand);

        if (totalQuantityOnHand <= 0) return 0;

        // Get all purchases/returns sorted by date DESC (walk backwards from most recent)
        var transactions = (await _transactionRepository.GetAllAsync())
            .Where(t => t.ProductId == productId && (t.TransactionType == "Purchase" || t.TransactionType == "Return"))
            .OrderByDescending(t => t.TransactionDate)
            .ToList();

        decimal valuation = 0;
        int remainingQty = totalQuantityOnHand;

        foreach (var tx in transactions)
        {
            if (remainingQty <= 0) break;

            int qtyToTake = Math.Min(tx.Quantity, remainingQty);
            valuation += qtyToTake * (tx.UnitPrice > 0 ? tx.UnitPrice : product.Cost);
            remainingQty -= qtyToTake;
        }

        // If we still have remaining quantity (e.g. from initial stock not in transactions), use current product cost
        if (remainingQty > 0)
        {
            valuation += remainingQty * product.Cost;
        }

        return valuation;
    }
}
