using backend.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers;

[ApiController]
[Route("api/games")]
public class GameStateController(IGameStateService _gameStateService) : ControllerBase
{

    [HttpGet("{gameId}/state")]
    public async Task<IActionResult> GetState(Guid gameId, [FromQuery] Guid playerId)
    {
        if (playerId == Guid.Empty)
        {
            return BadRequest(new { message = "playerId query parameter is required" });
        }

        try
        {
            var state = await _gameStateService.GetStateAsync(gameId, playerId);
            return Ok(state);
        }
        catch (InvalidOperationException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }
}