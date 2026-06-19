namespace backend.Models;
public class Attack
{
    public Guid Id { get; set; }

    public Guid GameId { get; set; }

    public Guid AttackerId { get; set; }

    public int X { get; set; }

    public int Y { get; set; }

    public bool IsHit { get; set; }
}