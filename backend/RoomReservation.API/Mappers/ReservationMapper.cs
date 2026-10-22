using RoomReservation.API.DTOs;
using RoomReservation.API.Models;

namespace RoomReservation.API.Mappers;

public static class ReservationMapper
{
    public static ReservationDto ToDto(Reservation r) => new(
        r.Id, r.RoomId, r.Room?.Name ?? string.Empty,
        r.UserId, r.User?.Name ?? string.Empty,
        r.StartTime, r.EndTime, r.Title,
        r.AttendeesCount, r.Status);

    public static Reservation ToEntity(CreateReservationDto dto) => new()
    {
        RoomId = dto.RoomId,
        UserId = dto.UserId,
        StartTime = dto.StartTime,
        EndTime = dto.EndTime,
        Title = dto.Title,
        AttendeesCount = dto.AttendeesCount,
        Status = ReservationStatus.Booked
    };

    public static void Apply(UpdateReservationDto dto, Reservation r)
    {
        r.RoomId = dto.RoomId;
        r.UserId = dto.UserId;
        r.StartTime = dto.StartTime;
        r.EndTime = dto.EndTime;
        r.Title = dto.Title;
        r.AttendeesCount = dto.AttendeesCount;
    }
}
