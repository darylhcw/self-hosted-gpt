import { useState, useEffect } from 'react';
import { sendChat } from '@/api/chat';
import ChatMessages from '@/components/ChatMessages';
import MessageBox from '@/components/MessageBox';
import { useChatCollection } from './hooks/chatCollection';
import { useChat } from './hooks/chat';
import { UserSettings, Role } from './types';
import { Constants } from './constants';
import styles from './App.module.css';


export default function App() {
  const chatCollection = useChatCollection();
  const chat = useChat(initialChatId());
  const currentChat = chat.chat;

  const [settings, setSettings] = useState<UserSettings>(initialSettings());
  const model = settings.model;

  useEffect(() => {
  /*   if (!currentChat && chatHistory.length > 0) {
      setCurrentChat(chatHistory.at(-1));
    }

    // TODO: Reexamine?
    const currentId = currentChat?.id
    if (currentId) {
      const newCurrentChat = chatHistory.find((chat) => chat.id === currentId);
      setCurrentChat(newCurrentChat);
    }
 */
  }, [])

  async function sendCallback(message: string) {
    const newMessage = {
      role: "user" as Role,
      content: message,
    }

    chat.addMessage(newMessage);
    if (currentChat.new) {
      chatCollection.addChat(chat.getDefaultHeader(message))
      chat.setNew(false);
    }

    const messages = [...currentChat.messages, newMessage]

    const res = await sendChat(model, messages);
    if (res.status === "SUCCESS") {
      const gptResponse = res.data?.choices[0]?.message;
      if (gptResponse) {
        chat.addMessage(gptResponse);
      }
    } else if (res.status === "ERROR") {
      // Show error message/reason
      // Change to "regenerate response"
      // Do different send (don't append user sent message).
    }
  }

  function initialChatId() {
    const last = chatCollection.collection.at(-1);
    if (last) return last.id;

    return null;
  }

  return (
    <main className={styles.main}>
      <ChatMessages chat={currentChat}/>
      <div className={styles["message-box"]}>
        <MessageBox sendCB={sendCallback}/>
      </div>
    </main>
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
