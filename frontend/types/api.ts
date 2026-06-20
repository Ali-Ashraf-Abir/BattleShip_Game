// Mirrors backend C# DTOs / models exactly. Keep field names + casing in sync
// with the .NET backend (System.Text.Json defaults to camelCase on the wire).

export enum ShipType {
  Carrier = 0,
  Battleship = 1,
  Cruiser = 2,
  Submarine = 3,
  Destroyer = 4,
}

export const SHIP_LENGTHS: Record<ShipType, number> = {
  [ShipType.Carrier]: 5,
  [ShipType.Battleship]: 4,
  [ShipType.Cruiser]: 3,
  [ShipType.Submarine]: 3,
  [ShipType.Destroyer]: 2,
};

export const SHIP_LABELS: Record<ShipType, string> = {
  [ShipType.Carrier]: "Carrier",
  [ShipType.Battleship]: "Battleship",
  [ShipType.Cruiser]: "Cruiser",
  [ShipType.Submarine]: "Submarine",
  [ShipType.Destroyer]: "Destroyer",
};

export enum GameStatus {
  WaitingForPlayer = 0,
  PlacingShips = 1,
  InProgress = 2,
  // Backend enum may have more members (e.g. Finished) not yet confirmed.
}

export const GAME_STATUS_LABELS: Record<number, string> = {
  [GameStatus.WaitingForPlayer]: "Waiting for player",
  [GameStatus.PlacingShips]: "Placing ships",
  [GameStatus.InProgress]: "In progress",
};

// ---------- Users ----------

// CreateUserDto.cs -> record CreateUserDto(string Name)
export interface CreateUserDto {
  name: string;
}

// UserResponseDto.cs -> record UserResponseDto(Guid Id, string DisplayName)
export interface UserResponseDto {
  id: string;
  displayName: string;
}

// User.cs model (not directly returned by any endpoint we have, kept for reference)
export interface UserModel {
  id: string;
  displayName: string;
  wins: number;
  losses: number;
  gamesPlayed: number;
}

// ---------- Games ----------

// GameCreationDto.cs -> record CreateGameDto(Guid HostId, int GridSize)
export interface CreateGameDto {
  hostId: string;
  gridSize: number;
}

// JoinGameDto.cs -> class JoinGameDto { Guid playerId; Guid gameId; }
// NOTE: backend property names are lowercase playerId/gameId (not PascalCase),
// so the JSON wire format is already camelCase here.
export interface JoinGameDto {
  playerId: string;
  gameId: string;
}

// Game.cs model, returned by POST /api/games and POST /api/games/join
export interface GameModel {
  id: string;
  hostId: string;
  opponentId: string | null;
  gridSize: number;
  status: GameStatus;
  currentTurnPlayerId: string | null;
  createdAt: string;
  host?: UserModel;
  opponent?: UserModel | null;
}

// ---------- Ships ----------

// ShipPlacementDto.cs
export interface ShipPlacementDto {
  shipType: ShipType;
  startX: number;
  startY: number;
  isVertical: boolean;
}

// ReadyUpDto.cs
export interface ReadyUpDto {
  gameId: string;
  playerId: string;
  ships: ShipPlacementDto[];
}

// AddShipDto.cs - currently unused by any controller route we were given,
// kept here in case an endpoint for it shows up later.
export interface AddShipDto {
  gameId: string;
  playerId: string;
  shipType: ShipType;
  startX: number;
  startY: number;
  isVertical: boolean;
}

// ---------- Generic API error shape ----------
// Controllers currently return BadRequest(ex.Message) - a raw string, not JSON.
export interface ApiError {
  status: number;
  message: string;
}
