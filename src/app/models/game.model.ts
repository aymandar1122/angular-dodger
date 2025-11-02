export interface Player {
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
}

export interface Enemy {
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
}

export interface GameState {
  player: Player;
  enemies: Enemy[];
  score: number;
  gameOver: boolean;
}
