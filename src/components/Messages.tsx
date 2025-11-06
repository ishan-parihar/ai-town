import clsx from 'clsx';
import { useQuery } from '../hooks/useApi';
import { MessageInput } from './MessageInput';
import { useEffect, useRef } from 'react';

interface Player {
  id: string;
  human?: string;
}

interface Conversation {
  id: string;
  participants: string[];
}

interface Message {
  id: string;
  conversationId: string;
  author: string;
  text: string;
  created_at: number;
}

export function Messages({
  worldId,
  conversation,
  inConversationWithMe,
  humanPlayer,
}: {
  worldId: string;
  conversation: Conversation;
  inConversationWithMe: boolean;
  humanPlayer: Player;
}) {
  const { data: messages } = useQuery(`/api/messages?conversationId=${conversation.id}`);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  if (!inConversationWithMe) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        <p>Select a conversation to view messages</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages?.map((message: Message) => (
          <div
            key={message.id}
            className={clsx(
              'flex',
              message.author === humanPlayer.id ? 'justify-end' : 'justify-start'
            )}
          >
            <div
              className={clsx(
                'max-w-xs lg:max-w-md px-4 py-2 rounded-lg',
                message.author === humanPlayer.id
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-900'
              )}
            >
              <p className="text-sm">{message.text}</p>
              <p className="text-xs mt-1 opacity-70">
                {new Date(message.created_at).toLocaleTimeString()}
              </p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      
      <MessageInput
        worldId={worldId}
        humanPlayer={humanPlayer}
        conversation={conversation}
      />
    </div>
  );
}