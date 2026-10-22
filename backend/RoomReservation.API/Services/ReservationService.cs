using Microsoft.Extensions.Configuration;
using RoomReservation.API.DTOs;
using RoomReservation.API.Mappers;
using RoomReservation.API.Models;
using RoomReservation.API.Repositories;

namespace RoomReservation.API.Services;

public class ReservationService
{
    private readonly ReservationRepository _repo;
    private readonly RoomRepository _roomRepo;
    private readonly UserRepository _userRepo;
    private readonly int _maxDurationDays;
    private readonly int _maxBookingHorizonDays;

    public ReservationService(
        ReservationRepository repo,
        RoomRepository roomRepo,
        UserRepository userRepo,
        IConfiguration config)
    {
        _repo = repo;
        _roomRepo = roomRepo;
        _userRepo = userRepo;
        _maxDurationDays = config.GetValue<int>("Reservation:MaxDurationDays", 7);
        _maxBookingHorizonDays = config.GetValue<int>("Reservation:MaxBookingHorizonDays", 90);
    }

    public async Task<IEnumerable<ReservationDto>> GetAllAsync() =>
        (await _repo.GetAllAsync()).Select(ReservationMapper.ToDto);

    public async Task<IEnumerable<ReservationDto>> GetFilteredAsync(
        int? roomId, int? userId, ReservationStatus? status, DateTime? from, DateTime? to)
    {
        var all = await _repo.GetAllAsync();
        if (roomId.HasValue) all = all.Where(r => r.RoomId == roomId.Value);
        if (userId.HasValue) all = all.Where(r => r.UserId == userId.Value);
        if (status.HasValue) all = all.Where(r => r.Status == status.Value);
        if (from.HasValue) all = all.Where(r => r.EndTime >= from.Value);
        if (to.HasValue) all = all.Where(r => r.StartTime <= to.Value);
        return all.Select(ReservationMapper.ToDto);
    }

    public async Task<ReservationDto?> GetByIdAsync(int id)
    {
        var r = await _repo.GetByIdAsync(id);
        return r is null ? null : ReservationMapper.ToDto(r);
    }

    public async Task<(ReservationDto? dto, string? error)> CreateAsync(CreateReservationDto dto)
    {
        var validationError = await ValidateAsync(dto.RoomId, dto.UserId, dto.StartTime, dto.EndTime, dto.AttendeesCount, null);
        if (validationError is not null) return (null, validationError);

        var entity = ReservationMapper.ToEntity(dto);
        var created = await _repo.AddAsync(entity);
        var full = await _repo.GetByIdAsync(created.Id);
        return (ReservationMapper.ToDto(full!), null);
    }

    public async Task<(ReservationDto? dto, string? error)> UpdateAsync(int id, UpdateReservationDto dto)
    {
        var existing = await _repo.GetByIdAsync(id);
        if (existing is null)
            return (null, "RESERVATION_NOT_FOUND: Reservation not found.");
        if (existing.Status == ReservationStatus.Cancelled)
            return (null, "RESERVATION_CANCELLED: Cannot modify a cancelled reservation.");

        var validationError = await ValidateAsync(dto.RoomId, dto.UserId, dto.StartTime, dto.EndTime, dto.AttendeesCount, id);
        if (validationError is not null) return (null, validationError);

        ReservationMapper.Apply(dto, existing);
        await _repo.UpdateAsync(existing);
        var updated = await _repo.GetByIdAsync(id);
        return (ReservationMapper.ToDto(updated!), null);
    }

    public async Task<(ReservationDto? dto, string? error)> CancelAsync(int id)
    {
        var r = await _repo.GetByIdAsync(id);
        if (r is null) return (null, "RESERVATION_NOT_FOUND: Reservation not found.");
        if (r.Status == ReservationStatus.Cancelled)
            return (null, "ALREADY_CANCELLED: Reservation is already cancelled.");
        r.Status = ReservationStatus.Cancelled;
        await _repo.UpdateAsync(r);
        return (ReservationMapper.ToDto(r), null);
    }

