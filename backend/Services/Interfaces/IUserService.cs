namespace backend.Services.Interfaces;
using backend.Models;

public interface IUserService
{
    Task<User> CreateUserAsync(string name);
     Task<User> GetUserByID(Guid userId);
}