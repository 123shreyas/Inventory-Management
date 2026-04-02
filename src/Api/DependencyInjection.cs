using FluentValidation;
using InventoryManagement.Application.Features.Products.Commands;
using InventoryManagement.Application.Features.Products.Validators;
using InventoryManagement.Application.Features.Stock.Commands;
using InventoryManagement.Application.Features.Stock.Validators;
using InventoryManagement.Interfaces.Pipelines;
using InventoryManagement.Application.Mappings;
using InventoryManagement.Infrastructure.Auth;
using InventoryManagement.Infrastructure.ChainHandlers;
using InventoryManagement.Infrastructure.Data;
using InventoryManagement.Infrastructure.Factories;
using InventoryManagement.Infrastructure.Repositories;
using InventoryManagement.Infrastructure.UnitOfWork;
using InventoryManagement.Interfaces;
using InventoryManagement.Interfaces.Auth;
using InventoryManagement.Interfaces.Factories;
using InventoryManagement.Interfaces.Repositories;
using InventoryManagement.Interfaces.Services;
using InventoryManagement.Infrastructure.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Serilog;
using System.Text;
using Microsoft.Extensions.DependencyInjection;
using AutoMapper;

namespace InventoryManagement.Api;

public static class DependencyInjection
{
    public static IServiceCollection AddWebAPIConfig(this IServiceCollection services, IConfiguration configuration)
    {
        // 1. Serilog
        Log.Logger = new LoggerConfiguration()
            .ReadFrom.Configuration(configuration)
            .WriteTo.Console()
            .CreateLogger();

        services.AddLogging(builder =>
        {
            builder.ClearProviders();
            builder.AddSerilog();
        });

        // 2. DbContext (MySQL with EF Core)
        var connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? "Server=localhost;Database=InventoryDb;User=root;Password=password;";
        services.AddDbContext<ApplicationDbContext>(options =>
            options.UseMySql(connectionString, ServerVersion.AutoDetect(connectionString)));

        // 3. Generic + Specific Repositories (Repository Pattern)
        services.AddScoped(typeof(IGenericRepository<>), typeof(GenericRepository<>));
        services.AddScoped<IProductRepository, ProductRepository>();
        services.AddScoped<IStockLevelRepository, StockLevelRepository>();
        services.AddScoped<IStockTransactionRepository, StockTransactionRepository>();

        // 4. Unit of Work
        services.AddScoped<IUnitOfWork, UnitOfWork>();

        // 5. Core Services (CQRS via Services)
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IProductService, ProductService>();
        services.AddScoped<IStockService, StockService>();
        services.AddScoped<IInventoryService, InventoryService>();
        services.AddScoped<IPurchaseOrderService, PurchaseOrderService>();
        services.AddScoped<IReportingService, ReportingService>();

        // 6. AutoMapper
        services.AddAutoMapper(typeof(MappingProfile));

        // 7. FluentValidation
        services.AddValidatorsFromAssemblyContaining<CreateProductCommandValidator>();

        // 8. Auth
        services.AddScoped<IJwtProvider, JwtProvider>();

        var jwtKey = configuration["Jwt:SecretKey"] ?? "ThisIsASuperSecretKeyThatMeetsTheLengthRequirementForHmacSha256!";
        var jwtIssuer = configuration["Jwt:Issuer"] ?? "InventoryApp";
        var jwtAudience = configuration["Jwt:Audience"] ?? "InventoryApp";

        services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
            .AddJwtBearer(options =>
            {
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidateAudience = true,
                    ValidateLifetime = true,
                    ValidateIssuerSigningKey = true,
                    ValidIssuer = jwtIssuer,
                    ValidAudience = jwtAudience,
                    IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
                };
            });

        services.AddAuthorization();

        // 10. Inventory Valuation Factory (Factory Pattern)
        services.AddScoped<IInventoryValuationFactory, InventoryValuationFactory>();

        // 11. Stock Transaction Validation Pipeline (Chain of Responsibility Pattern)
        services.AddScoped<IStockTransactionValidationPipeline, StockTransactionValidationPipeline>();

        // 12. Security & Additional Services
        services.AddScoped<IPasswordHasher, BCryptPasswordHasher>();
        services.AddSingleton<IInventoryAnalyticsService, InventoryAnalyticsService>();

        // 13. Data Seeder
        services.AddScoped<DatabaseSeeder>();

        return services;
    }
}
