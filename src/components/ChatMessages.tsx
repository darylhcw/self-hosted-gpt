import '@/markdown-styles/tokyo-night-dark.css';
import { memo } from 'react';
import MessageCard from '@/components/MessageCard';
import { useUserSettings } from '@/hooks/useUserSettings';
import { Constants } from '@/constants';
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
      { chat?.messages.map((message, index) => {
          if (message.role === 'system') return null;

          let errMsg;
          if (index === chat.messages.length - 1 && chat.status === "ERROR") {
            errMsg = Constants.DEFAULT_ERR_MSG;
            if (chat.latestError) {
              errMsg = errMsg + "\n\n" + chat.latestError;
            }
          }
          return (<MemoisedMessageCard key={index}
                                       theme={settings.theme}
                                       message={message}
                                       editMessage={editMessage}
                                       errMsg={errMsg}/>);
        }
      )}
    </div>
  )
}

const MemoisedMessageCard = memo(MessageCard);
