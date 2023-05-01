import '@/markdown-styles/tokyo-night-dark.css';
import MessageCard from "@/components/MessageCard";
import { Chat } from "@/types";

export default function ChatMessages({chat} : {chat: Chat | undefined}) {
  return (
    <>
      { chat?.messages.map((message) =>
        <MessageCard message={message}/>
      )}
    </>
  )
}