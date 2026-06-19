namespace backend.Services.Interfaces;

using backend.Dtos;
using backend.Models;

public interface IShipService
{

    public Task ReadyUpAsync(ReadyUpDto dto);
}