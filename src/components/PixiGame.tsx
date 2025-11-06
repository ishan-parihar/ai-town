import * as PIXI from 'pixi.js';
import { useApp } from '@pixi/react';
import { Player, SelectElement } from './Player.tsx';
import { useEffect, useRef, useState } from 'react';
import { PixiStaticMap, preloadMapAssets } from './PixiStaticMap.tsx';
import PixiViewport from './PixiViewport.tsx';
import { Viewport } from 'pixi-viewport';
import { useQuery } from '../hooks/useApi';
import { useSendInput } from '../hooks/sendInput.ts';
import { toastOnError } from '../toasts.ts';
import { DebugPath } from './DebugPath.tsx';
import { PositionIndicator } from './PositionIndicator.tsx';
import { SHOW_DEBUG_UI } from './Game.tsx';
import { ServerGame } from '../hooks/serverGame.ts';

const PixiGame = (props: {
  worldId: string;
  engineId: string;
  game: ServerGame;
  humanPlayerId: string | undefined;
  isPlaying: boolean;
}) => {
  const { worldId, engineId, game, humanPlayerId, isPlaying } = props;
  const app = useApp();
  const viewport = useRef<Viewport | null>(null);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  
  const { data: gameDescriptions } = useQuery('/api/world/gameDescriptions');
  const sendInput = useSendInput();

  // Initialize viewport
  useEffect(() => {
    if (!viewport.current && app) {
      viewport.current = new Viewport({
        screenWidth: window.innerWidth,
        screenHeight: window.innerHeight,
        worldWidth: 1000,
        worldHeight: 1000,
        events: app.renderer.events,
      });

      viewport.current
        .drag()
        .pinch()
        .wheel()
        .decelerate();

      app.stage.addChild(viewport.current);
    }

    return () => {
      if (viewport.current) {
        app.stage.removeChild(viewport.current);
      }
    };
  }, [app]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (viewport.current) {
        viewport.current.resize(window.innerWidth, window.innerHeight);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Preload map assets
  useEffect(() => {
    // Create a default map for now
    const defaultMap: any = {
      tileSetUrl: '/assets/tileset.png',
      tileSetDimX: 256,
      tileSetDimY: 256,
      tileDim: 32,
      bgTiles: [[[0]]],
      objectTiles: [],
      animatedSprites: []
    };
    preloadMapAssets(defaultMap).catch(console.error);
  }, []);

  // Handle player movement
  const handleTileClick = async (x: number, y: number) => {
    if (!isPlaying || !humanPlayerId) return;

    try {
      await sendInput({
        type: 'move',
        playerId: humanPlayerId,
        x,
        y,
      });
    } catch (error) {
      toastOnError('Failed to move player', error);
    }
  };

  return (
    <>
      <PixiStaticMap
        viewport={viewport.current}
        gameDescriptions={gameDescriptions}
        onTileClick={handleTileClick}
        map={{
          tileDim: 32,
          tileSetUrl: '/assets/tileset.png',
          tileSetDimX: 256,
          tileSetDimY: 256,
          bgTiles: [[[0]]],
          objectTiles: [],
          animatedSprites: []
        }}
      />
      
      {game?.world?.players?.map((player: any) => (
        <Player
          key={player.id}
          game={game}
          isViewer={player.id === humanPlayerId}
          player={player}
          onClick={(element) => element && setSelectedElement(element.id)}
        />
      ))}
      
      {SHOW_DEBUG_UI && humanPlayerId && (
        <DebugPath
          player={game?.world?.players?.find((p: any) => p.id === humanPlayerId)}
          tileDim={32}
        />
      )}
      
      {selectedElement && (
        <div style={{ position: 'absolute', top: 10, left: 10, background: 'white', padding: 5 }}>
          Selected: {selectedElement}
        </div>
      )}
    </>
  );
};

export default PixiGame;