import { SelectElement } from './Player';
import { toastOnError } from '../toasts';
import { useSendInput } from '../hooks/sendInput';
import { GameId, Id } from '../types/game';
import { ServerGame } from '../hooks/serverGame';

export default function PlayerDetails({
  worldId,
  engineId,
  game,
  playerId,
  setSelectedElement,
  scrollViewRef,
}: {
  worldId: Id<'worlds'>;
  engineId: Id<'engines'>;
  game: ServerGame;
  playerId: GameId<'players'> | string | undefined;
  setSelectedElement: any;
  scrollViewRef: React.RefObject<HTMLDivElement>;
}) {
  const sendInput = useSendInput();

  const handleLeaveConversation = async () => {
    try {
      await sendInput({
        type: 'leaveConversation',
        playerId,
      });
      setSelectedElement();
    } catch (error) {
      toastOnError('Failed to leave conversation', error);
    }
  };

  // Try to find as player first, then as agent
  const player = game?.world?.players?.find((p: any) => p.id === playerId);
  const agent = game?.world?.agents?.find((a: any) => a.id === playerId);
  
  if (!player && !agent) {
    return (
      <div className="player-details">
        <h3>AI Council LifeOS</h3>
        <div className="text-center py-8">
          <div className="text-lg mb-4">Welcome to your AI Council</div>
          <div className="text-sm opacity-75">
            Select an AI council member to begin
          </div>
        </div>
        <div>
          <h4>Available Council Members</h4>
          {game?.world?.agents?.map((ag: any) => (
            <div 
              key={ag.id} 
              className="p-3 border rounded cursor-pointer hover:bg-gray-100"
              onClick={() => setSelectedElement({ kind: 'agent', id: ag.id })}
            >
              <div className="font-semibold">{ag.id}</div>
              <div className="text-sm opacity-75">Status: {ag.status}</div>
            </div>
          )) || <div>No council members available</div>}
        </div>
      </div>
    );
  }

  const entity = player || agent;
  const isAgent = !!agent;

  return (
    <div className="player-details">
      <h3>{isAgent ? 'AI Council Member' : 'Player Details'}</h3>
      <p>{isAgent ? 'Agent' : 'Player'} ID: {playerId}</p>
      
      {agent && (
        <div>
          <h4>Agent Information</h4>
          <div>Status: {agent.status}</div>
          <div>Position: {agent.position?.x}, {agent.position?.y}</div>
        </div>
      )}
      
      {player && (
        <div>
          <h4>Player Information</h4>
          <div>Status: {player.status}</div>
          <div>Position: {player.position?.x}, {player.position?.y}</div>
        </div>
      )}
      
      {!isAgent && (
        <button onClick={handleLeaveConversation}>Leave Conversation</button>
      )}
      
      <div>
        <h4>Messages</h4>
        <div>Messages component would go here</div>
      </div>
    </div>
  );
}