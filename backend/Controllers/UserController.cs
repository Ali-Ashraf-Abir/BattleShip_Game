using System.Xml;
using backend.Dtos;
using backend.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;

[ApiController]
[Route("api/users")]
public class UserController : ControllerBase
{
    private readonly IUserService _userService;
    public UserController(IUserService userService)
    {
        _userService = userService;
    }
    [HttpPost]
    public async Task<IActionResult> Create(CreateUserDto dto)
    {
        var user = await _userService.CreateUserAsync(dto.Name);
        return Ok(new UserResponseDto(user.Id, user.DisplayName));
    }
    [HttpGet("id/{id}")]
    public async Task<IActionResult> GetUserById(Guid id)
    {
        var user = await _userService.GetUserByID(id);
        return Ok(user);
    }
}