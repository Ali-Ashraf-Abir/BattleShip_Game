namespace backend.Models;

public class ConnectionMapping
{
    public string ConnectionId { get; set; } = string.Empty;
    public Guid GameId { get; set; }
    public Guid PlayerId { get; set; }
}