using backend.Data;
using backend.Models;
using backend.Services.Interfaces;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace backend.Hubs;

public class GameHub(IGameService _gameService, ApplicationDbContext _db) : Hub
{
    public override async Task OnConnectedAsync()
    {
        Console.WriteLine($"Connected: {Context.ConnectionId}");
        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        Console.WriteLine($"Disconnected: {Context.ConnectionId}");

        // Look up which game this connection belonged to
        var mapping = await _db.ConnectionMappings
            .FirstOrDefaultAsync(m => m.ConnectionId == Context.ConnectionId);

        if (mapping != null)
        {
            _db.ConnectionMappings.Remove(mapping);
            await _db.SaveChangesAsync();
            await _gameService.LeaveGameAsync(mapping.GameId, mapping.PlayerId);
        }

        await base.OnDisconnectedAsync(exception);
    }

    public async Task JoinGameGroup(Guid gameId, Guid playerId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, gameId.ToString());

        // Track which player owns this connection
        _db.ConnectionMappings.Add(new ConnectionMapping
        {
            ConnectionId = Context.ConnectionId,
            GameId = gameId,
            PlayerId = playerId
        });
        await _db.SaveChangesAsync();
    }

    public async Task LeaveGameGroup(Guid gameId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, gameId.ToString());
    }
}