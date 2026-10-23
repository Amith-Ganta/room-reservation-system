using Microsoft.EntityFrameworkCore;
using RoomReservation.API.DTOs;
using RoomReservation.API.Mappers;
using RoomReservation.API.Models;
using RoomReservation.API.Repositories;

namespace RoomReservation.API.Services;

public class RoomService
{
    private readonly RoomRepository _repo;

    public RoomService(RoomRepository repo) => _repo = repo;

    public async Task<IEnumerable<RoomDto>> GetAllAsync() =>
        (await _repo.GetAllAsync()).Select(RoomMapper.ToDto);

    public async Task<List<RoomDto>> GetFilteredAsync(
        int? minCapacity, bool? hasProjector, bool? hasWhiteboard,
        bool? hasTVScreen, bool? hasVideoConferencing, bool? isActive, string? floor)
    {
        var query = _repo.Query();
        if (minCapacity.HasValue) query = query.Where(r => r.Capacity >= minCapacity.Value);
        if (hasProjector.HasValue) query = query.Where(r => r.HasProjector == hasProjector.Value);
        if (hasWhiteboard.HasValue) query = query.Where(r => r.HasWhiteboard == hasWhiteboard.Value);
        if (hasTVScreen.HasValue) query = query.Where(r => r.HasTVScreen == hasTVScreen.Value);
        if (hasVideoConferencing.HasValue) query = query.Where(r => r.HasVideoConferencing == hasVideoConferencing.Value);
        if (isActive.HasValue) query = query.Where(r => r.IsActive == isActive.Value);
        if (!string.IsNullOrWhiteSpace(floor)) query = query.Where(r => r.Location.Contains(floor));
        return (await query.ToListAsync()).Select(RoomMapper.ToDto).ToList();
    }

    public async Task<RoomDto?> GetByIdAsync(int id)
    {
        var room = await _repo.GetByIdAsync(id);
        return room is null ? null : RoomMapper.ToDto(room);
    }

    public async Task<(RoomDto? dto, string? error)> CreateAsync(CreateRoomDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Name))
            return (null, "ROOM_NAME_REQUIRED: Room name is required.");
        if (dto.Capacity < 1)
            return (null, "ROOM_CAPACITY_INVALID: Capacity must be at least 1.");
        if (string.IsNullOrWhiteSpace(dto.Location))
            return (null, "ROOM_LOCATION_REQUIRED: Location is required.");

        var entity = RoomMapper.ToEntity(dto);
        var created = await _repo.AddAsync(entity);
        return (RoomMapper.ToDto(created), null);
    }

    public async Task<(RoomDto? dto, string? error)> UpdateAsync(int id, UpdateRoomDto dto)
    {
        var room = await _repo.GetByIdAsync(id);
        if (room is null)
            return (null, "ROOM_NOT_FOUND: Room not found.");
        if (string.IsNullOrWhiteSpace(dto.Name))
            return (null, "ROOM_NAME_REQUIRED: Room name is required.");
        if (dto.Capacity < 1)
            return (null, "ROOM_CAPACITY_INVALID: Capacity must be at least 1.");
        if (string.IsNullOrWhiteSpace(dto.Location))
            return (null, "ROOM_LOCATION_REQUIRED: Location is required.");

        RoomMapper.Apply(dto, room);
        await _repo.UpdateAsync(room);
        return (RoomMapper.ToDto(room), null);
    }

    public async Task<string?> DeleteAsync(int id)
    {
        var room = await _repo.GetByIdAsync(id);
        if (room is null) return "ROOM_NOT_FOUND: Room not found.";
        await _repo.DeleteAsync(room);
        return null;
    }
}
