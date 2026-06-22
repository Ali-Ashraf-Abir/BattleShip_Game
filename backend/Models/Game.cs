using backend.Enums;
using backend.Models;

namespace backend.Models;

public class Game
{
    public Guid Id { get; set; }

    public Guid HostId { get; set; }

    public Guid? OpponentId { get; set; }

    public int GridSize { get; set; }

    public GameStatus Status { get; set; }

    public Guid? CurrentTurnPlayerId { get; set; }

    public Guid? WinnerId { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public User Host { get; set; } = null!;

    public User? Opponent { get; set; }
}