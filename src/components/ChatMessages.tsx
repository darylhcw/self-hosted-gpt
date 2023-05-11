import '@/markdown-styles/tokyo-night-dark.css';
import { memo } from 'react';
import MessageCard from '@/components/MessageCard';
import { useUserSettings } from '@/hooks/useUserSettings';
import { Chat } from '@/types';
import styles from './ChatMessages.module.css';

export interface ChatMessagesProps {
  editMessage: (messageId: number, content: string) => void
  chat: Chat | undefined;
}


export default function ChatMessages({editMessage, chat} : ChatMessagesProps) {
  const settings = useUserSettings();

  return (
    <div className={styles.container}>
      {/* <div className={styles["extra-card"]}> */}
      {/* </div> */}
      { chat?.messages.map((message, index) => {
          if (message.role === 'system') return null;
          return (<MemoisedMessageCard key={index}
                                       theme={settings.theme}
                                       message={message}
                                       editMessage={editMessage}/>);
        }
      )}
    </div>
  )
}

const MemoisedMessageCard = memo(MessageCard);
