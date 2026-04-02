namespace InventoryManagement.Domain.Entities;

public enum PurchaseOrderStatus
{
    Draft,
    Ordered,
    PartiallyReceived,
    Received,
    Cancelled
}

public class PurchaseOrder
{
    public Guid PurchaseOrderId { get; set; }
    public string OrderNumber { get; set; } = string.Empty;
    public Guid SupplierId { get; set; }
    public DateTime OrderDate { get; set; } = DateTime.UtcNow;
    public DateTime? ExpectedDeliveryDate { get; set; }
    public string ReferenceNumber { get; set; } = string.Empty;
    public string Remarks { get; set; } = string.Empty;
    public PurchaseOrderStatus Status { get; set; } = PurchaseOrderStatus.Draft;
    public decimal TotalAmount { get; set; }

    // Navigation properties
    public Supplier? Supplier { get; set; }
    public ICollection<PurchaseOrderDetail> Details { get; set; } = new List<PurchaseOrderDetail>();
}

public class PurchaseOrderDetail
{
    public Guid PurchaseOrderDetailId { get; set; }
    public Guid PurchaseOrderId { get; set; }
    public Guid ProductId { get; set; }
    public int QuantityOrdered { get; set; }
    public int QuantityReceived { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal Discount { get; set; }
    public decimal SubTotal => (QuantityOrdered * UnitPrice) - Discount;

    // Navigation properties
    public PurchaseOrder? PurchaseOrder { get; set; }
    public Product? Product { get; set; }
}
