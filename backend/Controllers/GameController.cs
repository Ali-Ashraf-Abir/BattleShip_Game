using backend.Dtos;
using backend.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;

[ApiController]
[Route("api/games")]
public class GameController : ControllerBase
{
    private readonly IGameService _gameService;
    public GameController(IGameService gameService)
    {
        _gameService = gameService;
    }
    [HttpPost]
    public async Task<IActionResult> Create(CreateGameDto dto)
    {
        var game =await _gameService.CreateGameAsync(dto.HostId,dto.GridSize);
        return Ok(game);
    }
}