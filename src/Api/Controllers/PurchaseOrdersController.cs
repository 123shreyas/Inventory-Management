using InventoryManagement.Interfaces.Services;
using Microsoft.AspNetCore.Mvc;

namespace InventoryManagement.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PurchaseOrdersController : ControllerBase
{
    private readonly IPurchaseOrderService _poService;

    public PurchaseOrdersController(IPurchaseOrderService poService)
    {
        _poService = poService;
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreatePoRequest request)
    {
        var items = request.Items.Select(i => (i.ProductId, i.Quantity, i.UnitPrice));
        var id = await _poService.CreatePurchaseOrderAsync(request.SupplierId, items);
        return Ok(new { PurchaseOrderId = id });
    }

    [HttpPost("{id}/receive")]
    public async Task<IActionResult> Receive(Guid id, [FromQuery] Guid warehouseId)
    {
        await _poService.ReceivePurchaseOrderAsync(id, warehouseId);
        return Ok();
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        return Ok(await _poService.GetAllPurchaseOrdersAsync());
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        return Ok(await _poService.GetPurchaseOrderByIdAsync(id));
    }
}

public class CreatePoRequest
{
    public Guid SupplierId { get; set; }
    public List<PoItemRequest> Items { get; set; } = new();
}

public class PoItemRequest
{
    public Guid ProductId { get; set; }
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
}
