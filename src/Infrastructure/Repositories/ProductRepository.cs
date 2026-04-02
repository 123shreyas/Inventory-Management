using InventoryManagement.Domain.Entities;
using InventoryManagement.Interfaces.Repositories;
using InventoryManagement.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace InventoryManagement.Infrastructure.Repositories;

public class ProductRepository : GenericRepository<Product>, IProductRepository
{
    public ProductRepository(ApplicationDbContext context) : base(context)
    {
    }

    public override async Task AddAsync(Product entity)
    {
        if (await SkuExistsAsync(entity.SKU))
        {
            throw new InventoryManagement.Shared.Exceptions.BadRequestException($"Product with SKU '{entity.SKU}' already exists.");
        }
        await _dbSet.AddAsync(entity);
    }

    public async Task<bool> SkuExistsAsync(string sku)
    {
        return await _dbSet.AnyAsync(p => p.SKU == sku);
    }

    public async Task<IEnumerable<Product>> GetPagedAsync(int pageNumber, int pageSize)
    {
        return await _dbSet
            .AsNoTracking()
            .Include(p => p.Category)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();
    }

    public override async Task<Product?> GetByIdAsync(Guid id)
    {
        return await _dbSet
            .Include(p => p.Category)
            .FirstOrDefaultAsync(p => p.ProductId == id);
    }

    public async Task<int> GetTotalCountAsync()
    {
        return await _dbSet.CountAsync();
    }

    public async Task<Product?> GetByIdWithTransactionsAsync(Guid id)
    {
        return await _dbSet
            .Include(p => p.StockTransactions)
            .FirstOrDefaultAsync(p => p.ProductId == id);
    }
}
