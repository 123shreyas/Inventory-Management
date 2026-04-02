namespace InventoryManagement.Domain.Entities;

public enum ReservationStatus
{
    Pending,
    Expired,
    Fulfilled,
    Cancelled
}

public class StockReservation
{
    public Guid ReservationId { get; set; }
    public Guid ProductId { get; set; }
    public Guid WarehouseId { get; set; }
    public int Quantity { get; set; }
    public DateTime ReservationDate { get; set; } = DateTime.UtcNow;
    public DateTime ExpiryDate { get; set; }
    public string Reference { get; set; } = string.Empty; // e.g., Quote ID, Order ID
    public ReservationStatus Status { get; set; } = ReservationStatus.Pending;

    // Navigation properties
    public Product? Product { get; set; }
    public Warehouse? Warehouse { get; set; }
}
