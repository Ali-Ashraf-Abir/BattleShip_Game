
using backend.Data;
using backend.Enums;
using backend.Models;
using backend.Services.Interfaces;

public class GameService(ApplicationDbContext _db) : IGameService
{
    public async Task<Game> CreateGameAsync(Guid hostId,int gridSize)
    {
        var game = new Game
        {
            HostId = hostId,
            GridSize = gridSize,
            Status = GameStatus.WaitingForPlayer
        };
        _db.Games.Add(game);
        await _db.SaveChangesAsync();

        return game;
    }
}