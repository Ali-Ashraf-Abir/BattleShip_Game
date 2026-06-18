namespace backend.Models;

public class User
{
    public Guid Id { get; set; }

    public string DisplayName { get; set; } = string.Empty;

    public int Wins { get; set; }

    public int Losses { get; set; }

    public int GamesPlayed { get; set; }
}