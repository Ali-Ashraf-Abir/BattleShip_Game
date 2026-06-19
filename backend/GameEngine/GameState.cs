namespace backend.GameEngine;

using backend.Enums;

public class GameState
{
    public Guid GameId { get; set; }

    public CellState[,] Player1Board { get; set; }
    public CellState[,] Player2Board { get; set; }
    public int GridSize { get; set; }

    public Guid CurrentTurnPlayerId { get; set; }
    public bool HostReady{get;set;}
    public bool OpponentReady{get;set;}
    public GameState(Guid gameId,int gridSize)
    {
        GameId = gameId;
        GridSize = gridSize;
        Player1Board =new CellState[gridSize, gridSize];
        Player2Board =new CellState[gridSize, gridSize];
    }
}