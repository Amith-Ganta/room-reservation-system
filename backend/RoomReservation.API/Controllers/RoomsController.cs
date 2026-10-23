using Microsoft.AspNetCore.Mvc;
using RoomReservation.API.DTOs;
using RoomReservation.API.Services;

namespace RoomReservation.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class RoomsController : ControllerBase
{
    private readonly RoomService _service;
    public RoomsController(RoomService service) => _service = service;

    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] int? minCapacity,
        [FromQuery] bool? hasProjector,
        [FromQuery] bool? hasWhiteboard,
        [FromQuery] bool? hasTVScreen,
        [FromQuery] bool? hasVideoConferencing,
        [FromQuery] bool? isActive,
        [FromQuery] string? floor)
    {
        var rooms = await _service.GetFilteredAsync(
            minCapacity, hasProjector, hasWhiteboard, hasTVScreen, hasVideoConferencing, isActive, floor);
        return Ok(rooms);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var room = await _service.GetByIdAsync(id);
        return room is null ? NotFound(new { error = "ROOM_NOT_FOUND", message = "Room not found." }) : Ok(room);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateRoomDto dto)
    {
        var (room, error) = await _service.CreateAsync(dto);
        if (error is not null)
        {
            var parts = error.Split(':', 2);
            return BadRequest(new { error = parts[0], message = parts[1].Trim() });
        }
        return CreatedAtAction(nameof(GetById), new { id = room!.Id }, room);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateRoomDto dto)
    {
        var (room, error) = await _service.UpdateAsync(id, dto);
        if (error is not null)
        {
            var parts = error.Split(':', 2);
            if (parts[0] == "ROOM_NOT_FOUND") return NotFound(new { error = parts[0], message = parts[1].Trim() });
            return BadRequest(new { error = parts[0], message = parts[1].Trim() });
        }
        return Ok(room);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var error = await _service.DeleteAsync(id);
        if (error is not null) return NotFound(new { error = "ROOM_NOT_FOUND", message = "Room not found." });
        return NoContent();
    }
}
