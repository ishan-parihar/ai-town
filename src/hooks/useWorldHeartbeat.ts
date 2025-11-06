import { useQuery, useMutation } from './useApi';
import { useEffect } from 'react';

const WORLD_HEARTBEAT_INTERVAL = 30_000; // 30 seconds

export function useWorldHeartbeat() {
  const worldStatus = useQuery('world/defaultWorldStatus');
  const { mutate: heartbeat } = useMutation();
  const worldId = worldStatus.data?.worldId;

  // Send a periodic heartbeat to our world to keep it alive.
  useEffect(() => {
    const sendHeartBeat = async () => {
      if (!worldStatus.data) {
        return;
      }
      // Don't send a heartbeat if we've observed one sufficiently close
      // to the present.
      if (Date.now() - WORLD_HEARTBEAT_INTERVAL / 2 < worldStatus.data.lastViewed) {
        return;
      }
      try {
        await heartbeat('world/heartbeatWorld', { worldId: worldStatus.data.worldId });
      } catch (error) {
        console.warn('Heartbeat failed:', error);
      }
    };
    
    sendHeartBeat();
    const id = setInterval(sendHeartBeat, WORLD_HEARTBEAT_INTERVAL);
    return () => clearInterval(id);
    // Rerun if the `worldId` changes but not `worldStatus`, since don't want to
    // resend the heartbeat whenever its last viewed timestamp changes.
  }, [worldId, heartbeat, worldStatus.data]);
}