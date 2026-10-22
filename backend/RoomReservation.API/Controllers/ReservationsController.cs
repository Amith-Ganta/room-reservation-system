using Microsoft.AspNetCore.Mvc;
using RoomReservation.API.DTOs;
using RoomReservation.API.Models;
using RoomReservation.API.Services;

namespace RoomReservation.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ReservationsController : ControllerBase
{
    private readonly ReservationService _service;
    public ReservationsController(ReservationService service) => _service = service;

    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] int? roomId,
        [FromQuery] int? userId,
        [FromQuery] ReservationStatus? status,
        [FromQuery] DateTime? from,
        [FromQuery] DateTime? to)
    {
        var reservations = await _service.GetFilteredAsync(roomId, userId, status, from, to);
        return Ok(reservations);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var reservation = await _service.GetByIdAsync(id);
        return reservation is null
            ? NotFound(new { error = "RESERVATION_NOT_FOUND", message = "Reservation not found." })
            : Ok(reservation);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateReservationDto dto)
    {
        var (reservation, error) = await _service.CreateAsync(dto);
        if (error is not null)
        {
            var parts = error.Split(':', 2);
            return BadRequest(new { error = parts[0], message = parts[1].Trim() });
        }
        return CreatedAtAction(nameof(GetById), new { id = reservation!.Id }, reservation);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateReservationDto dto)
    {
        var (reservation, error) = await _service.UpdateAsync(id, dto);
        if (error is not null)
        {
            var parts = error.Split(':', 2);
            if (parts[0] == "RESERVATION_NOT_FOUND")
                return NotFound(new { error = parts[0], message = parts[1].Trim() });
            return BadRequest(new { error = parts[0], message = parts[1].Trim() });
        }
        return Ok(reservation);
    }

    [HttpPatch("{id}/cancel")]
    public async Task<IActionResult> Cancel(int id)
    {
        var (reservation, error) = await _service.CancelAsync(id);
        if (error is not null)
        {
            var parts = error.Split(':', 2);
            if (parts[0] == "RESERVATION_NOT_FOUND")
                return NotFound(new { error = parts[0], message = parts[1].Trim() });
            return BadRequest(new { error = parts[0], message = parts[1].Trim() });
        }
        return Ok(reservation);
    }

    [HttpPatch("{id}/complete")]
    public async Task<IActionResult> Complete(int id)
    {
        var (reservation, error) = await _service.CompleteAsync(id);
        if (error is not null)
        {
            var parts = error.Split(':', 2);
            if (parts[0] == "RESERVATION_NOT_FOUND")
                return NotFound(new { error = parts[0], message = parts[1].Trim() });
            return BadRequest(new { error = parts[0], message = parts[1].Trim() });
        }
        return Ok(reservation);
    }

    [HttpGet("usage-report")]
    public async Task<IActionResult> UsageReport(
        [FromQuery] DateTime? from,
        [FromQuery] DateTime? to)
    {
        var report = await _service.GetUsageReportAsync(from, to);
        return Ok(report);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var error = await _service.DeleteAsync(id);
        if (error is not null)
            return NotFound(new { error = "RESERVATION_NOT_FOUND", message = "Reservation not found." });
        return NoContent();
    }
}