    public async Task<(ReservationDto? dto, string? error)> CompleteAsync(int id)
    {
        var r = await _repo.GetByIdAsync(id);
        if (r is null) return (null, "RESERVATION_NOT_FOUND: Reservation not found.");
        if (r.Status != ReservationStatus.Booked)
            return (null, "INVALID_STATUS: Only active bookings can be ended early.");
        var now = DateTime.UtcNow;
        if (now <= r.StartTime)
            return (null, "INVALID_STATUS: Cannot end a reservation that has not started yet.");
        r.Status = ReservationStatus.Completed;
        // Record the actual end so the room becomes available immediately
        r.ActualEndTime = now < r.EndTime ? now : r.EndTime;
        await _repo.UpdateAsync(r);
        return (ReservationMapper.ToDto(r), null);
    }

    public async Task<IEnumerable<RoomUsageReportRow>> GetUsageReportAsync(DateTime? from, DateTime? to)
    {
        var all = await _repo.GetAllAsync();
        if (from.HasValue) all = all.Where(r => r.EndTime >= from.Value);
        if (to.HasValue) all = all.Where(r => r.StartTime <= to.Value);

        var rooms = await _roomRepo.GetAllAsync();
        return rooms.Select(room =>
        {
            var bookings = all.Where(r => r.RoomId == room.Id).ToList();
            var completed = bookings.Where(r => r.Status == ReservationStatus.Completed).ToList();
            var cancelled = bookings.Where(r => r.Status == ReservationStatus.Cancelled).ToList();
            var scheduled = bookings.Sum(r => (r.EndTime - r.StartTime).TotalHours);
            var actual = bookings.Sum(r => ((r.ActualEndTime ?? r.EndTime) - r.StartTime).TotalHours);
            var pct = scheduled > 0 ? Math.Round(actual / scheduled * 100, 1) : 0;
            return new RoomUsageReportRow(
                room.Id, room.Name, room.Capacity,
                bookings.Count, completed.Count, cancelled.Count,
                Math.Round(scheduled, 2), Math.Round(actual, 2), pct);
        });
    }

    public async Task<string?> DeleteAsync(int id)
    {
        var r = await _repo.GetByIdAsync(id);
        if (r is null) return "RESERVATION_NOT_FOUND: Reservation not found.";
        await _repo.DeleteAsync(r);
        return null;
    }

    // Validation rules R1–R7 exactly as defined in the task PDF, server-side only
    private async Task<string?> ValidateAsync(
        int roomId, int userId, DateTime start, DateTime end, int attendeesCount, int? excludeId)
    {
        // R1: Maximum duration (≤ MaxDurationDays)
        if (start >= end)
            return "R1_MAX_DURATION: Start time must be before end time.";
        var duration = (end - start).TotalDays;
        if (duration > _maxDurationDays)
            return $"R1_MAX_DURATION: Reservation duration cannot exceed {_maxDurationDays} day(s).";

        // R2: No overlapping room bookings
        var room = await _roomRepo.GetByIdAsync(roomId);
        if (room is null)
            return "R2_ROOM_NOT_FOUND: The specified room does not exist.";
        if (await _repo.HasConflictAsync(roomId, start, end, excludeId))
            return "R2_ROOM_CONFLICT: The room is already booked during this time slot.";

        // R3: No overlapping organizer bookings
        var user = await _userRepo.GetByIdAsync(userId);
        if (user is null)
            return "R3_USER_NOT_FOUND: The specified user does not exist.";
        if (await _repo.HasOrganizerConflictAsync(userId, start, end, excludeId))
            return "R3_ORGANIZER_CONFLICT: The organizer already has a booking during this time slot.";

        // R4: Reservation must start in the future
        if (start <= DateTime.UtcNow)
            return "R4_FUTURE_ONLY: Reservation must start in the future.";

        // R5: Number of attendees must not exceed room capacity
        if (attendeesCount < 1)
            return "R5_ATTENDEES_REQUIRED: At least 1 attendee is required.";
        if (attendeesCount > room.Capacity)
            return $"R5_CAPACITY_EXCEEDED: Number of attendees ({attendeesCount}) exceeds room capacity ({room.Capacity}).";

        // R6: Booking horizon (start cannot be more than MaxBookingHorizonDays in the future)
        var horizonLimit = DateTime.UtcNow.AddDays(_maxBookingHorizonDays);
        if (start > horizonLimit)
            return $"R6_BOOKING_HORIZON: Reservations cannot be made more than {_maxBookingHorizonDays} days in advance.";

        // R7: Room must be active
        if (!room.IsActive)
            return "R7_ROOM_INACTIVE: This room is not available for booking.";

        return null;
    }
}
