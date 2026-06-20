using Microsoft.AspNetCore.SignalR;

namespace backend.Hubs;

public class GameHub : Hub
{
    public override async Task OnConnectedAsync()
    {
        Console.WriteLine($"Connected: {Context.ConnectionId}");
        await base.OnConnectedAsync();
    }
    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        Console.WriteLine($"Disconnected: {Context.ConnectionId}");
        await base.OnDisconnectedAsync(exception);
    }
    public async Task JoinGameGroup(Guid gameId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, gameId.ToString());
    }
    public async Task LeaveGameGroup(Guid gameId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId,gameId.ToString()
        );
    }
}