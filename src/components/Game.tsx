import { useRef, useState } from 'react';
import PixiGame from './PixiGame.tsx';
import { useElementSize } from 'usehooks-ts';
import { Stage } from '@pixi/react';
import PlayerDetails from './PlayerDetails.tsx';
import { useQuery } from '../hooks/useApi';
import { useWorldHeartbeat } from '../hooks/useWorldHeartbeat.ts';
import { useHistoricalTime } from '../hooks/useHistoricalTime.ts';
import { DebugTimeManager } from './DebugTimeManager.tsx';
import { useServerGame } from '../hooks/serverGame.ts';

export const SHOW_DEBUG_UI = false;

export default function Game() {
  const [selectedElement, setSelectedElement] = useState<{
    kind: 'player' | 'agent';
    id: string;
  }>();
  const [gameWrapperRef, { width, height }] = useElementSize();

  const worldStatus = useQuery('world/defaultWorldStatus');
  const worldId = worldStatus.data?.worldId;
  const engineId = worldStatus.data?.engineId;

  const game = useServerGame(worldId);

  // Send a periodic heartbeat to our world to keep it alive.
  useWorldHeartbeat();

  const worldState = useQuery('world/worldState', worldId ? { worldId } : 'skip');
  const { historicalTime, timeManager } = useHistoricalTime(worldState.data?.engine);

  const scrollViewRef = useRef<HTMLDivElement>(null);

  if (!worldId || !engineId || !game) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-white text-center">
          <div className="text-xl mb-4">Loading AI Council LifeOS...</div>
          <div className="text-sm opacity-75">Initializing your personal council</div>
        </div>
      </div>
    );
  }

  return (
    <>
      {SHOW_DEBUG_UI && <DebugTimeManager timeManager={timeManager} width={200} height={100} />}
      <div className="mx-auto w-full max-w grid grid-rows-[240px_1fr] lg:grid-rows-[1fr] lg:grid-cols-[1fr_auto] lg:grow max-w-[1400px] min-h-[480px] game-frame">
        {/* Game area */}
        <div className="relative overflow-hidden bg-brown-900" ref={gameWrapperRef}>
          <div className="absolute inset-0">
            <div className="container">
              <Stage width={width} height={height} options={{ backgroundColor: 0x7ab5ff }}>
                <PixiGame
                  game={game}
                  worldId={worldId}
                  engineId={engineId}
                  humanPlayerId={undefined}
                  isPlaying={true}
                />
              </Stage>
            </div>
          </div>
        </div>
        {/* Right column area */}
        <div
          className="flex flex-col overflow-y-auto shrink-0 px-4 py-6 sm:px-6 lg:w-96 xl:pr-6 border-t-8 sm:border-t-0 sm:border-l-8 border-brown-900  bg-brown-800 text-brown-100"
          ref={scrollViewRef}
        >
          <PlayerDetails
            worldId={worldId}
            engineId={engineId}
            game={game}
            playerId={selectedElement?.id as any}
            setSelectedElement={setSelectedElement}
            scrollViewRef={scrollViewRef}
          />
        </div>
      </div>
    </>
  );
}