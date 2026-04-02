namespace InventoryManagement.Domain.Entities;

public class StockBatch
{
    public Guid StockBatchId { get; set; }
    public Guid ProductId { get; set; }
    public Guid WarehouseId { get; set; }
    public string BatchNumber { get; set; } = string.Empty;
    public DateTime? ExpiryDate { get; set; }
    public int Quantity { get; set; }
    public DateTime DateReceived { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public Product? Product { get; set; }
    public Warehouse? Warehouse { get; set; }
}
