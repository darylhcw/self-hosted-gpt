import { useEffect, useReducer, useCallback, useRef } from 'react';
import { useUserSettings } from './useUserSettings';
import { addDBChat, getDBChat, getLatestDBChatId, updateDBChat, deleteDBChat } from '@/idb/chat';
import { sendChatStream } from '@/api/chat';
import { countTokens } from '@/tokenCounter';
import { Constants } from '@/constants';
import { DBChat, Chat, ChatMessage, ChatStatus, Role } from '@/types';

/**
 * "API" for chat.
 * - Hook that has the state of the current chat, and lets you
 *   perform "API-like" operations like add/delete/etc.
 */
function useChat() {
  const settings = useUserSettings();
  const [currChat, dispatch] = useReducer(chatReducer, {...defaultChat(settings.systemMessage), id: 0});

  // Ref so the callbacks never need to refresh to just compare with
  const chatIdRef = useRef<number>(currChat.id);
  chatIdRef.current = currChat.id;

  useEffect(() => {
    let isLatestFetch = true;

    async function fetchLatestChat() {
      try {
        const id = await getLatestDBChatId();
        if (isLatestFetch && id) {
          setCurrentChat(id);
        }
      } catch (error) {
        console.error("Couldn't fetch latest Chat!")
        console.error(error);
      }
    }
    fetchLatestChat();

    return () => { isLatestFetch = false };
  }, []);

  const newChat = useCallback(async() => {
    const newChat = defaultChat(settings.systemMessage);
    const res = await addDBChat(newChat);
    if (!res) {
      console.error("newChat() failed!");
      return;
    }
    const addedChat = {
      ...newChat,
      id: res,
    }
    dispatch({ type: 'set-chat', chat: addedChat});
    return addedChat;
  }, [dispatch, settings.systemMessage]);

  const setBlankNewChat = useCallback(() => {
    dispatch({ type: 'set-chat', chat: blankNewChat()});
  }, [dispatch]);

  const setCurrentChat = useCallback(async(chatId: number) => {
    const chat = await getDBChat(chatId);
    if (!chat) {
      console.warn("setCurrentChat() failed getting chat - might be deleted.");
      return false;
    }
    dispatch({ type: 'set-chat', chat: chat });
    return true;
  } ,[dispatch]);

  const deleteChat = useCallback(async(chatId: number) => {
    const deleted = await deleteDBChat(chatId);
    if (!deleted) {
      console.error("Failed to delete in deleteChat()!");
      return;
    }
  } ,[dispatch]);

  const addMessage = useCallback(async(chatId: number, message: ChatMessage) => {
    const chat = await getDBChat(chatId);
    if (!chat) {
      console.error("addMessage() failed getting chat!");
      return;
    }
    if (isDupeMessage(chat.messages, message.id)) {
      console.error("addMessage() adding message with same id?!");
      return;
    }
    chat.messages.push(message);

    const updated = await updateDBChat(chat);
    if (!updated) {
      console.warn("addMessage() failed adding messages - chat might be deleted.");
    }
    if (updated === chatIdRef.current) {
      dispatch({ type: 'set-messages', messages: chat.messages});
    }
  }, [dispatch]);

  const setPartialMessage = useCallback(async(chatId: number, messageId: number, message: string) => {
    const chat = await getDBChat(chatId);
    if (!chat) {
      console.warn("setPartialMessage() failed getting chat - might be deleted.");
      return;
    }
    chat.messages = chat.messages.map((msg) => {
      if (msg.id === messageId) {
        return {...msg, partial: message };
      }
      return msg;
    });

    const updated = await updateDBChat(chat);
    if (!updated) {
      console.warn("setPartialMessage() failed setting messages! - might be deleted.");
    }

    if (updated === chatIdRef.current) {
      dispatch({ type: 'set-messages', messages: chat.messages});
    }
  }, [dispatch]);

  const setStatus = useCallback(async(chatId: number, status: ChatStatus) => {
    const chat = await getDBChat(chatId);
    if (!chat) {
      console.warn("setStatus() failed getting chat - might be deleted.");
      return;
    }
    chat.status = status;

    const updated = await updateDBChat(chat);
    if (!updated) {
      console.warn("setStatus() failed setting status! - might be deleted.");
    }
    if (updated === chatIdRef.current) {
      dispatch({ type: 'set-status', status: status});
    }
  } ,[dispatch]);

  // New Age
  const sendMessage = useCallback(async(chat: Chat, message: string) => {
    const sentChatId = chat.id;
    const lastMessage = chat.messages.at(-1);
    let messageId = lastMessage ? lastMessage.id + 1 : 1;

    const newMessage = {
      id: messageId,
      role: "user" as Role,
      content: message,
    }
    chat.messages.push(newMessage);
    chat.status = "SENDING";

    const updated = await updateDBChat(chat);
    if (!updated) {
      console.warn("sendMessage() failed to update Chat! - might be deleted.");
    }
    if (updated === chatIdRef.current) {
      dispatch({type: 'set-chat', chat: chat});
    }

    sendToOpenAI(sentChatId, messageId, chat.messages);
  }, [dispatch])

  const editMessage = useCallback(async(chatId: number, messageId: number, content: string) => {
    const chat = await getDBChat(chatId);
    if (!chat) {
      console.warn("editMessage() failed getting chat - might be deleted.");
      return;
    }
    const editedMessages = getMessagesAfterEdit(chat.messages, messageId, content);
    const chatTokens = editedMessages.reduce((accum, message) => accum + (message.tokens ?? 0) , 0);
    chat.messages = editedMessages;
    chat.tokens = chatTokens;
    chat.status = "SENDING";

    const updated = await updateDBChat(chat);
    if (!updated) {
      console.warn("editMessage() failed to update Chat! - might be deleted.");
    }
    if (updated === chatIdRef.current) {
      dispatch({type: 'set-chat', chat: chat});
    }
    sendToOpenAI(chat.id, messageId, editedMessages);
  }, [dispatch]);

  const resendMessage = useCallback(async(chatId: number) => {
    const chat = await getDBChat(chatId);
    if (!chat) {
      console.warn("resendMessage() failed getting chat - might be deleted.");
      return;
    }
    const lastUserMessage = chat.messages.findLast((message) => message.role === "user");
    const index = lastUserMessage ? chat.messages.indexOf(lastUserMessage) : chat.messages.length - 1;
    const trimmed = chat.messages.slice(0, index + 1)
    const chatTokens = trimmed.reduce((accum, message) => accum + (message.tokens ?? 0) , 0);
    chat.messages = trimmed;
    chat.tokens = chatTokens;
    chat.status = "SENDING";

    const updated = await updateDBChat(chat);
    if (!updated) {
      console.warn("editMessage() failed to update Chat! - might be deleted.");
    }
    if (updated === chatIdRef.current) {
      dispatch({type: 'set-chat', chat: chat});
    }
    sendToOpenAI(chat.id, lastUserMessage?.id ?? chat.messages.length, trimmed);
  }, [dispatch]);

  const sendToOpenAI = useCallback(async(sentChatId: number, messageId: number, messages: ChatMessage[]) => {
    const resMsgId = messageId + 1;

    const resMsg : ChatMessage = {
      id: resMsgId,
      role: "assistant" as Role,
      content: "",
    }
    await addMessage(sentChatId, resMsg);

    async function readCB(partial: string) {
      await setPartialMessage(sentChatId, resMsgId, partial);
    }

    const res = await sendChatStream(settings.apiKey ?? "", settings.model, messages, readCB);
    if (res.status === "SUCCESS") {
      const gptResponse = res.data;
      if (gptResponse) {
        const sentChat = await getDBChat(sentChatId);
        if (!sentChat) {
          console.error("sendToOpenAI() failed getting chat - might be deleted");
          setStatus(sentChatId, "ERROR");
          return;
        };
        resMsg.content = gptResponse;

        const sent = messages.at(-1);
        const promptTokens = sent ? countTokens(sent) : 0;
        const completionTokens = countTokens(resMsg);

        const lastUserMsg = sentChat.messages.findLast((msg) => msg.role === "user");
        if (lastUserMsg) lastUserMsg.tokens = promptTokens;
        resMsg.tokens = completionTokens;
        resMsg.partial = "";
        sentChat.messages[sentChat.messages.length - 1] = resMsg;
        sentChat.tokens = (sentChat.tokens ?? 0) + promptTokens + completionTokens;
        sentChat.status = "READY";

        if (!await updateDBChat(sentChat)) {
          console.error("sendToOpenAI() failed to update chat - might be deleted");
        }
        dispatch({type: 'set-chat', chat: sentChat});
      } else {
        setStatus(sentChatId, "READY");
      }
    } else if (res.status === "ERROR") {
      const sentChat = await getDBChat(sentChatId);
      if (!sentChat) {
        console.error("sendToOpenAI() failed getting chat - might be deleted");
        setStatus(sentChatId, "ERROR");
        return;
      }

      const last = sentChat.messages.at(-1)
      if (last) last.partial = "";

      const errData = res.data;
      const errMsg = errData.error ? errData.error.message : errData;
      sentChat.latestError = String(errMsg);
      sentChat.status = "ERROR";
      if (!await updateDBChat(sentChat)) {
        console.error("sendToOpenAI() failed to update chat on error - might be deleted");
      }
      dispatch({type: 'set-chat', chat: sentChat});
    }
  }, [dispatch])

  return {
    chat: currChat,
    dispatch: dispatch,

    // Specific actions on chat.
    newChat: newChat,
    setBlankNewChat: setBlankNewChat,
    setCurrentChat: setCurrentChat,
    deleteChat: deleteChat,
    addMessage: addMessage,
    setPartialMessage: setPartialMessage,

    // Callbacks made to use for UI Events.
    sendMessage: sendMessage,
    editMessage: editMessage,
    resendMessage: resendMessage,
  }
}

