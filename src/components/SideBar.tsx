import { useState, memo } from 'react';
import UserSettings from './UserSettings';
import SideBarChat from '@/components/SideBarChat';
import { ChatCollection } from '@/types';
import styles from './SideBar.module.css'


interface SideBarProps {
  coll : ChatCollection;
  setCurrentChat: (id: number) => void;
  addNewChat: () => void;
  refreshNewChat: () => void;
  setChatTitle: (chatId: number, title: string) => void;
  deleteChat: (chatId: number) => void;
}

export default function SideBar({
  coll,
  setCurrentChat,
  addNewChat,
  refreshNewChat,
  setChatTitle,
  deleteChat,
} : SideBarProps
){
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <>
      {/* Modal: Layout independent of rest of content */}
      { settingsOpen && <UserSettings refreshNewChat={refreshNewChat}
                                      closeSettings={() => setSettingsOpen(false)}/> }

      <nav className={styles.container}>
        <div className={styles["top-buttons"]}>
          <button onClick={addNewChat} className={styles.new}>
            <pre>+  New Chat</pre>
          </button>
          <button onClick={() => setSettingsOpen(!settingsOpen)}
                  className={styles.settings}>
            <img src="settings-light.svg" alt="settings"/>
          </button>
        </div>
        <ol className={styles["chat-container"]}>
          {coll.map((chat) =>
            <li key={chat.id}>
              <MemoedSideBarChat header={chat}
                                 setCurrentChat={setCurrentChat}
                                 setChatTitle={setChatTitle}
                                 deleteChat={deleteChat}/>
            </li>
          )}
        </ol>
      </nav>
    </>
  )
}

const MemoedSideBarChat = memo(SideBarChat);