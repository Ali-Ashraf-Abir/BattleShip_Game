
using backend.Data;
using backend.Enums;
using backend.GameEngine;
using backend.Hubs;
using backend.Models;
using backend.Services;
using backend.Services.Interfaces;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

public class GameService(ApplicationDbContext _db, GameStateManager _gameStateManager, IHubContext<GameHub> _hub) : IGameService
{
    public async Task<Game> CreateGameAsync(Guid hostId, int gridSize)
    {

        var game = new Game
        {
            HostId = hostId,
            GridSize = gridSize,
            Status = GameStatus.WaitingForPlayer,

        };
        _db.Games.Add(game);
        await _db.SaveChangesAsync();

        return game;
    }

    public async Task<Game> JoinGameAsync(Guid playerId, Guid gameId)
    {
        var game = await _db.Games.FindAsync(gameId);
        if (game == null)
        {
            throw new Exception("Game not found");
        }

        if (game.HostId == playerId)
        {
            throw new Exception("You cannot join your own game");
        }

        if (game.OpponentId != null)
        {
            throw new Exception("Game already has an opponent");
        }
        game.OpponentId = playerId;
        game.Status = GameStatus.InProgress;
        game.CurrentTurnPlayerId = game.HostId;
        game.OpponentId = playerId;
        game.Status = GameStatus.PlacingShips;

        var gameState = new GameState(
            game.Id,
            game.GridSize);

        _gameStateManager.AddGame(gameState);
        await _db.SaveChangesAsync();
        await _hub.Clients
                    .Group(gameId.ToString())
                    .SendAsync(
                        "PlayerJoined",
                        new
                        {
                            GameId = gameId,
                            PlayerId = playerId
                        });
        return game;
    }

    public async Task<List<Game>> AvailableGames()
    {
        var openGames = await _db.Games
    .Where(g => g.OpponentId == null)
    .Include(g => g.Opponent)
    .Include(g => g.Host)
    .ToListAsync();

        return openGames;
    }
    public async Task<Game?> GetGameAsync(Guid gameId)
    {
        return await _db.Games
            .Include(g => g.Host)
            .Include(g => g.Opponent)
            .FirstOrDefaultAsync(g => g.Id == gameId);
    }

}