namespace RoomReservation.API.DTOs;

public record UserDto(
    int Id,
    string Name,
    string Email,
    int ActiveReservationCount
);

public record CreateUserDto(
    string Name,
    string Email
);

public record UpdateUserDto(
    string Name,
    string Email
);
