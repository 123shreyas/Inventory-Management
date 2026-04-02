using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using InventoryManagement.Domain.Entities;
using InventoryManagement.Interfaces.Auth;
using Microsoft.EntityFrameworkCore;
using InventoryManagement.Shared.Constants;

namespace InventoryManagement.Infrastructure.Data;

public class DatabaseSeeder
{
    private readonly ApplicationDbContext _context;
    private readonly IPasswordHasher _passwordHasher;

    public DatabaseSeeder(ApplicationDbContext context, IPasswordHasher passwordHasher)
    {
        _context = context;
        _passwordHasher = passwordHasher;
    }

    public async Task SeedAsync()
    {
        Console.WriteLine("--- Database Seeder Started ---");
        try {
            await _context.Database.MigrateAsync();
            Console.WriteLine("Migrations applied.");

            // 1. Roles
            if (!await _context.Roles.AnyAsync()) {
                Console.WriteLine("Seeding Roles...");
                var roles = new List<Role> {
                    new Role { RoleId = Guid.NewGuid(), Name = Roles.Admin },
                    new Role { RoleId = Guid.NewGuid(), Name = Roles.InventoryManager },
                    new Role { RoleId = Guid.NewGuid(), Name = Roles.InventoryClerk }
                };
                await _context.Roles.AddRangeAsync(roles);
                await _context.SaveChangesAsync();
            }

            // 2. Users
            if (!await _context.Users.AnyAsync()) {
                Console.WriteLine("Seeding Admin User...");
                var adminRole = await _context.Roles.FirstAsync(r => r.Name == Roles.Admin);
                var adminUser = new User {
                    UserId = Guid.NewGuid(),
                    Username = "admin",
                    PasswordHash = _passwordHasher.HashPassword("Password123!"),
                    RoleId = adminRole.RoleId
                };
                await _context.Users.AddAsync(adminUser);
                await _context.SaveChangesAsync();
            }

            // 3. FORCE WIPE FOR THIS SESSION (to ensure robust data is loaded)
            Console.WriteLine("Cleaning inventory tables...");
            _context.StockLevels.RemoveRange(_context.StockLevels);
            _context.Products.RemoveRange(_context.Products);
            _context.ProductCategories.RemoveRange(_context.ProductCategories);
            _context.Warehouses.RemoveRange(_context.Warehouses);
            _context.Suppliers.RemoveRange(_context.Suppliers);
            await _context.SaveChangesAsync();

            // 4. Warehouses
            Console.WriteLine("Seeding Warehouses...");
            var warehouses = new List<Warehouse> {
                new Warehouse { WarehouseId = Guid.NewGuid(), WarehouseName = "North Hub", Location = "New York, USA", Capacity = 10000 },
                new Warehouse { WarehouseId = Guid.NewGuid(), WarehouseName = "South Distribution", Location = "Texas, USA", Capacity = 15000 },
                new Warehouse { WarehouseId = Guid.NewGuid(), WarehouseName = "Central Logistics", Location = "Chicago, USA", Capacity = 20000 }
            };
            await _context.Warehouses.AddRangeAsync(warehouses);
            await _context.SaveChangesAsync();

            // 5. Categories
            Console.WriteLine("Seeding Categories...");
            var categories = new List<ProductCategory> {
                new ProductCategory { CategoryId = Guid.NewGuid(), CategoryName = "Electronics", Description = "Electronic devices and accessories" },
                new ProductCategory { CategoryId = Guid.NewGuid(), CategoryName = "Home & Office", Description = "Office furniture and supplies" },
                new ProductCategory { CategoryId = Guid.NewGuid(), CategoryName = "Groceries", Description = "Perishable and non-perishable food" },
                new ProductCategory { CategoryId = Guid.NewGuid(), CategoryName = "Automotive", Description = "Vehicle parts and tools" },
                new ProductCategory { CategoryId = Guid.NewGuid(), CategoryName = "Health & Beauty", Description = "Wellness and personal care" }
            };
            await _context.ProductCategories.AddRangeAsync(categories);
            await _context.SaveChangesAsync();

            // 6. Suppliers
            Console.WriteLine("Seeding Suppliers...");
            var suppliersList = new List<Supplier> {
                new Supplier { SupplierId = Guid.NewGuid(), SupplierName = "Global Electronics Ltd", Email = "contact@globalelec.com", Phone = "123-456-7890", Website = "www.globalelec.com" },
                new Supplier { SupplierId = Guid.NewGuid(), SupplierName = "Prime Furniture Co", Email = "sales@primefurniture.net", Phone = "987-654-3210", Website = "primefurniture.net" },
                new Supplier { SupplierId = Guid.NewGuid(), SupplierName = "Fresh Foods Market", Email = "orders@freshfoods.org", Phone = "555-0199", Website = "freshfoods.org" },
                new Supplier { SupplierId = Guid.NewGuid(), SupplierName = "Auto Parts Direct", Email = "support@autoparts.com", Phone = "555-2020", Website = "autoparts.com" }
            };
            await _context.Suppliers.AddRangeAsync(suppliersList);
            await _context.SaveChangesAsync();

            // 7. Products
            Console.WriteLine("Seeding Products...");
            var productList = new List<Product> {
                new Product { ProductId = Guid.NewGuid(), SKU = "ELEC-001", ProductName = "UltraHD Projector X1", CategoryId = categories[0].CategoryId, UnitOfMeasure = "pcs", Cost = 450, ListPrice = 899, ReorderLevel = 5, SafetyStock = 2 },
                new Product { ProductId = Guid.NewGuid(), SKU = "ELEC-002", ProductName = "Precision Mouse M5", CategoryId = categories[0].CategoryId, UnitOfMeasure = "pcs", Cost = 25, ListPrice = 49, ReorderLevel = 20, SafetyStock = 5 },
                new Product { ProductId = Guid.NewGuid(), SKU = "OFF-001", ProductName = "Ergonomic Desk Chair", CategoryId = categories[1].CategoryId, UnitOfMeasure = "pcs", Cost = 120, ListPrice = 249, ReorderLevel = 8, SafetyStock = 2 },
                new Product { ProductId = Guid.NewGuid(), SKU = "GROC-001", ProductName = "Whole Bean Arabica", CategoryId = categories[2].CategoryId, UnitOfMeasure = "kg", Cost = 8, ListPrice = 18, ReorderLevel = 50, SafetyStock = 10 },
                new Product { ProductId = Guid.NewGuid(), SKU = "AUTO-001", ProductName = "Premium Synthetic Oil", CategoryId = categories[3].CategoryId, UnitOfMeasure = "L", Cost = 15, ListPrice = 35, ReorderLevel = 40, SafetyStock = 10 }
            };
            await _context.Products.AddRangeAsync(productList);
            await _context.SaveChangesAsync();

            // 8. Stock Levels
            Console.WriteLine("Seeding Stock Levels...");
            var stockLevels = new List<StockLevel> {
                new StockLevel { StockLevelId = Guid.NewGuid(), ProductId = productList[0].ProductId, WarehouseId = warehouses[0].WarehouseId, QuantityOnHand = 15, ReorderLevel = 5, SafetyStock = 2 },
                new StockLevel { StockLevelId = Guid.NewGuid(), ProductId = productList[1].ProductId, WarehouseId = warehouses[0].WarehouseId, QuantityOnHand = 120, ReorderLevel = 20, SafetyStock = 5 },
                new StockLevel { StockLevelId = Guid.NewGuid(), ProductId = productList[3].ProductId, WarehouseId = warehouses[1].WarehouseId, QuantityOnHand = 10, ReorderLevel = 8, SafetyStock = 2 },
                new StockLevel { StockLevelId = Guid.NewGuid(), ProductId = productList[4].ProductId, WarehouseId = warehouses[2].WarehouseId, QuantityOnHand = 250, ReorderLevel = 40, SafetyStock = 10 }
            };
            await _context.StockLevels.AddRangeAsync(stockLevels);
            await _context.SaveChangesAsync();
            
            Console.WriteLine("--- Database Seeder Completed Successfully ---");
        } catch (Exception ex) {
            Console.WriteLine("!!! SEEDER ERROR !!!: " + ex.Message);
            if (ex.InnerException != null) Console.WriteLine("Inner Exception: " + ex.InnerException.Message);
        }
    }
}
