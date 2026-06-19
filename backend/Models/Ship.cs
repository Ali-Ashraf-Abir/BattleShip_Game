namespace backend.Models;
public class Ship
{
    public Guid Id { get; set; }

    public Guid GameId { get; set; }

    public Guid PlayerId { get; set; }

    public int StartX { get; set; }

    public int StartY { get; set; }

    public int Length { get; set; }

    public bool IsVertical { get; set; }
}