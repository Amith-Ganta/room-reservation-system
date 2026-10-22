using RoomReservation.API.DTOs;
using RoomReservation.API.Models;

namespace RoomReservation.API.Mappers;

public static class UserMapper
{
    public static UserDto ToDto(User user, int activeReservationCount = 0) =>
        new(user.Id, user.Name, user.Email, activeReservationCount);

    public static User ToEntity(CreateUserDto dto) => new()
    {
        Name = dto.Name,
        Email = dto.Email
    };

    public static void Apply(UpdateUserDto dto, User user)
    {
        user.Name = dto.Name;
        user.Email = dto.Email;
    }
}
