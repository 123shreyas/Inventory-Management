namespace InventoryManagement.Domain.Entities;

public class StockTransaction
{
    public Guid TransactionId { get; set; }
    public Guid ProductId { get; set; }
    public Guid WarehouseId { get; set; }
    public string TransactionType { get; set; } = string.Empty; // e.g., Adjustment, Transfer, Purchase, Sale
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public DateTime TransactionDate { get; set; }
    public string Reference { get; set; } = string.Empty;

    // Navigation properties
    public Product? Product { get; set; }
    public Warehouse? Warehouse { get; set; }
}
