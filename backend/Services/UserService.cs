using backend.Data;
using backend.Models;
using backend.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

public class UserService(ApplicationDbContext _db) : IUserService
{
    public async Task<User> CreateUserAsync(string name)
{
    var existing = await _db.Users.CountAsync(u =>u.DisplayName.StartsWith(name));
    var displayName = existing == 0? name: $"{name} {existing + 1}";
    var user = new User
    {
        DisplayName = displayName
    };
    _db.Users.Add(user);
    await _db.SaveChangesAsync();
    return user;
}
}