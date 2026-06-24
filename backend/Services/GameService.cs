
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
        var existingGames = await _db.Games
            .Where(g => g.HostId == hostId && g.Status == GameStatus.WaitingForPlayer)
            .ToListAsync();

        if (existingGames.Any())
        {
            var existingGameIds = existingGames.Select(g => g.Id).ToList();

            var ships = await _db.Ships
                .Where(s => existingGameIds.Contains(s.GameId))
                .ToListAsync();
            _db.Ships.RemoveRange(ships);

            var attacks = await _db.Attacks
                .Where(a => existingGameIds.Contains(a.GameId))
                .ToListAsync();
            _db.Attacks.RemoveRange(attacks);

            _db.Games.RemoveRange(existingGames);
            await _db.SaveChangesAsync();
        }

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
    public async Task LeaveGameAsync(Guid gameId, Guid playerId)
    {
        var game = await _db.Games.FindAsync(gameId);
        if (game == null) return;

        bool isHost = game.HostId == playerId;
        bool isOpponent = game.OpponentId == playerId;

        if (!isHost && !isOpponent) return;

        if (isHost)
            game.HostConnected = false;
        else
            game.OpponentConnected = false;

        if (!game.HostConnected && !game.OpponentConnected)
        {
            await DeleteGameAsync(gameId);
        }
        else
        {
            await _db.SaveChangesAsync();
        }
    }

    public async Task DeleteGameAsync(Guid gameId)
    {
        var ships = await _db.Ships
            .Where(s => s.GameId == gameId)
            .ToListAsync();
        _db.Ships.RemoveRange(ships);

        var attacks = await _db.Attacks
            .Where(a => a.GameId == gameId)
            .ToListAsync();
        _db.Attacks.RemoveRange(attacks);

        var game = await _db.Games.FindAsync(gameId);
        if (game != null)
            _db.Games.Remove(game);

        _gameStateManager.RemoveGame(gameId);

        await _db.SaveChangesAsync();
    }
}