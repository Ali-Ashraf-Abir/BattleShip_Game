namespace backend.Services.Interfaces;
using backend.Models;

public interface IGameService
{
    Task<Game> CreateGameAsync(Guid hostId,int gridSize);
    Task<Game> JoinGameAsync(Guid playerId,Guid gameId);

    public Task<List<Game>> AvailableGames();
    public  Task<Game?> GetGameAsync(Guid gameId);
    Task LeaveGameAsync(Guid gameId, Guid playerId);
    Task DeleteGameAsync(Guid gameId);
}