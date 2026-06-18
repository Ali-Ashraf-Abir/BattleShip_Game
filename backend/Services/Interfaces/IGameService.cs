namespace backend.Services.Interfaces;
using backend.Models;

public interface IGameService
{
    Task<Game> CreateGameAsync(Guid hostId,int gridSize);
}