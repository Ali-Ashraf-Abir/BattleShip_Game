using backend.Enums;
using bakcend.Enums;

namespace backend.Dtos;

public class GameStateDto
{
    public Guid GameId { get; set; }

    public Guid HostId { get; set; }

    public Guid? OpponentId { get; set; }

    public int GridSize { get; set; }

    public GameStatus Status { get; set; }

    public Guid? CurrentTurnPlayerId { get; set; }

    public Guid? WinnerId { get; set; }

    public List<ShipDto> MyShips { get; set; } = [];


    public List<OpponentShipSummaryDto> OpponentShipSummary { get; set; } = [];

    public List<AttackLogDto> Attacks { get; set; } = [];
}

public class ShipDto
{
    public ShipType ShipType { get; set; }

    public int StartX { get; set; }

    public int StartY { get; set; }

    public bool IsVertical { get; set; }

    public int Length { get; set; }
}


public class OpponentShipSummaryDto
{
    public ShipType ShipType { get; set; }

    public bool IsSunk { get; set; }
}


public class AttackLogDto
{
    public Guid AttackerId { get; set; }

    public int X { get; set; }

    public int Y { get; set; }

    public bool IsHit { get; set; }
}