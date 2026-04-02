using InventoryManagement.Domain.Entities;
using InventoryManagement.Interfaces.Repositories;
using InventoryManagement.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace InventoryManagement.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class CategoriesController : ControllerBase
{
    private readonly IGenericRepository<ProductCategory> _repository;
    private readonly IUnitOfWork _unitOfWork;

    public CategoriesController(IGenericRepository<ProductCategory> repository, IUnitOfWork unitOfWork)
    {
        _repository = repository;
        _unitOfWork = unitOfWork;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var categories = await _repository.GetAllAsync();
        return Ok(categories);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var category = await _repository.GetByIdAsync(id);
        if (category == null) return NotFound();
        return Ok(category);
    }

    [HttpPost]
    [Authorize(Roles = "Admin,InventoryManager")]
    public async Task<IActionResult> Create(ProductCategory category)
    {
        if (category == null) return BadRequest();
        category.CategoryId = Guid.NewGuid();
        await _repository.AddAsync(category);
        await _unitOfWork.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = category.CategoryId }, category);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Admin,InventoryManager")]
    public async Task<IActionResult> Update(Guid id, ProductCategory category)
    {
        if (id != category.CategoryId) return BadRequest();
        _repository.Update(category);
        await _unitOfWork.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin,InventoryManager")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var category = await _repository.GetByIdAsync(id);
        if (category == null) return NotFound();
        _repository.Delete(category);
        await _unitOfWork.SaveChangesAsync();
        return NoContent();
    }
}
