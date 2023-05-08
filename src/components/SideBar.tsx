import { useState, memo } from 'react';
import UserSettings from './UserSettings';
import SideBarChat from '@/components/SideBarChat';
import { ChatCollection } from '@/types';
import style from './SideBar.module.css'


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

      <nav>
        <button onClick={addNewChat}>New Chat</button>
        <ol>
          {coll.map((chat) =>
            <li key={chat.id}>
              <MemoedSideBarChat header={chat}
                                 setCurrentChat={setCurrentChat}
                                 setChatTitle={setChatTitle}
                                 deleteChat={deleteChat}/>
            </li>
          )}
        </ol>
      <button onClick={() => setSettingsOpen(!settingsOpen)}>Settings</button>
      </nav>
    </>
  )
}

const MemoedSideBarChat = memo(SideBarChat);