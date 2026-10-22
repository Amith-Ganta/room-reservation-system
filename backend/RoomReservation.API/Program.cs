using System.Text.Json.Serialization;
using Microsoft.EntityFrameworkCore;
using RoomReservation.API.Data;
using RoomReservation.API.Options;
using RoomReservation.API.Repositories;
using RoomReservation.API.Services;

var builder = WebApplication.CreateBuilder(args);

// EF Core InMemory database
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseInMemoryDatabase("RoomReservationDb"));

builder.Services.Configure<ReservationOptions>(
    builder.Configuration.GetSection("Reservation"));

// Repositories
builder.Services.AddScoped<RoomRepository>();
builder.Services.AddScoped<UserRepository>();
builder.Services.AddScoped<ReservationRepository>();

// Services
builder.Services.AddScoped<RoomService>();
builder.Services.AddScoped<UserService>();
builder.Services.AddScoped<ReservationService>();

builder.Services.AddControllers()
    .AddJsonOptions(opts =>
    {
        opts.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
    });
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new() { Title = "Room Reservation API", Version = "v1" });
});

// CORS — allow React dev server
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
        policy.WithOrigins("http://localhost:5173", "http://localhost:3000")
              .AllowAnyHeader()
              .AllowAnyMethod());
});

var app = builder.Build();

// Seed demo data
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    DbSeeder.Seed(db);
}

app.UseSwagger();
app.UseSwaggerUI(c => c.SwaggerEndpoint("/swagger/v1/swagger.json", "Room Reservation API v1"));

app.UseCors("AllowFrontend");
app.UseAuthorization();
app.MapControllers();

app.Run();
