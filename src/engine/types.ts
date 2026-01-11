// Game Types for Brazilian Checkers (Damas Brasileiras)

export type Player = 'white' | 'black';

export type PieceType = 'pawn' | 'king';

export interface Piece {
  player: Player;
  type: PieceType;
}

export interface Position {
  row: number;
  col: number;
}

export interface Move {
  from: Position;
  to: Position;
  captures: Position[];
  isPromotion: boolean;
}

export interface GameState {
  board: (Piece | null)[][];
  currentPlayer: Player;
  selectedPiece: Position | null;
  validMoves: Move[];
  capturedWhite: number;
  capturedBlack: number;
  history: HistoryEntry[];
  historyIndex: number;
  gameStatus: GameStatus;
  gameMode: GameMode;
  aiDifficulty: AIDifficulty;
  winner: Player | null;
}

export interface HistoryEntry {
  board: (Piece | null)[][];
  currentPlayer: Player;
  capturedWhite: number;
  capturedBlack: number;
  move: Move | null;
}

export type GameStatus = 'menu' | 'playing' | 'paused' | 'ended';

export type GameMode = 'pvp' | 'pve' | 'online';

export type AIDifficulty = 'easy' | 'medium' | 'hard';

// Board dimensions
export const BOARD_SIZE = 8;
export const PIECES_PER_PLAYER = 12;

// Online Multiplayer Types
export type RoomStatus = 'waiting' | 'playing' | 'ended';

export interface Room {
  id: string;
  name: string;
  hostId: string;
  hostName: string;
  guestId?: string;
  guestName?: string;
  status: RoomStatus;
  board?: (Piece | null)[][];
  currentPlayer?: Player;
  capturedWhite?: number;
  capturedBlack?: number;
}

export interface OnlinePlayer {
  id: string;
  name: string;
  color: Player;
}

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface OnlineGameState {
  connectionStatus: ConnectionStatus;
  room: Room | null;
  rooms: Room[];
  localPlayer: OnlinePlayer | null;
  remotePlayer: OnlinePlayer | null;
  playerName: string;
  error: string | null;
}
