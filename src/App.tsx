import { useState, useEffect, useCallback, useRef } from 'react';
import { overContextLimit, getModels } from '@/api/chat';
import SideBar from '@/components/SideBar';
import ChatMessages from '@/components/ChatMessages';
import MessageBox from '@/components/MessageBox';
import { useUserSettings } from './hooks/useUserSettings';
import { useChatCollection } from './hooks/useChatCollection';
import { useChat } from './hooks/useChat';
import { countTokens } from '@/tokenCounter';
import { Constants } from './constants';
import styles from './App.module.css';


export default function App() {
  const mainRef = useRef<HTMLElement>(null);
  const [scrolledToBottom, setScrolledToBottom] = useState(true)

  const chatColl = useChatCollection();
  const collection = chatColl.collection;

  const chat = useChat();
  const currentChat = chat.chat;
  const isNewChat = currentChat.id === Constants.BLANK_CHAT_ID;

  const sysMsg = currentChat.messages[0]?.role == "system" ? currentChat.messages[0] : null;
  const sysMessageTokens = sysMsg ? countTokens(sysMsg) : 0;

  const settings = useUserSettings();

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    handleScroll();
  }, [currentChat]);

  useEffect(() => {
    // Do on <html> tag because for some reason overwriting body css (in global.css)
    // and setting class here don't work on Firefox...so used <html> for both.
    if (settings.theme === "DARK") {
      document.documentElement.classList.add(Constants.SCROLLBAR_DARK_CLASS);
      document.body.classList.add(Constants.BG_DARK_CLASS);
    } else {
      document.documentElement.classList.remove(Constants.SCROLLBAR_DARK_CLASS);
      document.body.classList.remove(Constants.BG_DARK_CLASS);
    }
  }, [settings.theme]);

  function handleScroll() {
    const main = mainRef.current;
    if (!main) return;

    const offset = -2;  // In case of rounding errors.
    const scrolled = window.scrollY + window.innerHeight - main.scrollHeight;

    if (scrolled > offset) {
      setScrolledToBottom(true);
    } else if (scrolled <= offset) {
      setScrolledToBottom(false);
    }
  };

  function scrollToBottom() {
    const main = mainRef.current;
    if (!main) return;

    window.scrollTo({top: main.scrollHeight});
  }

  function startNewChat() {
    chat.setBlankNewChat();
  }

  const setCurrentChat = useCallback((id: number) => {
    if (id !== currentChat.id) {
      chat.setCurrentChat(id);
    }
  }, [currentChat.id, chat.setCurrentChat])

  const deleteChat = useCallback((id: number) => {
    chat.deleteChat(id)
    chatColl.deleteChat(id)
    if (id === currentChat.id) {
      startNewChat();
    }
  }, [currentChat.id, chat.deleteChat, chatColl.deleteChat, startNewChat])

  async function sendCallback(message: string) {
    // Need to add new chat!
    let sentChat = currentChat;
    if (isNewChat) {
      const addedChat = await chat.newChat(message);
      if (addedChat) {
        await chatColl.addNewChat(addedChat)
        sentChat = addedChat;
      } else {
        console.error("SendCallback failed to add new chat!");
        return;
      }
    }
    chat.sendMessage(sentChat, message);
  }

  const editCallback = useCallback(async(messageId: number, content: string) => {
    chat.editMessage(currentChat.id, messageId, content);
  }, [currentChat.id]);

  const resendCallback = useCallback(async() => {
    chat.resendMessage(currentChat.id);
  }, [currentChat.id]);

  function hasSentMessage() {
    const lastSender = currentChat?.messages.at(-1)?.role;
    return lastSender !== "system";
  }

  function renderScrollToBottomButton() {
    return (
      <button className={`${styles["scroll-bottom"]} ${settings.theme == "DARK" ? styles["dark"] : ""}`}
              onClick={() => scrollToBottom()}>
        <img src={`arrow-down${ settings.theme == "DARK" ? "-light" : ""}.svg`}/>
      </button>
    )
  }

  return (
    <div id={Constants.MODAL_MAIN_ELEM} className={styles.wrapper}>
      <SideBar coll={collection}
               startNewChat={startNewChat}
               setCurrentChat={setCurrentChat}
               setChatTitle={chatColl.setChatTitle}
               deleteChat={deleteChat}/>
      <main className={`${styles.main} ${settings.theme == "DARK" ? styles.dark : ""}`}
            ref={mainRef}>
        <div className={styles.messages}>
          <ChatMessages chat={currentChat} editMessage={editCallback}/>
        </div>
        <div className={`${styles.tokens} ${settings.theme == "DARK" ? styles.dark : ""}`}>
          { currentChat.tokens && overContextLimit(settings.model, currentChat.tokens)
            && <p className={`${styles.warning} ${settings.theme == "DARK" ? styles.dark : ""}`}>
                WARNING! OVER CONTEXT LIMIT
              </p>
          }
          <p>{`System message tokens: ${sysMessageTokens}`}</p>
          <p>{`Total tokens: ${currentChat.tokens ?? "0"}`}</p>
        </div>
        <div className={styles["message-box"]}>
          <MessageBox status={currentChat.status}
                      sendCB={sendCallback}
                      resendCB={resendCallback}
                      hasMsg={hasSentMessage()}/>
          { !scrolledToBottom && renderScrollToBottomButton() }
        </div>
      </main>
    </div>
  )
}
