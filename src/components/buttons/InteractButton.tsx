import Button from './Button';
import { toast } from 'react-toastify';
import interactImg from '../../../assets/interact.svg';
import { useQuery, useMutation } from '../../hooks/useApi';
import { useCallback } from 'react';
import { waitForInput } from '../../hooks/sendInput';
import { useServerGame } from '../../hooks/serverGame';

export default function InteractButton() {
  const { data: worldStatus } = useQuery('/api/world');
  const worldId = worldStatus?.id;
  const game = useServerGame(worldId);
  const humanTokenIdentifier = 'user'; // Simplified for self-hosted
  const userPlayerId = game?.world?.players?.find((p: any) => p.human === humanTokenIdentifier)?.id;
  const { mutate: join } = useMutation();
  const { mutate: leave } = useMutation();
  const isPlaying = !!userPlayerId;

  const joinInput = useCallback(
    async (worldId: string) => {
      let inputId: string;
      try {
        inputId = await join('/api/world/join', { worldId });
      } catch (e: any) {
        toast.error(e.message || 'Failed to join game');
        return;
      }
      try {
        await waitForInput(inputId);
      } catch (e: any) {
        toast.error(e.message);
      }
    },
    [join],
  );

  const joinOrLeaveGame = () => {
    if (!worldId || game === undefined) {
      return;
    }
    if (isPlaying) {
      console.log(`Leaving game for player ${userPlayerId}`);
      void leave('/api/world/leave', { worldId });
    } else {
      console.log(`Joining game`);
      void joinInput(worldId);
    }
  };

  return (
    <Button imgUrl={interactImg} onClick={joinOrLeaveGame}>
      {isPlaying ? 'Leave' : 'Interact'}
    </Button>
  );
}