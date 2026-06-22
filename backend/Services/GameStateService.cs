using backend.Data;
using backend.Dtos;
using backend.Models;
using backend.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace backend.Services;

public class GameStateService(ApplicationDbContext _db) : IGameStateService
{
    public async Task<GameStateDto> GetStateAsync(Guid gameId, Guid requestingPlayerId)
    {
        var game = await _db.Games.FindAsync(gameId);
        if (game == null)
        {
            throw new InvalidOperationException("Game not found");
        }

        var isHost = requestingPlayerId == game.HostId;
        var isOpponent = game.OpponentId.HasValue && requestingPlayerId == game.OpponentId.Value;
        if (!isHost && !isOpponent)
        {
            throw new InvalidOperationException("Player is not part of this game");
        }

        var opponentPlayerId = isHost ? game.OpponentId : game.HostId;

        var ships = await _db.Ships
            .Where(s => s.GameId == gameId)
            .ToListAsync();

        var myShips = ships
            .Where(s => s.PlayerId == requestingPlayerId)
            .Select(ToShipDto)
            .ToList();

        var opponentShips = opponentPlayerId.HasValue
            ? ships.Where(s => s.PlayerId == opponentPlayerId.Value).ToList()
            : [];

        var attacks = await _db.Attacks
            .Where(a => a.GameId == gameId)
            .ToListAsync();
        // Note: no ordering applied — Attack has no CreatedAt/sequence column,
        // and Guid.Id ordering is NOT chronological. Fine for the frontend's
        // current use (marking which cells were hit/missed), but if you ever
        // need attack order (e.g. animating the battle), add a CreatedAt
        // column to Attack and order by that instead.

        // Cells *I* have hit on the opponent's board, used to compute which
        // of their ships are sunk without ever exposing their coordinates.
        var myHitCells = attacks
            .Where(a => a.AttackerId == requestingPlayerId && a.IsHit)
            .Select(a => (a.X, a.Y))
            .ToHashSet();

        var opponentShipSummary = opponentShips
            .Select(ship => new OpponentShipSummaryDto
            {
                ShipType = ship.ShipType,
                IsSunk = GetOccupiedCells(ship).All(myHitCells.Contains)
            })
            .ToList();

        var attackLog = attacks
            .Select(a => new AttackLogDto
            {
                AttackerId = a.AttackerId,
                X = a.X,
                Y = a.Y,
                IsHit = a.IsHit
            })
            .ToList();

        return new GameStateDto
        {
            GameId = game.Id,
            HostId = game.HostId,
            OpponentId = game.OpponentId,
            GridSize = game.GridSize,
            Status = game.Status,
            CurrentTurnPlayerId = game.CurrentTurnPlayerId,
            WinnerId = game.WinnerId,
            MyShips = myShips,
            OpponentShipSummary = opponentShipSummary,
            Attacks = attackLog
        };
    }

    private static ShipDto ToShipDto(Ship ship) => new()
    {
        ShipType = ship.ShipType,
        StartX = ship.StartX,
        StartY = ship.StartY,
        IsVertical = ship.IsVertical,
        Length = ship.Length
    };

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