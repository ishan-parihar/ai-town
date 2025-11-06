import { useQuery, useMutation } from '../hooks/useApi';
import { KeyboardEvent, useRef, useState } from 'react';

interface Player {
  id: string;
  human?: string;
}

interface Conversation {
  id: string;
  participants: string[];
}

export function MessageInput({
  worldId,
  humanPlayer,
  conversation,
}: {
  worldId: string;
  humanPlayer: Player;
  conversation: Conversation;
}) {
  const { data: gameDescriptions } = useQuery('/api/world/gameDescriptions');
  
  const [message, setMessage] = useState('');
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  const { mutate: send } = useMutation();

  const sendMessage = async () => {
    if (!message.trim()) return;
    
    const conversationId = conversation.id;
    
    try {
      await send('/api/messages/send', {
        conversationId,
        author: humanPlayer.id,
        text: message,
        worldId
      });
      setMessage('');
      if (textAreaRef.current) {
        textAreaRef.current.style.height = 'auto';
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void sendMessage();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    if (textAreaRef.current) {
      textAreaRef.current.style.height = 'auto';
      textAreaRef.current.style.height = `${textAreaRef.current.scrollHeight}px`;
    }
  };

  return (
    <div className="flex gap-2 p-4 border-t border-gray-200">
      <textarea
        ref={textAreaRef}
        value={message}
        onChange={handleInput}
        onKeyDown={handleKeyDown}
        placeholder="Type your message..."
        className="flex-1 resize-none rounded-lg border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        rows={1}
      />
      <button
        onClick={sendMessage}
        disabled={!message.trim()}
        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
      >
        Send
      </button>
    </div>
  );
}