import { Character } from './Character.tsx';
import { orientationDegrees, GameId, ServerPlayer, Location, locationFields, playerLocation, PlayerDescription, WorldMap } from '../types/game.ts';
import { characters } from '../../data/characters.ts';
import { toast } from 'react-toastify';
import { useHistoricalValue } from '../hooks/useHistoricalValue.ts';
import { ServerGame } from '../hooks/serverGame.ts';

export type SelectElement = (element?: { kind: 'player' | 'agent'; id: string }) => void;

const logged = new Set<string>();

export const Player = ({
  game,
  isViewer,
  player,
  onClick,
  historicalTime,
}: {
  game: ServerGame;
  isViewer: boolean;
  player: ServerPlayer | any; // Allow agent objects

  onClick: SelectElement;
  historicalTime?: number;
}) => {
  // Check if this is an agent or player
  const isAgent = player.isAgent || !game.playerDescriptions.has(player.id);
  
  // Get character data from agent descriptions or player descriptions
  const entityDescription = isAgent 
    ? game.agentDescriptions.get(player.id)
    : game.playerDescriptions.get(player.id);
    
  const playerCharacter = entityDescription?.character || 'f1'; // Default fallback
  
  if (!playerCharacter) {
    console.warn(`Entity ${player.id} has no character, using default`);
  }
  
  const character = characters.find((c) => c.name === playerCharacter) || characters[0]; // Fallback to first character

  // For agents, use position directly; for players, use historical locations
  const locationBuffer = game.world.historicalLocations?.get(player.id);
  let historicalLocation;
  
  if (isAgent) {
    // Agents have direct position
    historicalLocation = {
      x: player.position?.x || 10,
      y: player.position?.y || 10,
      dx: 0,
      dy: 0,
      speed: 0
    };
  } else {
    // Players use historical locations
    historicalLocation = useHistoricalValue<Location>(
      locationFields,
      historicalTime,
      playerLocation(player),
      locationBuffer,
    );
  }
  
  if (!character) {
    if (!logged.has(playerCharacter)) {
      logged.add(playerCharacter);
      toast.error(`Unknown character ${playerCharacter}`);
    }
    return null;
  }

  if (!historicalLocation) {
    return null;
  }

  const isSpeaking = !![...game.world.conversations.values()].find(
    (c) => c.isTyping?.playerId === player.id,
  );
  const isThinking =
    !isSpeaking &&
    !![...game.world.agents.values()].find(
      (a) => a.playerId === player.id && !!a.inProgressOperation,
    );
  const tileDim = game.worldMap?.tileDim || 32; // Fallback tile dimension
  const historicalFacing = { dx: historicalLocation.dx, dy: historicalLocation.dy };
  return (
    <>
      <Character
        x={historicalLocation.x * tileDim + tileDim / 2}
        y={historicalLocation.y * tileDim + tileDim / 2}
        orientation={orientationDegrees(historicalFacing)}
        isMoving={historicalLocation.speed > 0}
        isThinking={isThinking}
        isSpeaking={isSpeaking}
        emoji={
          player.activity && player.activity.until > (historicalTime ?? Date.now())
            ? player.activity?.emoji
            : undefined
        }
        isViewer={isViewer}
        textureUrl={character.textureUrl}
        spritesheetData={character.spritesheetData}
        speed={character.speed}
        onClick={() => {
          onClick({ kind: isAgent ? 'agent' : 'player', id: player.id });
        }}
      />
    </>
  );
};
