namespace backend.Services;
using System.Collections.Concurrent;
using backend.GameEngine;

public class GameStateManager
{
    private readonly ConcurrentDictionary<Guid,GameState> _games = new();
    public void AddGame(GameState state)
    {
        _games[state.GameId] = state;
    }

    public bool TryGetGame(Guid gameId,out GameState? state)
    {
        return _games.TryGetValue(gameId,out state);
    }

    public void RemoveGame(Guid gameId)
    {
        _games.TryRemove(gameId,out _);
    }
}