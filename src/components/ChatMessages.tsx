import '@/markdown-styles/tokyo-night-dark.css';
import { memo } from 'react';
import MessageCard from "@/components/MessageCard";
import { Chat } from "@/types";

export interface ChatMessagesProps {
  editMessage: (messageId: number, content: string) => void
  chat: Chat | undefined;
}


export default function ChatMessages({editMessage, chat} : ChatMessagesProps) {
  return (
    <>
      { chat?.messages.map((message, index) => {
          if (message.role === "system") return null;
          return (<MemoisedMessageCard key={index} message={message} editMessage={editMessage}/>);
        }
      )}
    </>
  )
}

const MemoisedMessageCard = memo(MessageCard);
