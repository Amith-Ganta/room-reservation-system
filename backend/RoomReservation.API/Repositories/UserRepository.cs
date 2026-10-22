using Microsoft.EntityFrameworkCore;
using RoomReservation.API.Data;
using RoomReservation.API.Models;

namespace RoomReservation.API.Repositories;

public class UserRepository : IRepository<User>
{
    private readonly AppDbContext _db;
    public UserRepository(AppDbContext db) => _db = db;

    public async Task<IEnumerable<User>> GetAllAsync() =>
        await _db.Users.ToListAsync();

    public async Task<User?> GetByIdAsync(int id) =>
        await _db.Users.FindAsync(id);

    public async Task<User> AddAsync(User entity)
    {
        _db.Users.Add(entity);
        await _db.SaveChangesAsync();
        return entity;
    }

    public async Task UpdateAsync(User entity)
    {
        _db.Users.Update(entity);
        await _db.SaveChangesAsync();
    }

    public async Task DeleteAsync(User entity)
    {
        _db.Users.Remove(entity);
        await _db.SaveChangesAsync();
    }

    public async Task<bool> EmailExistsAsync(string email, int? excludeId = null)
    {
        var query = _db.Users.Where(u => u.Email == email);
        if (excludeId.HasValue)
            query = query.Where(u => u.Id != excludeId.Value);
        return await query.AnyAsync();
    }

    public async Task<int> GetActiveReservationCountAsync(int userId) =>
        await _db.Reservations.CountAsync(r =>
            r.UserId == userId && r.Status == ReservationStatus.Booked);
}
