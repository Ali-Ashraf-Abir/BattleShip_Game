using backend.Dtos;

namespace backend.Services.Interfaces;

public interface IGameStateService
{
    Task<GameStateDto> GetStateAsync(Guid gameId, Guid requestingPlayerId);
}