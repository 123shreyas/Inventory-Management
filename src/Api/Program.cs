using InventoryManagement.Api.Middleware;
using InventoryManagement.Api;
using Microsoft.OpenApi.Models;
using InventoryManagement.Infrastructure.Data;
using InventoryManagement.Api.Hubs;
using InventoryManagement.Interfaces.Services;
using InventoryManagement.Api.Services;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddSignalR();
builder.Services.AddScoped<IStockNotificationService, StockNotificationService>();

builder.Services.AddCors(options =>
{
    options.AddPolicy("SignalRPolicy", builder =>
    {
        builder.WithOrigins("http://localhost:5173", "http://localhost:5174")
               .AllowAnyHeader()
               .AllowAnyMethod()
               .AllowCredentials();
    });
    
    options.AddDefaultPolicy(builder =>
    {
        builder.WithOrigins("http://localhost:5173", "http://localhost:5174")
               .AllowAnyHeader()
               .AllowAnyMethod()
               .AllowCredentials();
    });
});

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
    });
builder.Services.AddEndpointsApiExplorer();

builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "Inventory Management API", Version = "v1" });
    
    // JWT Authentication for Swagger
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Enter 'Bearer' [space] and then your valid token."
    });
    
    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            new string[] {}
        }
    });
});

builder.Services.AddWebAPIConfig(builder.Configuration);

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseMiddleware<GlobalExceptionMiddleware>();

app.UseCors();

app.UseHttpsRedirection();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapHub<InventoryHub>("/inventoryHub").RequireCors("SignalRPolicy");

// Seed Database
using (var scope = app.Services.CreateScope())
{
    var seeder = scope.ServiceProvider.GetRequiredService<DatabaseSeeder>();
    await seeder.SeedAsync();
}

app.Run();
