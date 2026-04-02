using InventoryManagement.Domain.Entities;
using InventoryManagement.Interfaces.Repositories;
using InventoryManagement.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace InventoryManagement.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class SuppliersController : ControllerBase
{
    private readonly IGenericRepository<Supplier> _repository;
    private readonly IUnitOfWork _unitOfWork;

    public SuppliersController(IGenericRepository<Supplier> repository, IUnitOfWork unitOfWork)
    {
        _repository = repository;
        _unitOfWork = unitOfWork;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var suppliers = await _repository.GetAllAsync();
        return Ok(suppliers);
    }

    [HttpPost]
    public async Task<IActionResult> Create(Supplier supplier)
    {
        if (supplier == null) return BadRequest();
        
        await _repository.AddAsync(supplier);
        await _unitOfWork.SaveChangesAsync();
        
        return CreatedAtAction(nameof(GetAll), new { id = supplier.SupplierId }, supplier);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(Guid id, Supplier supplier)
    {
        if (id != supplier.SupplierId) return BadRequest();
        
        _repository.Update(supplier);
        await _unitOfWork.SaveChangesAsync();
        
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var supplier = await _repository.GetByIdAsync(id);
        if (supplier == null) return NotFound();
        
        _repository.Delete(supplier);
        await _unitOfWork.SaveChangesAsync();
        
        return NoContent();
    }
}
