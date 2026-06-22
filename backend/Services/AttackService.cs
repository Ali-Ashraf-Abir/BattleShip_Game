using backend.Data;
using backend.Dtos;
using backend.Enums;
using backend.GameEngine;
using backend.Hubs;
using backend.Models;
using backend.Services.Interfaces;
using bakcend.Enums;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace backend.Services;

public class AttackService(
    GameStateManager state,
    ApplicationDbContext _db,
    IHubContext<GameHub> _hub) : IAttackService
{
    public async Task<AttackResultDto> AttackAsync(AttackDto dto)
    {
        var game = await _db.Games.FindAsync(dto.GameId);
        if (game == null)
        {
            throw new InvalidOperationException("Game not found");
        }

        if (game.Status != GameStatus.InProgress)
        {
            throw new InvalidOperationException("Game is not in progress");
        }

        if (game.CurrentTurnPlayerId != dto.AttackerId)
        {
            throw new InvalidOperationException("It is not this player's turn");
        }

        if (dto.X < 0 || dto.Y < 0 || dto.X >= game.GridSize || dto.Y >= game.GridSize)
        {
            throw new InvalidOperationException("Attack coordinates are outside the board");
        }

        var defenderId = dto.AttackerId == game.HostId ? game.OpponentId : game.HostId;
        if (defenderId == null)
        {
            throw new InvalidOperationException("Game has no opponent yet");
        }

        var alreadyAttacked = await _db.Attacks.AnyAsync(a =>
            a.GameId == dto.GameId &&
            a.AttackerId == dto.AttackerId &&
            a.X == dto.X &&
            a.Y == dto.Y);
        if (alreadyAttacked)
        {
            throw new InvalidOperationException("This cell has already been attacked");
        }

        // Defender's ships are the ones being fired at.
        var defenderShips = await _db.Ships
            .Where(s => s.GameId == dto.GameId && s.PlayerId == defenderId)
            .ToListAsync();

        var hitShip = defenderShips.FirstOrDefault(s => OccupiesCell(s, dto.X, dto.Y));
        var isHit = hitShip != null;

        var attack = new Attack
        {
            Id = Guid.NewGuid(),
            GameId = dto.GameId,
            AttackerId = dto.AttackerId,
            X = dto.X,
            Y = dto.Y,
            IsHit = isHit
        };
        _db.Attacks.Add(attack);

        // Previous successful hits by this attacker, used to work out if a ship is now fully sunk.
        var attackerHits = await _db.Attacks
            .Where(a => a.GameId == dto.GameId && a.AttackerId == dto.AttackerId && a.IsHit)
            .Select(a => new { a.X, a.Y })
            .ToListAsync();

        ShipType? sunkShipType = null;
        bool isGameOver = false;
        Guid? winnerId = null;

        if (isHit && hitShip != null)
        {
            var hitCells = attackerHits
                .Select(a => (a.X, a.Y))
                .Append((dto.X, dto.Y))
                .ToHashSet();

            var shipCells = GetOccupiedCells(hitShip);
            var isSunk = shipCells.All(hitCells.Contains);

            if (isSunk)
            {
                sunkShipType = hitShip.ShipType;
            }

            // Game is over once every cell of every defender ship has been hit.
            var allDefenderCells = defenderShips.SelectMany(GetOccupiedCells).ToHashSet();
            isGameOver = allDefenderCells.All(hitCells.Contains);
        }

        Guid nextTurnPlayerId;

        if (isGameOver)
        {
            winnerId = dto.AttackerId;
            var loserId = defenderId.Value;

            game.Status = GameStatus.Finished;
            game.CurrentTurnPlayerId = null;
            game.WinnerId = winnerId;
            nextTurnPlayerId = Guid.Empty;

            var winner = await _db.Users.FindAsync(winnerId);
            var loser = await _db.Users.FindAsync(loserId);

            if (winner != null)
            {
                winner.Wins += 1;
                winner.GamesPlayed += 1;
            }
            if (loser != null)
            {
                loser.Losses += 1;
                loser.GamesPlayed += 1;
            }

            _db.MatchHistories.Add(new MatchHistory
            {
                Id = Guid.NewGuid(),
                WinnerId = winnerId.Value,
                LoserId = loserId,
                PlayedAt = DateTime.UtcNow
            });
        }
        else
        {
            // Miss or hit but not game-over: turn passes to the defender.
            // (Classic Battleship rule: a hit does NOT grant another turn here.
            //  If you want "hit again on a hit", swap this for: isHit ? dto.AttackerId : defenderId.Value)
            nextTurnPlayerId = defenderId.Value;
            game.CurrentTurnPlayerId = nextTurnPlayerId;
        }

        await _db.SaveChangesAsync();

        if (state.TryGetGame(dto.GameId, out var gameState))
        {
            // CurrentTurnPlayerId on GameState is non-nullable; on game over there's no
            // "next" turn, so leave it pointing at whoever last had it rather than guessing.
            if (!isGameOver)
            {
                gameState.CurrentTurnPlayerId = nextTurnPlayerId;
            }
        }

        var result = new AttackResultDto
        {
            GameId = dto.GameId,
            AttackerId = dto.AttackerId,
            X = dto.X,
            Y = dto.Y,
            IsHit = isHit,
            SunkShipType = sunkShipType,
            IsGameOver = isGameOver,
            WinnerId = winnerId,
            NextTurnPlayerId = nextTurnPlayerId
        };

        await _hub.Clients
            .Group(dto.GameId.ToString())
            .SendAsync("AttackResult", result);

        if (sunkShipType != null)
        {
            await _hub.Clients
                .Group(dto.GameId.ToString())
                .SendAsync("ShipSunk", new
                {
                    GameId = dto.GameId,
                    DefenderId = defenderId,
                    ShipType = sunkShipType
                });
        }

        if (isGameOver)
        {
            await _hub.Clients
                .Group(dto.GameId.ToString())
                .SendAsync("GameOver", new
                {
                    GameId = dto.GameId,
                    WinnerId = winnerId,
                    LoserId = defenderId
                });
        }

        return result;
    }

    private static bool OccupiesCell(Ship ship, int x, int y)
    {
        if (ship.IsVertical)
        {
            return x == ship.StartX && y >= ship.StartY && y < ship.StartY + ship.Length;
        }
        return y == ship.StartY && x >= ship.StartX && x < ship.StartX + ship.Length;
    }

    private static IEnumerable<(int X, int Y)> GetOccupiedCells(Ship ship)
    {
        for (int i = 0; i < ship.Length; i++)
        {
            var x = ship.IsVertical ? ship.StartX : ship.StartX + i;
            var y = ship.IsVertical ? ship.StartY + i : ship.StartY;
            yield return (x, y);
        }
    }
}