using System.Text.Json.Serialization;
using backend.Data;
using backend.Hubs;
using backend.Services;
using backend.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddSignalR();
builder.Services.AddControllers();
builder.Services.AddDbContext<ApplicationDbContext>(options =>options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<IGameService, GameService>();
builder.Services.AddScoped<IShipService,ShipService>();
builder.Services.AddSingleton<GameStateManager>();

builder.Services
    .AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(
            new JsonStringEnumConverter());
    });
    
var app = builder.Build();

app.MapGet("/", () => "Hello World!");
app.MapHub<GameHub>(
    "/hubs/game");
app.MapControllers();
app.Run();
