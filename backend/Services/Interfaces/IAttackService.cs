using backend.Dtos;

namespace backend.Services.Interfaces;

public interface IAttackService
{
    Task<AttackResultDto> AttackAsync(AttackDto dto);
}