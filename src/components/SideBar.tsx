import { useState, memo, Fragment } from 'react';
import UserSettings from './UserSettings';
import SideBarChat from '@/components/SideBarChat';
import ChatStorageBar from '@/components/ChatStorageBar';
import { dateAndFuncPairs } from '@/util/dates';
import { ChatCollection } from '@/types';
import styles from './SideBar.module.css'

const MemoedSideBarChat = memo(SideBarChat);

interface SideBarProps {
  coll : ChatCollection;
  setCurrentChat: (id: number) => void;
  startNewChat: () => void;
  setChatTitle: (chatId: number, title: string) => void;
  deleteChat: (chatId: number) => void;
}

export default function SideBar({
  coll,
  setCurrentChat,
  startNewChat,
  setChatTitle,
  deleteChat,
} : SideBarProps
){
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  function searchCB(e: React.ChangeEvent<HTMLInputElement>) {
    setSearchQuery(e.target.value);
  }

  const sortedColl = coll.sort((headerA, headerB) => {
    if (headerA.createdAt > headerB.createdAt) return -1;
    if (headerA.createdAt < headerB.createdAt) return 1;
    if (headerA.createdAt === headerB.createdAt) return 0;
    return 1;
  })

  let filteredColl;
  if (searchQuery.trim().length > 0) {
    const lowerQuery = searchQuery.toLowerCase();
    filteredColl = sortedColl.filter((coll) => coll.title.toLowerCase().includes(lowerQuery));
  } else {
    filteredColl = sortedColl;
  }

  const dateFuncPairs = dateAndFuncPairs();
  let added = false;

  function renderDateLabelIfNeeded(createdAt: number) {
    let last = dateFuncPairs.at(-1);
    if (!last) return null;

    while (last && !last.dateFunc(createdAt)) {
      added = false;
      dateFuncPairs.pop();
      last = dateFuncPairs.at(-1);
    }

    if (!added && last) {
      added = true;
      return (
        <li key={last.date + createdAt} className={styles["date-label"]}>
          {last.date}
        </li>
      )
    }

    return null;
  }

  return (
    <>
      {/* Modal: Layout independent of rest of content */}
      { settingsOpen && <UserSettings refreshNewChat={startNewChat}
                                      closeSettings={() => setSettingsOpen(false)}/> }

      <nav className={styles.container}>
        <div className={styles["top-buttons"]}>
          <button onClick={startNewChat} className={styles.new}>
            +    New Chat
          </button>
          <button onClick={() => setSettingsOpen(!settingsOpen)}
                  className={styles.settings}>
            <img src="settings-light.svg" alt="settings"/>
          </button>
        </div>
        <div className={styles.search}>
          <input type="text"
                 placeholder="Search..."
                 value={searchQuery}
                 onChange={searchCB}/>
          { searchQuery.trim().length > 0 &&
            <button onClick={() => setSearchQuery("")}>
              &#10006;
            </button>
          }
        </div>
        <ol className={styles["chats-container"]}>
          {filteredColl.map((chat) =>
            <Fragment key={chat.id}>
              { renderDateLabelIfNeeded(chat.createdAt) }
              <li>
                <MemoedSideBarChat header={chat}
                                   setCurrentChat={setCurrentChat}
                                   setChatTitle={setChatTitle}
                                   deleteChat={deleteChat}/>
              </li>
            </Fragment>
          )}
        </ol>
        <ChatStorageBar/>
      </nav>
    </>
  )
}
