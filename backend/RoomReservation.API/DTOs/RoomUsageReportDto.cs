namespace RoomReservation.API.DTOs;

public record RoomUsageReportRow(
    int RoomId,
    string RoomName,
    int Capacity,
    int TotalBookings,
    int CompletedBookings,
    int CancelledBookings,
    double TotalScheduledHours,
    double TotalActualHours,
    double UtilisationPct
);
