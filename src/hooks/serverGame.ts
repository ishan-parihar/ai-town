import { useMemo } from 'react';
import { useQuery } from './useApi';

// Define types locally since we're removing Convex dependencies
export interface AgentDescription {
  agentId: string;
  name: string;
  identity: string;
  plan: string;
  dataFocus: string[];
  expertise: string[];
  role: string;
}

export interface PlayerDescription {
  playerId: string;
  name: string;
  description: string;
}

export interface World {
  id: string;
  name: string;
  status: string;
}

export interface WorldMap {
  width: number;
  height: number;
  tiles: number[][];
}

export type ServerGame = {
  world: any;
  playerDescriptions: Map<string, any>;
  agentDescriptions: Map<string, any>;
  worldMap: any;
};

// TODO: This hook reparses the game state (even if we're not rerunning the query)
// when used in multiple components. Move this to a context to only parse it once.
export function useServerGame(worldId: string | undefined): ServerGame | undefined {
  const worldState = useQuery('world/worldState', worldId ? { worldId } : 'skip');
  const descriptions = useQuery('world/gameDescriptions', worldId ? { worldId } : 'skip');
  
  const game = useMemo(() => {
    if (!worldState.data || !descriptions.data) {
      return undefined;
    }
    
    const worldData = worldState.data as any;
    const descriptionsData = descriptions.data as any;
    
    return {
      world: worldData.world,
      agentDescriptions: new Map<string, any>(
        descriptionsData.agentDescriptions?.map((item: any) => [item.agentId, item]) || []
      ),
      playerDescriptions: new Map<string, any>(
        descriptionsData.playerDescriptions?.map((item: any) => [item.playerId, item]) || []
      ),
      worldMap: descriptionsData.worldMap,
    };
  }, [worldState.data, descriptions.data]);
  return game;
}