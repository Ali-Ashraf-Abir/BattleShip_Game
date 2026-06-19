
using backend.Dtos;
using backend.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;

[ApiController]
[Route("api/ship")]
public class ShipController(IShipService shipService) : ControllerBase
{
    [HttpPost("ready")]
    public async Task<IActionResult> ReadyUp(
        [FromBody] ReadyUpDto dto)
    {
        try
        {
            await shipService.ReadyUpAsync(dto);

            return Ok();
        }
        catch (Exception ex)
        {
            return BadRequest(ex.Message);
        }
    }
}
