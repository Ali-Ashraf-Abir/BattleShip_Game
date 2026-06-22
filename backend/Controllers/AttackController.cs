using backend.Dtos;
using backend.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AttackController(IAttackService _attackService) : ControllerBase
{
    [HttpPost]
    public async Task<IActionResult> Attack(AttackDto dto)
    {
        try
        {
            var result = await _attackService.AttackAsync(dto);
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}