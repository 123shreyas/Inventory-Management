using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using InventoryManagement.Application.Features.Stock.Commands;
using InventoryManagement.Shared.Constants;
using InventoryManagement.Interfaces.Services;

namespace InventoryManagement.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class StockController : ControllerBase
{
    private readonly IStockService _stockService;

    public StockController(IStockService stockService)
    {
        _stockService = stockService;
    }

    [HttpGet]
    [Authorize(Roles = $"{Roles.InventoryClerk},{Roles.InventoryManager},{Roles.Admin}")]
    public async Task<IActionResult> GetAll()
    {
        var result = await _stockService.GetAllStockAsync();
        return Ok(result);
    }

    [HttpGet("{productId}")]
    [Authorize(Roles = $"{Roles.InventoryClerk},{Roles.InventoryManager},{Roles.Admin}")]
    public async Task<IActionResult> GetByProduct(Guid productId)
    {
        var result = await _stockService.GetStockByProductAsync(productId);
        return Ok(result);
    }

    [HttpGet("warehouse/{warehouseId}")]
    [Authorize(Roles = $"{Roles.InventoryClerk},{Roles.InventoryManager},{Roles.Admin}")]
    public async Task<IActionResult> GetByWarehouse(Guid warehouseId)
    {
        var result = await _stockService.GetStockByWarehouseAsync(warehouseId);
        return Ok(result);
    }

    [HttpPost("transaction")]
    [Authorize(Roles = $"{Roles.InventoryClerk},{Roles.InventoryManager},{Roles.Admin}")]
    public async Task<IActionResult> Transaction([FromBody] CreateStockTransactionCommand command)
    {
        var result = await _stockService.CreateStockTransactionAsync(
            command.ProductId, 
            command.WarehouseId, 
            command.DestinationWarehouseId, 
            command.TransactionType.ToString(), 
            command.Quantity, 
            command.ReferenceNumber, 
            command.TransactionDate,
            command.BatchId);
        return Ok(new { TransactionId = result });
    }

    [HttpPost("reserve")]
    [Authorize(Roles = $"{Roles.InventoryClerk},{Roles.InventoryManager},{Roles.Admin}")]
    public async Task<IActionResult> Reserve([FromBody] CreateReservationRequest request)
    {
        var result = await _stockService.CreateReservationAsync(
            request.ProductId, 
            request.WarehouseId, 
            request.Quantity, 
            request.ExpiryDate, 
            request.Reference);
        return Ok(new { ReservationId = result });
    }

    [HttpPost("reserve/{id}/cancel")]
    [Authorize(Roles = $"{Roles.InventoryClerk},{Roles.InventoryManager},{Roles.Admin}")]
    public async Task<IActionResult> CancelReservation(Guid id)
    {
        await _stockService.CancelReservationAsync(id);
        return Ok();
    }

    [HttpGet("{productId}/batches/{warehouseId}")]
    [Authorize(Roles = $"{Roles.InventoryClerk},{Roles.InventoryManager},{Roles.Admin}")]
    public async Task<IActionResult> GetBatches(Guid productId, Guid warehouseId)
    {
        var result = await _stockService.GetActiveBatchesAsync(productId, warehouseId);
        return Ok(result);
    }
}

public class CreateReservationRequest
{
    public Guid ProductId { get; set; }
    public Guid WarehouseId { get; set; }
    public int Quantity { get; set; }
    public DateTime ExpiryDate { get; set; }
    public string Reference { get; set; } = string.Empty;
}
