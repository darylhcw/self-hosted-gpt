import '@/markdown-styles/tokyo-night-dark.css';
import { memo } from 'react';
import MessageCard from '@/components/MessageCard';
import { useUserSettings } from '@/hooks/useUserSettings';
import { Chat } from '@/types';

export interface ChatMessagesProps {
  editMessage: (messageId: number, content: string) => void
  chat: Chat | undefined;
}


export default function ChatMessages({editMessage, chat} : ChatMessagesProps) {
  const settings = useUserSettings();

  return (
    <>
      { chat?.messages.map((message, index) => {
          if (message.role === 'system') return null;
          return (<MemoisedMessageCard key={index}
                                       theme={settings.theme}
                                       message={message}
                                       editMessage={editMessage}/>);
        }
      )}
    </>
  )
}

const MemoisedMessageCard = memo(MessageCard);
