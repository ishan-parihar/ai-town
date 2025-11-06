import { Graphics } from '@pixi/react';
import { Graphics as PixiGraphics } from 'pixi.js';
import { useCallback } from 'react';

interface Player {
  id: string;
  pathfinding?: {
    state: {
      kind: string;
      path?: any[];
    };
  };
}

export function DebugPath({ player, tileDim }: { player: Player; tileDim: number }) {
  const path = player.pathfinding?.state.kind == 'moving' && player.pathfinding.state.path;
  const draw = useCallback(
    (g: PixiGraphics) => {
      g.clear();
      if (!path) {
        return;
      }
      let first = true;
      for (const p of path) {
        const { position } = unpackPathComponent(p as any);
        const x = position.x * tileDim + tileDim / 2;
        const y = position.y * tileDim + tileDim / 2;
        if (first) {
          g.moveTo(x, y);
          g.lineStyle(2, debugColor(player.id), 0.5);
          first = false;
        } else {
          g.lineTo(x, y);
        }
      }
    },
    [path],
  );
  return path ? <Graphics draw={draw} /> : null;
}

function unpackPathComponent(path: any): { position: { x: number; y: number } } {
  // Simplified implementation for self-hosted
  if (typeof path === 'object' && path.position) {
    return path;
  }
  // Fallback for legacy format
  return { position: { x: path.x || 0, y: path.y || 0 } };
}

function debugColor(_id: string) {
  return { h: 0, s: 50, l: 90 };
}