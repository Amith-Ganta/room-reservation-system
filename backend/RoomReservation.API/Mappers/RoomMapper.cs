using RoomReservation.API.DTOs;
using RoomReservation.API.Models;

namespace RoomReservation.API.Mappers;

public static class RoomMapper
{
    public static RoomDto ToDto(Room room) => new(
        room.Id, room.Name, room.Capacity, room.Location,
        room.HasProjector, room.HasWhiteboard,
        room.HasTVScreen, room.HasVideoConferencing, room.IsActive);

    public static Room ToEntity(CreateRoomDto dto) => new()
    {
        Name = dto.Name,
        Capacity = dto.Capacity,
        Location = dto.Location,
        HasProjector = dto.HasProjector,
        HasWhiteboard = dto.HasWhiteboard,
        HasTVScreen = dto.HasTVScreen,
        HasVideoConferencing = dto.HasVideoConferencing,
        IsActive = dto.IsActive
    };

    public static void Apply(UpdateRoomDto dto, Room room)
    {
        room.Name = dto.Name;
        room.Capacity = dto.Capacity;
        room.Location = dto.Location;
        room.HasProjector = dto.HasProjector;
        room.HasWhiteboard = dto.HasWhiteboard;
        room.HasTVScreen = dto.HasTVScreen;
        room.HasVideoConferencing = dto.HasVideoConferencing;
        room.IsActive = dto.IsActive;
    }
}
