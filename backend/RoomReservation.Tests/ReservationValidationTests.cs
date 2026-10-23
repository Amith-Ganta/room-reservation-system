using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using RoomReservation.API.Data;
using RoomReservation.API.DTOs;
using RoomReservation.API.Models;
using RoomReservation.API.Options;
using RoomReservation.API.Repositories;
using RoomReservation.API.Services;
using Xunit;

namespace RoomReservation.Tests;

public class ReservationValidationTests
{
    private AppDbContext CreateDb()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        return new AppDbContext(options);
    }

    private ReservationService CreateService(AppDbContext db)
    {
        var opts = Options.Create(new ReservationOptions
        {
            MaxDurationDays = 7,
            MaxBookingHorizonDays = 90
        });
        return new ReservationService(
            new ReservationRepository(db),
            new RoomRepository(db),
            new UserRepository(db),
            opts);
    }

    private async Task SeedAsync(AppDbContext db)
    {
        db.Rooms.Add(new Room
        {
            Name = "Test Room", Capacity = 5, Location = "Floor 1",
            HasProjector = false, HasWhiteboard = false,
            HasTVScreen = false, HasVideoConferencing = false, IsActive = true
        });
        db.Users.Add(new User { Name = "Test User", Email = "test@example.com" });
        await db.SaveChangesAsync();
    }

    // R1: Start must be before end
    [Fact]
    public async Task R1_StartMustBeBeforeEnd_ReturnsError()
    {
        using var db = CreateDb();
        await SeedAsync(db);
        var svc = CreateService(db);
        var future = DateTime.UtcNow.AddDays(1);
        var (dto, error) = await svc.CreateAsync(new CreateReservationDto(1, 1, future.AddHours(2), future, "Bad", 1));
        Assert.NotNull(error);
        Assert.Contains("R1", error);
    }

    // R1: Duration cannot exceed max
    [Fact]
    public async Task R1_DurationCannotExceedMax_ReturnsError()
    {
        using var db = CreateDb();
        await SeedAsync(db);
        var svc = CreateService(db);
        var start = DateTime.UtcNow.AddDays(1);
        var (dto, error) = await svc.CreateAsync(new CreateReservationDto(1, 1, start, start.AddDays(8), "Too long", 1));
        Assert.NotNull(error);
        Assert.Contains("R1", error);
    }

    // R2: Room conflict (double booking)
    [Fact]
    public async Task R2_RoomConflict_ReturnsError()
    {
        using var db = CreateDb();
        await SeedAsync(db);
        var svc = CreateService(db);
        var start = DateTime.UtcNow.AddDays(1).Date.AddHours(10);
        var (first, err1) = await svc.CreateAsync(new CreateReservationDto(1, 1, start, start.AddHours(2), "First", 1));
        Assert.Null(err1);
        // Different user booking same room overlapping slot
        db.Users.Add(new User { Name = "User 2", Email = "user2@example.com" });
        await db.SaveChangesAsync();
        var (second, err2) = await svc.CreateAsync(new CreateReservationDto(1, 2, start.AddHours(1), start.AddHours(3), "Overlap", 1));
        Assert.NotNull(err2);
        Assert.Contains("R2", err2);
    }

    // R3: Organizer conflict (same user, different room, overlapping slot)
    [Fact]
    public async Task R3_OrganizerConflict_ReturnsError()
    {
        using var db = CreateDb();
        await SeedAsync(db);
        db.Rooms.Add(new Room { Name = "Room B", Capacity = 10, Location = "Floor 2", HasProjector = false, HasWhiteboard = false, HasTVScreen = false, HasVideoConferencing = false, IsActive = true });
        await db.SaveChangesAsync();
        var svc = CreateService(db);
        var start = DateTime.UtcNow.AddDays(1).Date.AddHours(10);
        var (first, err1) = await svc.CreateAsync(new CreateReservationDto(1, 1, start, start.AddHours(2), "Room A", 1));
        Assert.Null(err1);
        // Same user, different room, overlapping time
        var (second, err2) = await svc.CreateAsync(new CreateReservationDto(2, 1, start.AddHours(1), start.AddHours(3), "Room B", 1));
        Assert.NotNull(err2);
        Assert.Contains("R3", err2);
    }

    // R4: Start must be in the future
    [Fact]
    public async Task R4_StartMustBeInFuture_ReturnsError()
    {
        using var db = CreateDb();
        await SeedAsync(db);
        var svc = CreateService(db);
        var past = DateTime.UtcNow.AddHours(-2);
        var (dto, error) = await svc.CreateAsync(new CreateReservationDto(1, 1, past, past.AddHours(1), "Past", 1));
        Assert.NotNull(error);
        Assert.Contains("R4", error);
    }

    // R5: AttendeesCount must not exceed capacity
    [Fact]
    public async Task R5_CapacityExceeded_ReturnsError()
    {
        using var db = CreateDb();
        await SeedAsync(db);
        var svc = CreateService(db);
        var start = DateTime.UtcNow.AddDays(1);
        // Room capacity is 5, sending 10 attendees
        var (dto, error) = await svc.CreateAsync(new CreateReservationDto(1, 1, start, start.AddHours(1), "Too many", 10));
        Assert.NotNull(error);
        Assert.Contains("R5", error);
    }

    // R6: Booking horizon exceeded
    [Fact]
    public async Task R6_BookingHorizonExceeded_ReturnsError()
    {
        using var db = CreateDb();
        await SeedAsync(db);
        var svc = CreateService(db);
        var farFuture = DateTime.UtcNow.AddDays(100);
        var (dto, error) = await svc.CreateAsync(new CreateReservationDto(1, 1, farFuture, farFuture.AddHours(1), "Too far", 1));
        Assert.NotNull(error);
        Assert.Contains("R6", error);
    }

    // R7: Room must be active
    [Fact]
    public async Task R7_InactiveRoom_ReturnsError()
    {
        using var db = CreateDb();
        await SeedAsync(db);
        db.Rooms.Add(new Room { Name = "Inactive Room", Capacity = 10, Location = "Floor 1", HasProjector = false, HasWhiteboard = false, HasTVScreen = false, HasVideoConferencing = false, IsActive = false });
        await db.SaveChangesAsync();
        var svc = CreateService(db);
        var start = DateTime.UtcNow.AddDays(1);
        var (dto, error) = await svc.CreateAsync(new CreateReservationDto(2, 1, start, start.AddHours(1), "Inactive room", 1));
        Assert.NotNull(error);
        Assert.Contains("R7", error);
    }

    // Happy path: valid reservation
    [Fact]
    public async Task ValidReservation_CreatesSuccessfully()
    {
        using var db = CreateDb();
        await SeedAsync(db);
        var svc = CreateService(db);
        var start = DateTime.UtcNow.AddDays(1).Date.AddHours(9);
        var (dto, error) = await svc.CreateAsync(new CreateReservationDto(1, 1, start, start.AddHours(1), "Valid", 3));
        Assert.Null(error);
        Assert.NotNull(dto);
        Assert.Equal("Valid", dto.Title);
        Assert.Equal(ReservationStatus.Booked, dto.Status);
    }

    // Cancel changes status, does not delete
    [Fact]
    public async Task Cancel_ChangesStatusToCancelled()
    {
        using var db = CreateDb();
        await SeedAsync(db);
        var svc = CreateService(db);
        var start = DateTime.UtcNow.AddDays(1).Date.AddHours(9);
        var (created, _) = await svc.CreateAsync(new CreateReservationDto(1, 1, start, start.AddHours(1), "To cancel", 1));
        Assert.NotNull(created);
        var (cancelled, err) = await svc.CancelAsync(created!.Id);
        Assert.Null(err);
        Assert.Equal(ReservationStatus.Cancelled, cancelled!.Status);
    }

    // Cancelled slot should be bookable again
    [Fact]
    public async Task CancelledSlot_AllowsNewBooking()
    {
        using var db = CreateDb();
        await SeedAsync(db);
        var svc = CreateService(db);
        var start = DateTime.UtcNow.AddDays(1).Date.AddHours(9);
        var (first, _) = await svc.CreateAsync(new CreateReservationDto(1, 1, start, start.AddHours(1), "First", 1));
        await svc.CancelAsync(first!.Id);
        db.Users.Add(new User { Name = "User 2", Email = "u2@example.com" });
        await db.SaveChangesAsync();
        var (second, err) = await svc.CreateAsync(new CreateReservationDto(1, 2, start, start.AddHours(1), "Second", 1));
        Assert.Null(err);
        Assert.NotNull(second);
    }

    // CompleteAsync on a not-yet-started reservation returns an error
    [Fact]
    public async Task Complete_BeforeStartTime_ReturnsError()
    {
        using var db = CreateDb();
        await SeedAsync(db);
        // Inject a reservation whose StartTime is in the future directly so we bypass R4
        var start = DateTime.UtcNow.AddHours(2);
        db.Reservations.Add(new RoomReservation.API.Models.Reservation
        {
            RoomId = 1, UserId = 1, StartTime = start, EndTime = start.AddHours(1),
            Title = "Future", AttendeesCount = 1, Status = ReservationStatus.Booked
        });
        await db.SaveChangesAsync();
        var svc = CreateService(db);
        var res = await db.Reservations.OrderBy(r => r.Id).LastAsync();
        var (dto, err) = await svc.CompleteAsync(res.Id);
        Assert.NotNull(err);
        Assert.Contains("INVALID_STATUS", err);
        Assert.Null(dto);
    }

    // CompleteAsync on an already-started reservation records ActualEndTime
    [Fact]
    public async Task Complete_AlreadyStarted_RecordsActualEndTime()
    {
        using var db = CreateDb();
        await SeedAsync(db);
        // Inject a reservation that started in the past
        var start = DateTime.UtcNow.AddHours(-1);
        db.Reservations.Add(new RoomReservation.API.Models.Reservation
        {
            RoomId = 1, UserId = 1, StartTime = start, EndTime = start.AddHours(3),
            Title = "In progress", AttendeesCount = 1, Status = ReservationStatus.Booked
        });
        await db.SaveChangesAsync();
        var svc = CreateService(db);
        var res = await db.Reservations.OrderBy(r => r.Id).LastAsync();
        var (dto, err) = await svc.CompleteAsync(res.Id);
        Assert.Null(err);
        Assert.NotNull(dto);
        Assert.Equal(ReservationStatus.Completed, dto!.Status);
        Assert.NotNull(dto.ActualEndTime);
        Assert.True(dto.ActualEndTime <= dto.EndTime);
    }

    // R1: Exactly MaxDurationDays should succeed
    [Fact]
    public async Task R1_ExactlyMaxDurationDays_Succeeds()
    {
        using var db = CreateDb();
        await SeedAsync(db);
        var svc = CreateService(db);
        var start = DateTime.UtcNow.AddDays(1);
        var (dto, error) = await svc.CreateAsync(new CreateReservationDto(1, 1, start, start.AddDays(7), "Exact max", 1));
        Assert.Null(error);
    }

    // R1: One day over MaxDurationDays should fail
    [Fact]
    public async Task R1_OneDayOverMaxDuration_Fails()
    {
        using var db = CreateDb();
        await SeedAsync(db);
        var svc = CreateService(db);
        var start = DateTime.UtcNow.AddDays(1);
        var (dto, error) = await svc.CreateAsync(new CreateReservationDto(1, 1, start, start.AddDays(8), "Over max", 1));
        Assert.NotNull(error);
        Assert.Contains("R1", error);
    }

    // R6: Exactly MaxBookingHorizonDays in the future should succeed
    [Fact]
    public async Task R6_ExactlyHorizonDays_Succeeds()
    {
        using var db = CreateDb();
        await SeedAsync(db);
        var svc = CreateService(db);
        var start = DateTime.UtcNow.AddDays(90);
        var (dto, error) = await svc.CreateAsync(new CreateReservationDto(1, 1, start, start.AddHours(1), "Exact horizon", 1));
        Assert.Null(error);
    }

    // R6: One hour past MaxBookingHorizonDays should fail
    [Fact]
    public async Task R6_HorizonPlusOneHour_Fails()
    {
        using var db = CreateDb();
        await SeedAsync(db);
        var svc = CreateService(db);
        var start = DateTime.UtcNow.AddDays(90).AddHours(1);
        var (dto, error) = await svc.CreateAsync(new CreateReservationDto(1, 1, start, start.AddHours(1), "Past horizon", 1));
        Assert.NotNull(error);
        Assert.Contains("R6", error);
    }

    // After early completion, the same room slot can be rebooked
    [Fact]
    public async Task EarlyCompletion_AllowsRebook()
    {
        using var db = CreateDb();
        await SeedAsync(db);
        db.Users.Add(new User { Name = "User 2", Email = "u2@example.com" });
        // Reservation that started 30 min ago and runs for 3 hours
        var start = DateTime.UtcNow.AddMinutes(-30);
        db.Reservations.Add(new RoomReservation.API.Models.Reservation
        {
            RoomId = 1, UserId = 1, StartTime = start, EndTime = start.AddHours(3),
            Title = "Long meeting", AttendeesCount = 1, Status = ReservationStatus.Booked
        });
        await db.SaveChangesAsync();
        var svc = CreateService(db);
        var res = await db.Reservations.OrderBy(r => r.Id).LastAsync();
        // End it early now
        var (completedDto, err) = await svc.CompleteAsync(res.Id);
        Assert.Null(err);
        // ActualEndTime is set to approximately now, well before the original EndTime (2.5 h later)
        Assert.NotNull(completedDto!.ActualEndTime);
        // A new booking starting in 1 minute (future, required by R4) for the same room should succeed
        var newStart = DateTime.UtcNow.AddMinutes(1);
        var (newDto, newErr) = await svc.CreateAsync(
            new CreateReservationDto(1, 2, newStart, newStart.AddHours(1), "After early end", 1));
        Assert.Null(newErr);
        Assert.NotNull(newDto);
    }
}
