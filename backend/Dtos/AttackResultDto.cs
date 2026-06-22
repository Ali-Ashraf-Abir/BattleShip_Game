using bakcend.Enums;

namespace backend.Dtos;

public class AttackResultDto
{
    public Guid GameId { get; set; }

    public Guid AttackerId { get; set; }

    public int X { get; set; }

    public int Y { get; set; }

    public bool IsHit { get; set; }

    public ShipType? SunkShipType { get; set; }

    public bool IsGameOver { get; set; }

    public Guid? WinnerId { get; set; }

    public Guid NextTurnPlayerId { get; set; }
}