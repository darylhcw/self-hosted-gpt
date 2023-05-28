import { useState, useEffect, useCallback } from 'react';
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

  function handleScroll() {
    const offset = -2;  // In case of rounding errors.
    const scrolled = window.innerHeight + window.scrollY - document.body.offsetHeight;
    if (scrolled > offset) {
      setScrolledToBottom(true);
    } else if (scrolled <= offset) {
      setScrolledToBottom(false);
    }
  };

  function scrollToBottom() {
    window.scrollTo({top: document.body.offsetHeight});
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
      <button className={`${styles["scroll-bottom"]} ${settings.theme == "DARK" ? styles["dark-theme"] : ""}`}
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
      <main className={`${styles.main} ${settings.theme == "DARK" ? styles["bg-dark"] : ""}`}>
        <ChatMessages chat={currentChat} editMessage={editCallback}/>
        <div className={styles.tokens}>
          { currentChat.tokens && overContextLimit(settings.model, currentChat.tokens)
            && <p className={`${styles.warning} ${settings.theme == "DARK" ? styles["dark-theme"] : ""}`}>
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
