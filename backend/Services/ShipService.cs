using backend.Data;
using backend.Dtos;
using backend.Enums;
using backend.GameEngine;
using backend.Models;
using backend.Services.Interfaces;
using bakcend.Enums;
using Microsoft.EntityFrameworkCore;

namespace backend.Services;

public class ShipService(GameStateManager state, ApplicationDbContext _db) : IShipService
{
    public async Task ReadyUpAsync(
    ReadyUpDto dto)
    {

        var existingShips = await _db.Ships.AnyAsync(s =>s.GameId == dto.GameId &&s.PlayerId == dto.PlayerId);
        if (existingShips)
        {
            throw new InvalidOperationException("Player has already placed ships");
        }

        var game = await _db.Games.FindAsync(dto.GameId);

        if (game == null)
        {
            throw new InvalidOperationException("Game not found");
        }
        foreach (var ship in dto.Ships)
        {
            ValidateBounds(ship, game.GridSize);
        }
        ValidateOverlappingShips(dto.Ships);
        ValidateFleet(dto.Ships);
        var ships = dto.Ships.Select(ship => new Ship
        {
            GameId = dto.GameId,
            PlayerId = dto.PlayerId,
            ShipType = ship.ShipType,
            StartX = ship.StartX,
            StartY = ship.StartY,
            IsVertical = ship.IsVertical,
            Length = GetLength(ship.ShipType)
        }).ToList();

        _db.Ships.AddRange(ships);
        // in production uncomment this
        // if (!state.TryGetGame(dto.GameId,out var gameState))
        // {
        //     throw new InvalidOperationException("Game state not found");
        // }

        // and remove this in production
        if (!state.TryGetGame(dto.GameId,out var gameState))
        {
            gameState = new GameState(game.Id,game.GridSize);
            gameState.CurrentTurnPlayerId =game.HostId;

            state.AddGame(gameState);
        }
        if (dto.PlayerId == game.HostId)
        {
            gameState.HostReady = true;
        }
        else
        {
            gameState.OpponentReady = true;
        }
        if (gameState.HostReady &&
            gameState.OpponentReady)
        {
            game.Status = GameStatus.InProgress;
            game.CurrentTurnPlayerId = game.HostId;
        }
        await _db.SaveChangesAsync();
    }
    private static void ValidateFleet(
    List<ShipPlacementDto> ships)
    {
        if (ships.Count != 5)
        {
            throw new InvalidOperationException("Exactly 5 ships are required");
        }

        var requiredShips = new[]
        {
        ShipType.Carrier,
        ShipType.Battleship,
        ShipType.Cruiser,
        ShipType.Submarine,
        ShipType.Destroyer
    };

        foreach (var shipType in requiredShips)
        {
            if (!ships.Any(s => s.ShipType == shipType))
            {
                throw new InvalidOperationException($"Missing {shipType}");
            }
        }
    }
    private static int GetLength(ShipType shipType)
    {
        return shipType switch
        {
            ShipType.Carrier => 5,
            ShipType.Battleship => 4,
            ShipType.Cruiser => 3,
            ShipType.Submarine => 3,
            ShipType.Destroyer => 2,
            _ => throw new InvalidOperationException()
        };
    }

    private static void ValidateOverlappingShips(
        List<ShipPlacementDto> ships)
    {
        var occupiedCells = new HashSet<(int X, int Y)>();
        foreach (var ship in ships)
        {
            var length = GetLength(ship.ShipType);

            for (int i = 0; i < length; i++)
            {
                var x = ship.IsVertical ? ship.StartX : ship.StartX + i;
                var y = ship.IsVertical ? ship.StartY + i : ship.StartY;
                if (!occupiedCells.Add((x, y)))
                {
                    throw new InvalidOperationException("Ships cannot overlap");
                }
            }
        }
    }
    private static void ValidateBounds(
    ShipPlacementDto ship,
    int gridSize)
    {
        var length = GetLength(ship.ShipType);
        if (ship.StartX < 0 || ship.StartY < 0)
        {
            throw new InvalidOperationException("Invalid ship position");
        }
        if (ship.IsVertical)
        {
            if (ship.StartY + length > gridSize)
            {
                throw new InvalidOperationException($"{ship.ShipType} exceeds board bounds");
            }
        }
        else
        {
            if (ship.StartX + length > gridSize)
            {
                throw new InvalidOperationException($"{ship.ShipType} exceeds board bounds");
            }
        }
    }
}