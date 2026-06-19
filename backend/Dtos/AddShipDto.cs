using bakcend.Enums;

public class AddShipDto
{
    public Guid GameId { get; set; }

    public Guid PlayerId { get; set; }

    public ShipType ShipType { get; set; }

    public int StartX { get; set; }

    public int StartY { get; set; }

    public bool IsVertical { get; set; }


}