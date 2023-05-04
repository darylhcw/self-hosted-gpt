import { ChatHeader } from '@/types';
import styles from './SideBarChat.module.css'


interface SideBarChatProps {
  header: ChatHeader;
  setCurrentChat: (id: number) => void;
  setChatTitle: (chatId: number, title: string) => void;
  deleteChat: (chatId: number) => void;
}


export default function SideBarChat({
  header,
  setCurrentChat,
  setChatTitle,
  deleteChat,
} : SideBarChatProps) {
  return (
    <div className={styles.container}>
      <button onClick={() => setCurrentChat(header.id)}>
        <img src="chat-bubble.svg"/>
        {header.title}
        <p>{header.preview}</p>
      </button>
      <button onClick={() => setChatTitle(header.id, test(header.title))}>
        <img src="edit.svg"/>
      </button>
      <button onClick={() => deleteChat(header.id)}>
        <img src="trash.svg"/>
      </button>
    </div>
  )
}

const test = (a:string) => {
  if (a.length == 1) {
    return a + "ASDF";
  }

  let v = ""
  for (let i = a.length-1; i >=0; i--) {
    v += a.charAt(i);
  }
  return v;
}
