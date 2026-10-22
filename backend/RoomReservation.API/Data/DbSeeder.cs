using RoomReservation.API.Models;

namespace RoomReservation.API.Data;

public static class DbSeeder
{
    public static void Seed(AppDbContext context)
    {
        if (context.Rooms.Any()) return;

        var rooms = new[]
        {
            new Room { Name = "Conference Room A", Capacity = 10, Location = "Floor 1", HasProjector = true, HasWhiteboard = true, HasTVScreen = true, HasVideoConferencing = false, IsActive = true },
            new Room { Name = "Board Room", Capacity = 20, Location = "Floor 2", HasProjector = true, HasWhiteboard = false, HasTVScreen = true, HasVideoConferencing = true, IsActive = true },
            new Room { Name = "Small Meeting Room", Capacity = 4, Location = "Floor 1", HasProjector = false, HasWhiteboard = true, HasTVScreen = false, HasVideoConferencing = false, IsActive = true },
            new Room { Name = "Training Room", Capacity = 30, Location = "Floor 3", HasProjector = true, HasWhiteboard = true, HasTVScreen = true, HasVideoConferencing = true, IsActive = true },
            new Room { Name = "Huddle Space", Capacity = 6, Location = "Floor 2", HasProjector = false, HasWhiteboard = true, HasTVScreen = false, HasVideoConferencing = false, IsActive = true },
        };
        context.Rooms.AddRange(rooms);

        var users = new[]
        {
            new User { Name = "Alice Johnson", Email = "alice@example.com" },
            new User { Name = "Bob Smith", Email = "bob@example.com" },
            new User { Name = "Carol White", Email = "carol@example.com" },
        };
        context.Users.AddRange(users);
        context.SaveChanges();

        var now = DateTime.UtcNow.Date.AddHours(9);
        var reservations = new[]
        {
            new Reservation
            {
                RoomId = rooms[0].Id, UserId = users[0].Id,
                StartTime = now.AddDays(1).AddHours(1), EndTime = now.AddDays(1).AddHours(2),
                Title = "Sprint Planning", AttendeesCount = 8, Status = ReservationStatus.Booked
            },
            new Reservation
            {
                RoomId = rooms[1].Id, UserId = users[1].Id,
                StartTime = now.AddDays(1).AddHours(3), EndTime = now.AddDays(1).AddHours(4),
                Title = "Quarterly Review", AttendeesCount = 15, Status = ReservationStatus.Booked
            },
        };
        context.Reservations.AddRange(reservations);
        context.SaveChanges();
    }
}
