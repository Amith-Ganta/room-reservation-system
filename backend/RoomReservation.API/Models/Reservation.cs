namespace RoomReservation.API.Models;

public enum ReservationStatus { Booked, Completed, Cancelled }

public class Reservation
{
    public int Id { get; set; }
    public int RoomId { get; set; }
    public Room Room { get; set; } = null!;
    public int UserId { get; set; }
    public User User { get; set; } = null!;
    public DateTime StartTime { get; set; }
    public DateTime EndTime { get; set; }
    public string Title { get; set; } = string.Empty;
    public int AttendeesCount { get; set; }
    public ReservationStatus Status { get; set; } = ReservationStatus.Booked;
}
