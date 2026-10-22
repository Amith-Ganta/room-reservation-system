using Microsoft.EntityFrameworkCore;
using RoomReservation.API.Data;
using RoomReservation.API.Models;

namespace RoomReservation.API.Repositories;

public class ReservationRepository : IRepository<Reservation>
{
    private readonly AppDbContext _db;
    public ReservationRepository(AppDbContext db) => _db = db;

    public async Task<IEnumerable<Reservation>> GetAllAsync() =>
        await _db.Reservations.Include(r => r.Room).Include(r => r.User).ToListAsync();

    public async Task<Reservation?> GetByIdAsync(int id) =>
        await _db.Reservations.Include(r => r.Room).Include(r => r.User)
            .FirstOrDefaultAsync(r => r.Id == id);

    public async Task<IEnumerable<Reservation>> GetByRoomAsync(int roomId) =>
        await _db.Reservations.Include(r => r.Room).Include(r => r.User)
            .Where(r => r.RoomId == roomId).ToListAsync();

    public async Task<IEnumerable<Reservation>> GetByUserAsync(int userId) =>
        await _db.Reservations.Include(r => r.Room).Include(r => r.User)
            .Where(r => r.UserId == userId).ToListAsync();

    // Checks for room double-booking; excludes Cancelled and respects ActualEndTime
    public async Task<bool> HasConflictAsync(int roomId, DateTime start, DateTime end, int? excludeId = null)
    {
        var candidates = await _db.Reservations
            .Where(r => r.RoomId == roomId && r.Status != ReservationStatus.Cancelled)
            .ToListAsync();
        return candidates.Any(r =>
            (!excludeId.HasValue || r.Id != excludeId.Value) &&
            r.StartTime < end &&
            (r.ActualEndTime ?? r.EndTime) > start);
    }

    // Checks whether the same organizer already has a booking overlapping this slot
    public async Task<bool> HasOrganizerConflictAsync(int userId, DateTime start, DateTime end, int? excludeId = null)
    {
        var candidates = await _db.Reservations
            .Where(r => r.UserId == userId && r.Status != ReservationStatus.Cancelled)
            .ToListAsync();
        return candidates.Any(r =>
            (!excludeId.HasValue || r.Id != excludeId.Value) &&
            r.StartTime < end &&
            (r.ActualEndTime ?? r.EndTime) > start);
    }

    public async Task<int> GetActiveCountByUserAsync(int userId) =>
        await _db.Reservations.CountAsync(r =>
            r.UserId == userId && r.Status == ReservationStatus.Booked);

    public async Task<Reservation> AddAsync(Reservation entity)
    {
        _db.Reservations.Add(entity);
        await _db.SaveChangesAsync();
        return entity;
    }

    public async Task UpdateAsync(Reservation entity)
    {
        _db.Reservations.Update(entity);
        await _db.SaveChangesAsync();
    }

    public async Task DeleteAsync(Reservation entity)
    {
        _db.Reservations.Remove(entity);
        await _db.SaveChangesAsync();
    }
}
