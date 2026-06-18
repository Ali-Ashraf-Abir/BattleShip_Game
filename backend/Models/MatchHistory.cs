namespace backend.Models;

public class MatchHistory
{
    public Guid Id { get; set; }

    public Guid WinnerId { get; set; }

    public Guid LoserId { get; set; }

    public DateTime PlayedAt { get; set; }
}