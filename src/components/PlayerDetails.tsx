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
  playerId: GameId<'players'>;
  setSelectedElement: SelectElement;
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

  const player = game?.world?.players?.find((p: any) => p.id === playerId);
  if (!player) {
    return <div>Player not found</div>;
  }

  return (
    <div className="player-details">
      <h3>Player Details</h3>
      <p>Player ID: {playerId}</p>
      <button onClick={handleLeaveConversation}>Leave Conversation</button>
      <div>
        <h4>Messages</h4>
        <div>Messages component would go here</div>
      </div>
    </div>
  );
}