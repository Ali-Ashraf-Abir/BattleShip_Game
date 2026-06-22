namespace backend.Dtos;

public class AttackDto
{
    public Guid GameId { get; set; }

    public Guid AttackerId { get; set; }

    public int X { get; set; }

    public int Y { get; set; }
}