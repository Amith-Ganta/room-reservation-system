namespace RoomReservation.API.Options;

public class ReservationOptions
{
    public int MaxDurationDays { get; set; } = 7;
    public int MaxBookingHorizonDays { get; set; } = 90;
}
