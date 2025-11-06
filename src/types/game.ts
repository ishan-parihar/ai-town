// Basic types for self-hosted configuration

export type GameId<T extends string> = string;

export interface Id<T extends string> {
  tableName: T;
  id: string;
}

export interface Location {
  x: number;
  y: number;
  dx: number;
  dy: number;
  speed: number;
  [key: string]: number;
}

export interface ServerPlayer {
  id: GameId<'players'>;
  activity?: {
    emoji: string;
    until: number;
  };
}

export interface PlayerDescription {
  character: string;
}

export interface AnimatedSprite {
  sheet: string;
  animation: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface WorldMap {
  tileDim: number;
  tileSetUrl: string;
  tileSetDimX: number;
  tileSetDimY: number;
  bgTiles: number[][][];
  objectTiles: number[][][];
  animatedSprites: AnimatedSprite[];
}

export const locationFields = {
  x: Number,
  y: Number,
  dx: Number,
  dy: Number,
  speed: Number,
};

export function playerLocation(player: ServerPlayer): Location {
  return {
    x: 0,
    y: 0,
    dx: 0,
    dy: 0,
    speed: 0,
  };
}

export function orientationDegrees(facing: { dx: number; dy: number }): number {
  return Math.atan2(facing.dy, facing.dx) * (180 / Math.PI);
}