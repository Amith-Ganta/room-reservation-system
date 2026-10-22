using Microsoft.EntityFrameworkCore;
using RoomReservation.API.Data;
using RoomReservation.API.Models;

namespace RoomReservation.API.Repositories;

public class RoomRepository : IRepository<Room>
{
    private readonly AppDbContext _db;
    public RoomRepository(AppDbContext db) => _db = db;

    public async Task<IEnumerable<Room>> GetAllAsync() =>
        await _db.Rooms.ToListAsync();

    public async Task<Room?> GetByIdAsync(int id) =>
        await _db.Rooms.FindAsync(id);

    public async Task<Room> AddAsync(Room entity)
    {
        _db.Rooms.Add(entity);
        await _db.SaveChangesAsync();
        return entity;
    }

    public async Task UpdateAsync(Room entity)
    {
        _db.Rooms.Update(entity);
        await _db.SaveChangesAsync();
    }

    public async Task DeleteAsync(Room entity)
    {
        _db.Rooms.Remove(entity);
        await _db.SaveChangesAsync();
    }
}
