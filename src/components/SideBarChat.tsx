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
      <button onClick={() => setCurrentChat(header.id)}
              className={styles.chat}>
        <img src="chat-bubble-light.svg"/>
        <div className={styles["chat-name"]}>
          <h2 className="ellipsis-text">{header.title}</h2>
          <p className="ellipsis-text">{header.preview}</p>
        </div>
      </button>
      <button onClick={() => setChatTitle(header.id, test(header.title))}
              className={styles["action-button"]}>
        <img src="edit-light.svg"/>
      </button>
      <button onClick={() => deleteChat(header.id)}
              className={styles["action-button"]}>
        <img src="trash-light.svg"/>
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
