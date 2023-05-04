import { memo } from 'react';
import SideBarChat from '@/components/SideBarChat';
import { ChatCollection } from '@/types';
import style from './SideBar.module.css'


interface SideBarProps {
  coll : ChatCollection;
  setCurrentChat: (id: number) => void;
  addNewChat: () => void;
  setChatTitle: (chatId: number, title: string) => void;
  deleteChat: (chatId: number) => void;
}

export default function SideBar({
  coll,
  setCurrentChat,
  addNewChat,
  setChatTitle,
  deleteChat,
} : SideBarProps
){

  return (
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
    </nav>
  )
}

const MemoedSideBarChat = memo(SideBarChat);