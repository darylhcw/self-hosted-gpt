import { useState, useEffect, useRef } from 'react';
import GrowingTextArea from './GrowingTextArea';
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

  const [editedTitle, setEditedTitle] = useState(header.title);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const titleTxtArea = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    titleTxtArea.current?.focus();
  }, [isEditingTitle]);

  function editTitleCB() {
    if (isEditingTitle) {
      setChatTitle(header.id, editedTitle);
    }
    setIsEditingTitle(!isEditingTitle);
  }

  function handleEditTitleChange(event: React.ChangeEvent<HTMLTextAreaElement>) {
    setEditedTitle(event.target.value);
  }

  function deleteCB() {
    deleteChat(header.id);
  }

  function cancelEditCB() {
    setEditedTitle(header.title);
    setIsEditingTitle(false);
  }

  return (
    <div className={styles.container}>
      <button onClick={() => setCurrentChat(header.id)}
              className={styles.chat}>
        <img src="chat-bubble-light.svg" alt="chat-bubble"/>
        <div className={styles["chat-name"]}>
          { isEditingTitle
              ? <GrowingTextArea ref={titleTxtArea}
                                 onChange={handleEditTitleChange}
                                 value={editedTitle}/>
              : <h2 className="ellipsis-text">{header.title}</h2>
          }
          <p className="ellipsis-text">{header.preview}</p>
        </div>
      </button>
      <button onClick={editTitleCB}
              className={`${styles["action-button"]} hover-brighten`}>
        <img src={isEditingTitle ? "correct-light.svg" : "edit-light.svg"}
             alt={isEditingTitle ? "Confirm" : "Edit"}/>
      </button>
      <button onClick={isEditingTitle ? cancelEditCB : deleteCB}
              className={`${styles["action-button"]} hover-brighten`}>
        <img src={isEditingTitle ? "cross-light.svg" : "trash-light.svg"}
             alt={isEditingTitle ? "Cancel" : "Delete"}/>
      </button>
    </div>
  )
}
