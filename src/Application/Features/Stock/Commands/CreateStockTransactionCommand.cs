using MediatR;
using InventoryManagement.Domain.Enums;

namespace InventoryManagement.Application.Features.Stock.Commands;

public record CreateStockTransactionCommand(
    Guid ProductId,
    Guid WarehouseId,
    Guid? DestinationWarehouseId,
    TransactionType TransactionType,
    int Quantity,
    string ReferenceNumber,
    DateTime TransactionDate,
    Guid? BatchId = null
) : IRequest<Guid>;
