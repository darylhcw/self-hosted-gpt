import { useCallback } from 'react';
import { sendChatStream, getModels } from '@/api/chat';
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
  const chatColl = useChatCollection();
  const collection = chatColl.collection;

  const chat = useChat(initialChatId());
  const currentChat = chat.chat;

  const sysMsg = currentChat.messages[0]?.role == "system" ? currentChat.messages[0] : null;
  const sysMessageTokens = sysMsg ? countTokens(sysMsg) : 0;

  const settings = useUserSettings();

  function addNewChat() {
    if (currentChat.new) return;

    let id = 1;
    const lastChat = collection.at(-1);
    if (lastChat) id = lastChat.id + 1;

    chat.newChat(id);
  }

  // Used when changing system message on new chat.
  function refreshNewChat() {
    if (!currentChat.new) return;

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
    let messageId = lastUserMessage ? lastUserMessage.id : currentChat.messages.length;

    const messages = [...currentChat.messages]
    chat.setStatus(sentChatId, "SENDING");

    await sendAndReceiveFromGPT(sentChatId, messageId, messages, chatTokens);
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
    const last = collection.at(-1);
    return last ? last.id : null;
  }

  function hasSentMessage() {
    const lastSender = currentChat?.messages.at(-1)?.role;
    return lastSender !== "system";
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
        </div>
      </main>
    </div>
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
