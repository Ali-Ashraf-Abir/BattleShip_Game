
using backend.Data;
using backend.Enums;
using backend.GameEngine;
using backend.Models;
using backend.Services;
using backend.Services.Interfaces;
using Microsoft.AspNetCore.Http.HttpResults;

public class GameService(ApplicationDbContext _db,GameStateManager _gameStateManager) : IGameService
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

        return game;
    }


}