import { ChatMessage } from "@/types";
import styles from "./MessageCard.module.css";

export default function MessageCard({ message } : {message: ChatMessage}) {
  return (
    <>
      <p>{message.role}</p>
      <p>{message.content}</p>
    </>
  )
}