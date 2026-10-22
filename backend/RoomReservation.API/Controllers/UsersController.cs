using Microsoft.AspNetCore.Mvc;
using RoomReservation.API.DTOs;
using RoomReservation.API.Services;

namespace RoomReservation.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class UsersController : ControllerBase
{
    private readonly UserService _service;
    public UsersController(UserService service) => _service = service;

    [HttpGet]
    public async Task<IActionResult> GetAll() => Ok(await _service.GetAllAsync());

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var user = await _service.GetByIdAsync(id);
        return user is null ? NotFound(new { error = "USER_NOT_FOUND", message = "User not found." }) : Ok(user);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateUserDto dto)
    {
        var (user, error) = await _service.CreateAsync(dto);
        if (error is not null) return BadRequest(new { error = error.Split(':')[0], message = error.Split(':', 2)[1].Trim() });
        return CreatedAtAction(nameof(GetById), new { id = user!.Id }, user);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateUserDto dto)
    {
        var (user, error) = await _service.UpdateAsync(id, dto);
        if (error is not null)
        {
            var parts = error.Split(':', 2);
            if (parts[0] == "USER_NOT_FOUND") return NotFound(new { error = parts[0], message = parts[1].Trim() });
            return BadRequest(new { error = parts[0], message = parts[1].Trim() });
        }
        return Ok(user);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var error = await _service.DeleteAsync(id);
        if (error is not null) return NotFound(new { error = "USER_NOT_FOUND", message = "User not found." });
        return NoContent();
    }
}
