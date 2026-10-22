namespace RoomReservation.API.DTOs;

public record RoomDto(
    int Id,
    string Name,
    int Capacity,
    string Location,
    bool HasProjector,
    bool HasWhiteboard,
    bool HasTVScreen,
    bool HasVideoConferencing,
    bool IsActive
);

public record CreateRoomDto(
    string Name,
    int Capacity,
    string Location,
    bool HasProjector,
    bool HasWhiteboard,
    bool HasTVScreen,
    bool HasVideoConferencing,
    bool IsActive = true
);

public record UpdateRoomDto(
    string Name,
    int Capacity,
    string Location,
    bool HasProjector,
    bool HasWhiteboard,
    bool HasTVScreen,
    bool HasVideoConferencing,
    bool IsActive
);
