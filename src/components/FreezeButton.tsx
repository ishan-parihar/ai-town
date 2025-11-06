import { useQuery, useMutation } from '../hooks/useApi';
import Button from './buttons/Button';

export default function FreezeButton() {
  const { data: stopAllowed } = useQuery('/api/testing/stopAllowed') ?? false;
  const { data: defaultWorld } = useQuery('/api/world');

  const frozen = defaultWorld?.status === 'stoppedByDeveloper';

  const { mutate: unfreeze } = useMutation();
  const { mutate: freeze } = useMutation();

  const flipSwitch = async () => {
    if (frozen) {
      console.log('Unfreezing');
      await unfreeze('/api/testing/resume');
    } else {
      console.log('Freezing');
      await freeze('/api/testing/stop');
    }
  };

  return !stopAllowed ? null : (
    <>
      <Button
        onClick={flipSwitch}
        className="hidden lg:block"
        title="When freezing a world, the agents will take some time to stop what they are doing before they become frozen. "
        imgUrl="/assets/star.svg"
      >
        {frozen ? 'Unfreeze' : 'Freeze'}
      </Button>
    </>
  );
}