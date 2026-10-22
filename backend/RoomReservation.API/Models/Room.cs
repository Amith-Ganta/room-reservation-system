namespace RoomReservation.API.Models;

public class Room
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public int Capacity { get; set; }
    public string Location { get; set; } = string.Empty;
    public bool HasProjector { get; set; }
    public bool HasWhiteboard { get; set; }
    public bool HasTVScreen { get; set; }
    public bool HasVideoConferencing { get; set; }
    public bool IsActive { get; set; } = true;
    public ICollection<Reservation> Reservations { get; set; } = new List<Reservation>();
}
