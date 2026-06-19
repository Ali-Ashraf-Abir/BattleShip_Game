using bakcend.Enums;

public class ShipPlacementDto
{
    public ShipType ShipType { get; set; }

    public int StartX { get; set; }

    public int StartY { get; set; }

    public bool IsVertical { get; set; }
}