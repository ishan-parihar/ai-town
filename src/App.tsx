import { useState, useEffect } from 'react';
import Game from './components/Game.tsx';
import { ToastContainer } from 'react-toastify';
import PoweredBySelfHosted from './components/PoweredBySelfHosted.tsx';
import MusicButton from './components/buttons/MusicButton.tsx';
import Button from './components/buttons/Button.tsx';
import InteractButton from './components/buttons/InteractButton.tsx';
import FreezeButton from './components/FreezeButton.tsx';
import ReactModal from 'react-modal';

export default function Home() {
  const [helpModalOpen, setHelpModalOpen] = useState(false);

  // Initialize PIXI.js Assets system
  useEffect(() => {
    const initPixi = async () => {
      try {
        const { Assets } = await import('pixi.js');
        await Assets.init();
        console.log('✅ PIXI.js Assets initialized successfully');
      } catch (error) {
        console.warn('⚠️ PIXI.js Assets initialization failed:', error);
      }
    };
    initPixi();
  }, []);

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-between font-body game-background">
      <PoweredBySelfHosted />
      
      {/* Game UI with title and description */}
      <h1 className="text-center text-6xl font-bold font-display game-title">AI Council LifeOS</h1>
      <div className="text-center text-white">
        Your personal AI council providing holistic life guidance and insights.
      </div>
      
      {/* The actual PIXI.js game */}
      <Game />
      
      {/* Footer with control buttons */}
      <footer className="flex items-center gap-3 p-6">
        <FreezeButton />
        <MusicButton />
        <Button href="https://github.com/a16z-infra/ai-town">
          Star
        </Button>
        <InteractButton />
        <Button 
          onClick={() => setHelpModalOpen(true)}
        >
          Help
        </Button>
      </footer>

      {/* Help Modal */}
      <ReactModal
        isOpen={helpModalOpen}
        onRequestClose={() => setHelpModalOpen(false)}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
        overlayClassName="fixed inset-0 bg-black bg-opacity-50"
      >
        <div className="bg-gray-800 rounded-lg p-6 max-w-2xl max-h-[80vh] overflow-y-auto text-white">
          <h2 className="text-2xl font-bold mb-4">AI Council LifeOS Guide</h2>
          <div className="space-y-4 text-gray-300">
            <p>
              Welcome to AI Council LifeOS! Your personal council of 8 specialized AI advisors 
              provides holistic guidance across all life domains through an interactive virtual world.
            </p>
            <div>
              <h3 className="font-semibold text-white mb-2">Your Council Members:</h3>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li><span className="text-green-400">Aria</span> - Life Coach & Personal Development</li>
                <li><span className="text-blue-400">Marcus</span> - Financial Analyst & Wealth Management</li>
                <li><span className="text-pink-400">Dr. Lena</span> - Health & Wellness Advisor</li>
                <li><span className="text-orange-400">Sophia</span> - Career Strategist</li>
                <li><span className="text-purple-400">David</span> - Relationship Counselor</li>
                <li><span className="text-cyan-400">Ruby</span> - Knowledge Curator</li>
                <li><span className="text-yellow-400">Max</span> - Productivity Manager</li>
                <li><span className="text-gray-400">Nova</span> - Integration Coordinator</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-2">How to Use:</h3>
              <ul className="list-disc list-inside space-y-1">
                <li>Click on council members to speak with them individually</li>
                <li>Drag to move around the council chamber</li>
                <li>Scroll to zoom in/out of the space</li>
                <li>Watch council members interact and collaborate</li>
                <li>Receive personalized insights based on your goals</li>
              </ul>
            </div>
          </div>
          <button
            onClick={() => setHelpModalOpen(false)}
            className="mt-6 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </ReactModal>
      
      <ToastContainer />
    </main>
  );
}