using RoomReservation.API.Models;

namespace RoomReservation.API.DTOs;

public record ReservationDto(
    int Id,
    int RoomId,
    string RoomName,
    int UserId,
    string UserName,
    DateTime StartTime,
    DateTime EndTime,
    string Title,
    int AttendeesCount,
    ReservationStatus Status
);

public record CreateReservationDto(
    int RoomId,
    int UserId,
    DateTime StartTime,
    DateTime EndTime,
    string Title,
    int AttendeesCount
);

public record UpdateReservationDto(
    int RoomId,
    int UserId,
    DateTime StartTime,
    DateTime EndTime,
    string Title,
    int AttendeesCount
);
