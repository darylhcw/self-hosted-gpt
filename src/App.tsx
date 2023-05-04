import { useState, useCallback } from 'react';
import { sendChat } from '@/api/chat';
import SideBar from '@/components/SideBar';
import ChatMessages from '@/components/ChatMessages';
import MessageBox from '@/components/MessageBox';
import { useChatCollection } from './hooks/chatCollection';
import { useChat } from './hooks/chat';
import { UserSettings, Role } from './types';
import { Constants } from './constants';
import styles from './App.module.css';


export default function App() {
  const chatColl = useChatCollection();
  const collection = chatColl.collection;

  const chat = useChat(initialChatId());
  const currentChat = chat.chat;

  const [settings, setSettings] = useState<UserSettings>(initialSettings());
  const model = settings.model;

  const [a, setA] = useState(1);

  function addNewChat() {
    if (currentChat.new) return;

    let id = 1;
    const lastChat = collection.at(-1);
    if (lastChat) id = lastChat.id + 1;

    chat.newChat(id);
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
      addNewChat();
    }
  }, [currentChat.id, chat.deleteChat, chatColl.deleteChat])

  async function sendCallback(message: string) {
    const sentChatId = currentChat.id;
    const lastMessage = currentChat.messages.at(-1);
    let messageId = lastMessage ? lastMessage.id + 1 : 1;

    const newMessage = {
      id: messageId,
      role: "user" as Role,
      content: message,
    }

    chat.addMessage(sentChatId, newMessage);
    if (currentChat.new) {
      chatColl.addChat(chat.getDefaultHeader(message))
      chat.setOld();
    }

    const messages = [...currentChat.messages, newMessage]
    chat.setStatus(sentChatId, "SENDING");

    const res = await sendChat(model, messages);
    if (res.status === "SUCCESS") {
      const gptResponse = res.data?.choices?.[0]?.message;
      if (gptResponse) {
        gptResponse.id = messageId + 1;
        chat.addMessage(sentChatId, gptResponse);
      }
      chat.setStatus(sentChatId, "READY");
    } else if (res.status === "ERROR") {
      // Show error message/reason
      // Change to "regenerate response"
      chat.setStatus(sentChatId, "ERROR");
    }
  }

  function initialChatId() {
    const last = collection.at(-1);
    return last ? last.id : null;
  }

  return (
    <>
      <SideBar coll={collection}
               addNewChat={addNewChat}
               setCurrentChat={setCurrentChat}
               setChatTitle={chatColl.setChatTitle}
                deleteChat={deleteChat}/>
      <main className={styles.main}>
        <ChatMessages chat={currentChat} editMessage={chat.editMessage}/>
        <button onClick={() => {setA(a+1)}}>RENDER APP</button>
        <div className={styles["message-box"]}>
          <MessageBox status={currentChat.status} sendCB={sendCallback}/>
        </div>
      </main>
    </>
  )
}

/*********************************************
 * Init
 ********************************************/

function initialSettings() {
  return {
    model : Constants.GPT_3_5
  }
}
