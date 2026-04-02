using InventoryManagement.Domain.Entities;

namespace InventoryManagement.Interfaces.Repositories;

public interface IProductRepository : IGenericRepository<Product>
{
    Task<bool> SkuExistsAsync(string sku);
    Task<IEnumerable<Product>> GetPagedAsync(int pageNumber, int pageSize);
    Task<int> GetTotalCountAsync();
    Task<Product?> GetByIdWithTransactionsAsync(Guid id);
}
