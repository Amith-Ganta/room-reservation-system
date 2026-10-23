using RoomReservation.API.DTOs;
using RoomReservation.API.Mappers;
using RoomReservation.API.Repositories;

namespace RoomReservation.API.Services;

public class UserService
{
    private readonly UserRepository _repo;

    public UserService(UserRepository repo) => _repo = repo;

    public async Task<IEnumerable<UserDto>> GetAllAsync()
    {
        var users = await _repo.GetAllAsync();
        var result = new List<UserDto>();
        foreach (var u in users)
        {
            var count = await _repo.GetActiveReservationCountAsync(u.Id);
            result.Add(UserMapper.ToDto(u, count));
        }
        return result;
    }

    public async Task<UserDto?> GetByIdAsync(int id)
    {
        var user = await _repo.GetByIdAsync(id);
        if (user is null) return null;
        var count = await _repo.GetActiveReservationCountAsync(id);
        return UserMapper.ToDto(user, count);
    }

    public async Task<(UserDto? dto, string? error)> CreateAsync(CreateUserDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Name))
            return (null, "USER_NAME_REQUIRED: Name is required.");
        if (string.IsNullOrWhiteSpace(dto.Email))
            return (null, "USER_EMAIL_REQUIRED: Email is required.");
        if (!System.Net.Mail.MailAddress.TryCreate(dto.Email, out _))
            return (null, "USER_EMAIL_INVALID: Email format is invalid.");
        if (await _repo.EmailExistsAsync(dto.Email))
            return (null, "USER_EMAIL_DUPLICATE: A user with this email already exists.");

        var entity = UserMapper.ToEntity(dto);
        var created = await _repo.AddAsync(entity);
        return (UserMapper.ToDto(created, 0), null);
    }

    public async Task<(UserDto? dto, string? error)> UpdateAsync(int id, UpdateUserDto dto)
    {
        var user = await _repo.GetByIdAsync(id);
        if (user is null) return (null, "USER_NOT_FOUND: User not found.");
        if (string.IsNullOrWhiteSpace(dto.Name))
            return (null, "USER_NAME_REQUIRED: Name is required.");
        if (string.IsNullOrWhiteSpace(dto.Email))
            return (null, "USER_EMAIL_REQUIRED: Email is required.");
        if (!System.Net.Mail.MailAddress.TryCreate(dto.Email, out _))
            return (null, "USER_EMAIL_INVALID: Email format is invalid.");
        if (await _repo.EmailExistsAsync(dto.Email, id))
            return (null, "USER_EMAIL_DUPLICATE: A user with this email already exists.");

        UserMapper.Apply(dto, user);
        await _repo.UpdateAsync(user);
        var count = await _repo.GetActiveReservationCountAsync(id);
        return (UserMapper.ToDto(user, count), null);
    }

    public async Task<string?> DeleteAsync(int id)
    {
        var user = await _repo.GetByIdAsync(id);
        if (user is null) return "USER_NOT_FOUND: User not found.";
        await _repo.DeleteAsync(user);
        return null;
    }
}
