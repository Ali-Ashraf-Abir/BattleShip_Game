
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

}

export const GAME_STATUS_LABELS: Record<number, string> = {
  [GameStatus.WaitingForPlayer]: "Waiting for player",
  [GameStatus.PlacingShips]: "Placing ships",
  [GameStatus.InProgress]: "In progress",
};


export interface CreateUserDto {
  name: string;
}
export type ShipTypeName =
  | "Carrier"
  | "Battleship"
  | "Cruiser"
  | "Submarine"
  | "Destroyer";
 
const SHIP_TYPE_NAME_TO_ENUM: Record<ShipTypeName, ShipType> = {
  Carrier: ShipType.Carrier,
  Battleship: ShipType.Battleship,
  Cruiser: ShipType.Cruiser,
  Submarine: ShipType.Submarine,
  Destroyer: ShipType.Destroyer,
};
export function shipTypeFromApi(value: ShipTypeName): ShipType {
  return SHIP_TYPE_NAME_TO_ENUM[value];
}
export interface UserResponseDto {
  id: string;
  displayName: string;
}


export interface UserModel {
  id: string;
  displayName: string;
  wins: number;
  losses: number;
  gamesPlayed: number;
}


export interface CreateGameDto {
  hostId: string;
  gridSize: number;
}


export interface JoinGameDto {
  playerId: string;
  gameId: string;
}


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


export interface ShipPlacementDto {
  shipType: ShipType;
  startX: number;
  startY: number;
  isVertical: boolean;
}

export interface ReadyUpDto {
  gameId: string;
  playerId: string;
  ships: ShipPlacementDto[];
}


export interface AddShipDto {
  gameId: string;
  playerId: string;
  shipType: ShipType;
  startX: number;
  startY: number;
  isVertical: boolean;
}


export interface ApiError {
  status: number;
  message: string;
}


export type AttackDto = {
  gameId: string;
  attackerId: string;
  x: number;
  y: number;
};


export type AttackResultDto = {
  gameId: string;
  attackerId: string;
  x: number;
  y: number;
  isHit: boolean;
  sunkShipType: ShipTypeName | null; 
  isGameOver: boolean;
  winnerId: string | null;
  nextTurnPlayerId: string;
};


export type ShipDto = {
  shipType: ShipTypeName; 
  startX: number;
  startY: number;
  isVertical: boolean;
  length: number;
};
 
export type OpponentShipSummaryDto = {
  shipType: ShipTypeName; 
  isSunk: boolean;
};


export type AttackLogDto = {
  attackerId: string;
  x: number;
  y: number;
  isHit: boolean;
};

export type GameStateDto = {
  gameId: string;
  hostId: string;
  opponentId: string | null;
  gridSize: number;
  status: GameStatus; 
  currentTurnPlayerId: string | null;
  winnerId: string | null;
  myShips: ShipDto[];
  opponentShipSummary: OpponentShipSummaryDto[];
  attacks: AttackLogDto[];
};