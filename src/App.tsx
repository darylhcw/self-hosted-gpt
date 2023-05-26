import { useState, useEffect, useCallback } from 'react';
import { sendChatStream, overContextLimit, getModels } from '@/api/chat';
import SideBar from '@/components/SideBar';
import ChatMessages from '@/components/ChatMessages';
import MessageBox from '@/components/MessageBox';
import { useUserSettings } from './hooks/useUserSettings';
import { useChatCollection } from './hooks/useChatCollection';
import { useChat } from './hooks/useChat';
import { ChatMessage, Role } from './types';
import { countTokens } from '@/tokenCounter';
import { Constants } from './constants';
import styles from './App.module.css';


export default function App() {
  const [scrolledToBottom, setScrolledToBottom] = useState(false)

  const chatColl = useChatCollection();
  const collection = chatColl.collection;

  const chat = useChat(initialChatId());
  const currentChat = chat.chat;

  const sysMsg = currentChat.messages[0]?.role == "system" ? currentChat.messages[0] : null;
  const sysMessageTokens = sysMsg ? countTokens(sysMsg) : 0;

  const settings = useUserSettings();

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  function handleScroll() {
    const offset = -3;  // In case of rounding errors.
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

  function addNewChat() {
    if (currentChat.new) return;

    chat.newChat(chatColl.latestChatId() + 1);
  }

  // Used when changing system message on new chat.
  function refreshNewChat() {
    if (!currentChat.new) return;

    chat.newChat(chatColl.latestChatId() + 1);
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

    await sendAndReceiveFromGPT(sentChatId, messageId, messages, chatTokens);
  }

  const editCallback = useCallback(async(messageId: number, content: string) => {
    const sentChatId = currentChat.id;
    const editedMessages = getMessagesAfterEdit(messageId, content);
    chat.editMessages(editedMessages);
    const chatTokens = editedMessages.reduce((accum, message) => accum + (message.tokens ?? 0) , 0);

    await sendAndReceiveFromGPT(sentChatId, messageId, editedMessages, chatTokens);
    chat.refreshChatTokens(sentChatId);
  }, [currentChat]);

  async function resendCallback() {
    const sentChatId = currentChat.id;
    const chatTokens = currentChat.tokens;
    const lastUserMessage = currentChat.messages.findLast((message) => message.role === "user");
    const messageId = lastUserMessage ? lastUserMessage.id : currentChat.messages.length;
    const editedMessages = getMessagesAfterEdit(messageId, lastUserMessage?.content);
    chat.setStatus(sentChatId, "SENDING");
    chat.setPartialMessage(sentChatId, messageId, "");

    await sendAndReceiveFromGPT(sentChatId, messageId, editedMessages, chatTokens);
    chat.refreshChatTokens(sentChatId);
  }

  async function sendAndReceiveFromGPT(sentChatId: number, messageId: number, messages: ChatMessage[], chatTokens?: number) {
    const resMsgId = messageId + 1;

    const resMsg = {
      id: resMsgId,
      role: "assistant" as Role,
      content: "",
    };
    chat.addMessage(sentChatId, resMsg);

    function readCB(partial: string) {
      chat.setPartialMessage(sentChatId, resMsgId, partial);
    }

    const res = await sendChatStream(settings.apiKey ?? "", settings.model, messages, readCB);
    if (res.status === "SUCCESS") {
      const gptResponse = res.data;
      if (gptResponse) {
        chat.editMessage(sentChatId, resMsgId, gptResponse);

        chatTokens = chatTokens ?? 0;
        resMsg.content = gptResponse;
        const sent = messages.at(-1);
        const promptTokens = sent ? countTokens(sent) : 0;
        const completionTokens = countTokens(resMsg);

        chat.setMessageTokens(sentChatId, messageId, promptTokens);
        chat.setMessageTokens(sentChatId, resMsgId, completionTokens);
        chat.setChatTokens(sentChatId, chatTokens + promptTokens + completionTokens);
      }
      chat.setStatus(sentChatId, "READY");

    } else if (res.status === "ERROR") {
      chat.setStatus(sentChatId, "ERROR");
      const errData = res.data;
      const errMsg = errData.error ? errData.error.message : errData;
      chat.setErrorMessage(sentChatId, String(errMsg));
    }
    chat.setPartialMessage(sentChatId, resMsgId, "");
  }

  function initialChatId() {
    return chatColl.latestChatIdByDate();
  }

  function hasSentMessage() {
    const lastSender = currentChat?.messages.at(-1)?.role;
    return lastSender !== "system";
  }

  function getMessagesAfterEdit(messageId: number, content: string | undefined) {
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
      content: content ?? targetMessage.content,
    }

    const newMessages = messages.filter((message) => message.id < messageId);
    newMessages.push(newMessage);

    return newMessages;
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
               addNewChat={addNewChat}
               refreshNewChat={refreshNewChat}
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