type ChatDispatchAction =
  | { type: "set-chat", chat: Chat}
  | { type: "set-messages", messages: ChatMessage[]}
  | { type: "set-status", status: ChatStatus}
  | { type: "set-tokens", tokens: number}
  | { type: "set-error", error: string}

function chatReducer (state: Chat, action: ChatDispatchAction) {
  switch (action.type) {
    case 'set-chat': {
      return action.chat;
    }
    case 'set-messages': {
      return {
        ...state,
        messages: action.messages,
      }
    }
    case 'set-status': {
      return {
        ...state,
        status: action.status,
      }
    }
    case 'set-tokens': {
      return {
        ...state,
        tokens: action.tokens,
      }
    }
    case 'set-error': {
      return {
        ...state,
        latestError: action.error,
      }
    }
  }
}


/*********************************************
 * Helper
 ********************************************/

function defaultChat(sysMsg?: string) : DBChat {
  // Empty string should give null here!
  const firstMsg = sysMsg ? initialSystemMessage(sysMsg) : null;
  const messages = [];
  if (firstMsg) {
    firstMsg.tokens = countTokens(firstMsg);
    messages.push(firstMsg);
  }

  return {
    messages: messages,
    status: "READY" as ChatStatus,
    createdAt: Date.now(),
    tokens: firstMsg?.tokens ?? 0,
  }
}

function initialSystemMessage(sysMsg: string) : ChatMessage {
  return {
     id: 1,
     role: "system",
     content: sysMsg ?? Constants.DEFAULT_SYS_MSG,
  }
}

function isDupeMessage(messages: ChatMessage[], messageId: number) {
  return messages.findLast((msg) => msg.id === messageId) !== undefined;
}


// This is a localOnly chat that is used if you hit the "New Chat" button.
function blankNewChat() : Chat {
  return {
    id: Constants.BLANK_CHAT_ID,
    status: "READY" as ChatStatus,
    createdAt: Date.now(),
    messages: [],
  }
}

function getMessagesAfterEdit(messages: ChatMessage[], messageId: number, content: string | undefined) {
  // Delete all after the target message (same as ChatGPT)
  const targetMessage = messages.findLast((message) => message.id === messageId);
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

export {
  useChat,
}