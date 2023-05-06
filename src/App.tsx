import { useState, useCallback } from 'react';
import { sendChat, getModels } from '@/api/chat';
import SideBar from '@/components/SideBar';
import ChatMessages from '@/components/ChatMessages';
import MessageBox from '@/components/MessageBox';
import { useUserSettings } from './hooks/useUserSettings';
import { useChatCollection } from './hooks/useChatCollection';
import { useChat } from './hooks/useChat';
import { ChatMessage, Role } from './types';
import { Constants } from './constants';
import styles from './App.module.css';


export default function App() {
  const chatColl = useChatCollection();
  const collection = chatColl.collection;

  const chat = useChat(initialChatId());
  const currentChat = chat.chat;

  const settings = useUserSettings();

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
  }, [currentChat.id, chat.deleteChat, chatColl.deleteChat, addNewChat])

  async function sendCallback(message: string) {
    const sentChatId = currentChat.id;
    const chatTokens = currentChat.tokens;
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

    sendAndReceiveFromGPT(sentChatId, messageId, messages, chatTokens);
  }

  const editCallback = useCallback(async(messageId: number, content: string) => {
    const sentChatId = currentChat.id;
    const editedMessages = getMessagesAfterEdit(messageId, content);
    chat.editMessage(editedMessages);
    const chatTokens = editedMessages.reduce((accum, message) => accum + (message.tokens ?? 0) , 0);

    await sendAndReceiveFromGPT(sentChatId, messageId, editedMessages, chatTokens);
    chat.refreshChatTokens(sentChatId);
  }, [currentChat]);

  async function resendCallback() {
    const sentChatId = currentChat.id;
    const chatTokens = currentChat.tokens;
    const lastMessage = currentChat.messages.at(-1);
    let messageId = lastMessage ? lastMessage.id : 1;

    const messages = [...currentChat.messages]
    chat.setStatus(sentChatId, "SENDING");

    sendAndReceiveFromGPT(sentChatId, messageId, messages, chatTokens);
  }

  async function sendAndReceiveFromGPT(sentChatId: number, messageId: number, messages: ChatMessage[], chatTokens?: number) {
    const res = await sendChat(settings.apiKey ?? "", settings.model, messages);

    if (res.status === "SUCCESS") {
      const gptResponse = res.data?.choices?.[0]?.message;
      if (gptResponse) {
        gptResponse.id = messageId + 1;
        chat.addMessage(sentChatId, gptResponse);

        chatTokens = chatTokens ?? 0;
        const usage = res.data?.usage;
        const promptTokens = usage?.prompt_tokens ?? 0;
        const completionTokens = usage?.completion_tokens ?? 0;
        const currentMessageTokens = promptTokens - chatTokens;
        chat.setMessageTokens(sentChatId, messageId, currentMessageTokens);
        chat.setMessageTokens(sentChatId, messageId + 1, completionTokens);
        chat.setChatTokens(sentChatId, chatTokens + promptTokens + completionTokens);
      }
      chat.setStatus(sentChatId, "READY");
    } else if (res.status === "ERROR") {
      chat.setStatus(sentChatId, "ERROR");
      const errData = res.data;
      const errMsg = errData.error ? errData.error.message : errData;
      chat.setErrorMessage(sentChatId, String(errMsg));
    }
  }

  function initialChatId() {
    const last = collection.at(-1);
    return last ? last.id : null;
  }

  function getLastChatSender() {
    const lastSender = currentChat?.messages.at(-1)?.role;
    return lastSender ?? null;
  }

  function getMessagesAfterEdit(messageId: number, content: string) {
    const messages = currentChat.messages;

    // delete all after the target message (same as ChatGPT - content useless after)
    const targetMessage = currentChat.messages.findLast((message) => message.id === messageId);
    if (!targetMessage) {
      console.error("Couldn't find target message during edit message!");
      return messages;
    }

    const newMessage = {
      id: messageId,
      role: targetMessage.role,
      content: content,
    }

    const newMessages = messages.filter((message) => message.id < messageId);
    newMessages.push(newMessage);

    return newMessages;
  }

  return (
    <>
      <SideBar coll={collection}
               addNewChat={addNewChat}
               setCurrentChat={setCurrentChat}
               setChatTitle={chatColl.setChatTitle}
               deleteChat={deleteChat}/>
      <main className={styles.main}>
        <ChatMessages chat={currentChat} editMessage={editCallback}/>
        <button onClick={() => {setA(a+1)}}>RENDER APP</button>
        <button onClick={() => {getModels(settings.apiKey ?? "")}}>GET MODELS (CONSOLE)</button>
        { currentChat.tokens && overContextLimit(settings.model, currentChat.tokens) && <p>WARNING! OVER CONTEXT LIMIT</p>}
        <p>{`Total tokens: ${currentChat.tokens ?? "0"}`}</p>
        <div className={styles["message-box"]}>
          <MessageBox status={currentChat.status}
                      sendCB={sendCallback}
                      resendCB={resendCallback}
                      lastSender={getLastChatSender()}
                      errMsg={currentChat.latestError ?? undefined}/>
        </div>
      </main>
    </>
  )
}


/*********************************************
 * Misc
 ********************************************/

function overContextLimit(model: string, tokens: number) {
  let max;

  switch(model) {
    case Constants.GPT_3_5: max = Constants.GPT_3_5_MAX_TOKENS; break;
    case Constants.GPT_4: max = Constants.GPT_4_MAX_TOKENS; break;
    default:
  }

  return max ? tokens > max : false;
}
