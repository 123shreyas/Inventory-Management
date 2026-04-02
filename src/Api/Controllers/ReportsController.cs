using InventoryManagement.Interfaces.Services;
using Microsoft.AspNetCore.Mvc;

namespace InventoryManagement.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ReportsController : ControllerBase
{
    private readonly IReportingService _reportingService;

    public ReportsController(IReportingService reportingService)
    {
        _reportingService = reportingService;
    }

    [HttpGet("abc-analysis")]
    public async Task<IActionResult> GetABC()
    {
        return Ok(await _reportingService.GetABCAnalysisAsync());
    }

    [HttpGet("stock-aging")]
    public async Task<IActionResult> GetAging()
    {
        return Ok(await _reportingService.GetStockAgingReportAsync());
    }

    [HttpGet("turnover")]
    public async Task<IActionResult> GetTurnover()
    {
        return Ok(await _reportingService.GetInventoryTurnoverAsync());
    }
}
