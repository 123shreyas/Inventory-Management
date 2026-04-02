namespace InventoryManagement.Domain.Entities;

public class Product
{
    public Guid ProductId { get; set; }
    public string SKU { get; set; } = string.Empty;
    public string ProductName { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public Guid CategoryId { get; set; }
    public string UnitOfMeasure { get; set; } = string.Empty;
    public decimal Cost { get; set; }
    public decimal ListPrice { get; set; }
    public int ReorderLevel { get; set; }
    public int SafetyStock { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedDate { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public ProductCategory? Category { get; set; }
    public ICollection<StockLevel> StockLevels { get; set; } = new List<StockLevel>();
    public ICollection<StockTransaction> StockTransactions { get; set; } = new List<StockTransaction>();
}
