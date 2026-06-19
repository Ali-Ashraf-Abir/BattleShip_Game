public class ReadyUpDto
{
    public Guid GameId { get; set; }

    public Guid PlayerId { get; set; }

    public List<ShipPlacementDto> Ships { get; set; } = [];
}