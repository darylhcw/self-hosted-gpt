import { useReducer, useCallback } from 'react';
import { useUserSettings } from './useUserSettings';
import { LSProxy } from '@/lsProxy';
import { countTokens } from '@/tokenCounter';
import { Constants } from '@/constants';
import { Chat, ChatMessage, ChatHeader, ChatStatus } from '@/types';

/*********************************************
 * Reducer for singular Chat
 * - For dispatch actions, the idea is that :
 *   = Immediate actions that don't need a response from GPT/API can set directly
 *   = Delayed actions that need a response from GPT/API needs to check timestamps
 *     in case user has deleted the chat!
 ********************************************/

export type ChatDispatchAction =
  | {type: "new-chat", id: number, sysMsg: string}
  | {type: "add-message", chatId: number, message: ChatMessage, createdAt: number}
  | {type: "edit-messages", messages: ChatMessage[]}
  | {type: "edit-message", chatId: number, messageId: number, message: string, setAt: number}
  | {type: "set-partial-message", chatId: number, messageId: number, message: string, setAt: number}
  | {type: "set-chat", id: number}
  | {type: "set-status", chatId: number, status: ChatStatus, setAt: number}
  | {type: "set-old"}
  | {type: "delete-chat", chatId: number}
  | {type: "set-error-message", chatId: number, message: string, setAt: number}
  | {type: "set-chat-tokens", chatId: number, tokens: number, setAt: number}
  | {type: "set-message-tokens", chatId: number, messageId: number, tokens: number, setAt: number}
  | {type: "refresh-chat-tokens", chatId: number}

const chatReducer = (state: Chat, action: ChatDispatchAction) => {
  switch (action.type) {
    case 'new-chat': {
      return defaultChat(action.id, action.sysMsg);
    }

    case 'add-message': {
      if (state.createdAt > action.createdAt) return state;

      const chat = getSavedChatForAction(action.chatId);
      if (!chat) return state;

      if (isDupeMessage(chat.messages, action.message.id)) {
        return state;
      }

      const newMessages = [...chat.messages, action.message]
      const newState = {...chat, messages: newMessages}

      saveChatToLocalStorage(newState);
      return state.id ===  action.chatId ? newState : state;
    }

    case 'edit-messages': {
      const newState = {...state, messages: action.messages}
      saveChatToLocalStorage(newState);
      return newState;
    }

    case 'edit-message': {
      if (state.createdAt > action.setAt) return state;

      const chat = getSavedChatForAction(action.chatId);
      if (!chat) return state;

      const newMessages = chat.messages.map((message) => {
        if (message.id === action.messageId) {
          return {...message, content: action.message};
        }
        return message;
      })

      const newChat = {...chat, messages: newMessages}
      return state.id ===  action.chatId ? newChat : state;
    }

    case 'set-status': {
      if (state.createdAt > action.setAt) return state;

      const chat = getSavedChatForAction(action.chatId);
      if (!chat) return state;

      const newState = {...chat, status: action.status}

      saveChatToLocalStorage(newState);
      return state.id ===  action.chatId ? newState : state;
    }

    case 'set-old': {
      return {...state, new:false}
    }

    case 'set-chat': {
      const savedChat = loadChatFromLocalStorage(action.id);
      if (savedChat) {
        return savedChat;
      } else {
        console.error(`Unable to load chat with id: ${action.id}!`);
        return state;
      }
    }

    case 'delete-chat': {
      deleteChatFromLocalStorage(action.chatId);
      if (state.id === action.chatId) {
        return deletedChat(action.chatId)
      } else {
        return state;
      }
    }

    case 'set-error-message': {
      if (state.createdAt > action.setAt) return state;

      const chat = getSavedChatForAction(action.chatId);
      if (!chat) return state;

      const newChat = {...chat, latestError: action.message}
      return state.id ===  action.chatId ? newChat : state;
    }

    case 'set-partial-message': {
      if (state.createdAt > action.setAt) return state;

      const chat = getSavedChatForAction(action.chatId);
      if (!chat) return state;

      const newMessages = chat.messages.map((message) => {
        if (message.id === action.messageId) {
          if (action.message) {
            return {...message, partial: action.message};
          } else {
            const res = {...message};
            delete res.partial;
            return res;
          }
        }
        return message;
      })

      const newChat = {...chat, messages: newMessages}
      return state.id ===  action.chatId ? newChat : state;
    }

    case 'set-chat-tokens': {
      if (state.createdAt > action.setAt) return state;

      const chat = getSavedChatForAction(action.chatId);
      if (!chat) return state;

      const newChat = {...chat, tokens: action.tokens}
      return state.id === action.chatId ? newChat: state;
    }

    case 'set-message-tokens': {
      if (state.createdAt > action.setAt) return state;

      const chat = getSavedChatForAction(action.chatId);
      if (!chat) return state;

      const newMessages = chat.messages.map((message) => {
        if (message.id === action.messageId) {
          return {...message, tokens:action.tokens};
        } else {
          return message;
        }
      })

      const newChat = {...chat, messages: newMessages}
      return state.id === action.chatId ? newChat: state;
    }

    case 'refresh-chat-tokens': {
      const chat = getSavedChatForAction(action.chatId);
      if (!chat) return state;

      const newTokens = chat.messages.reduce((accum, message) => accum + (message.tokens ?? 0) , 0);
      const newChat = {...chat, tokens: newTokens}

      return state.id === action.chatId ? newChat : chat;
    }

    default: return state;
  }

  function getSavedChatForAction(chatId: number) {
    const isCurrent = (state.id === chatId);
    if (!isCurrent) {
      const savedChat = loadChatFromLocalStorage(chatId);
      if (!savedChat) {
        console.warn(`Unable to get saved Chat for action ${action.type} - ignore this if chat was deleted!.`);
        return null;
      } else {
        return savedChat;
      }
    } else {
      return state;
    }
  }
}

function useChat(id : number | null) {
  const settings = useUserSettings();
  const [chat, dispatch] = useReducer(chatReducer, initialChat(id, settings.systemMessage));

  const newChat = useCallback((id: number) => {
    dispatch({ type: 'new-chat', id:id, sysMsg: settings.systemMessage});
  }, [dispatch, settings.systemMessage]);

  const addMessage = useCallback((chatId: number, message: ChatMessage) => {
    dispatch({ type: 'add-message', chatId: chatId, message: message, createdAt: Date.now() });
  }, [dispatch]);

  const editMessages = useCallback((messages: ChatMessage[]) => {
    dispatch({ type: 'edit-messages', messages: messages }) ;
  }, [dispatch]);

  const editMessage = useCallback((chatId: number, messageId: number, message: string) => {
    dispatch({ type: 'edit-message', chatId: chatId, messageId: messageId, message: message, setAt: Date.now()}) ;
  }, [dispatch]);

  const setPartialMessage = useCallback((chatId: number, messageId: number, message: string) => {
    dispatch( {type: 'set-partial-message', chatId: chatId, messageId: messageId, message: message, setAt: Date.now() });
  }, [dispatch]);

  const setCurrentChat = useCallback((id: number) => {
    dispatch({ type: 'set-chat', id: id });
  } ,[dispatch]);

  const deleteChat = useCallback((id: number) => {
    dispatch({ type: 'delete-chat', chatId: id });
  } ,[dispatch]);

  const setStatus = useCallback((chatId: number, status: ChatStatus) => {
    dispatch({ type: 'set-status', chatId: chatId, status: status, setAt: Date.now() });
  } ,[dispatch]);

  const setOld = useCallback(() => {
    dispatch({ type: 'set-old' });
  } ,[dispatch]);

  const setChatTokens = useCallback((chatId: number, tokens: number) => {
    dispatch({ type: "set-chat-tokens", chatId: chatId, tokens: tokens, setAt: Date.now() });
  }, [dispatch]);

  const setMessageTokens = useCallback((chatId: number, messageId: number, tokens: number) => {
    dispatch({ type: "set-message-tokens", chatId: chatId, messageId: messageId, tokens: tokens, setAt: Date.now() });
  }, [dispatch]);

  const refreshChatTokens = useCallback((chatId: number) => {
    dispatch({ type: "refresh-chat-tokens", chatId: chatId});
  }, [dispatch]);

  const getDefaultHeader : (message: string) => ChatHeader = useCallback((message) => {
    return {
      id: chat.id,
      title: message?.length <= 20 ? message : message.substring(0, 20),
      preview: message?.length <= 25 ? message : message.substring(0, 25),
      createdAt: Date.now(),
    }
  } ,[chat]);

  const setErrorMessage = useCallback((chatId: number, message: string) => {
    dispatch({ type: "set-error-message", chatId: chatId, message:message, setAt:Date.now() });
  }, [dispatch]);

  return {
    chat: chat,
    dispatch: dispatch,
    newChat: newChat,
    addMessage: addMessage,
    editMessages: editMessages,
    editMessage: editMessage,
    setPartialMessage: setPartialMessage,
    setStatus: setStatus,
    setOld: setOld,
    setCurrentChat: setCurrentChat,
    deleteChat: deleteChat,
    setErrorMessage: setErrorMessage,
    setChatTokens: setChatTokens,
    setMessageTokens: setMessageTokens,
    refreshChatTokens: refreshChatTokens,
    getDefaultHeader: getDefaultHeader,
  }
}

function isDupeMessage(messages: ChatMessage[], messageId: number) {
  const lastMessage = messages.at(-1);
  if (!lastMessage) {
    return false;
  } else {
    return lastMessage.id >= messageId;
  }
}


/*********************************************
 * Local Storage/Init
 ********************************************/

// Keep track of loadedChatIds ("first-loads") per session, so we know if
// anything was left in "SENDING" when we last closed the app.
// -  Set them to error accordingly.
const loadedChats = new Set<number>();

function initialChat(id: number | null, sysMsg?: string) : Chat {
  if (id) {
    const savedChat = loadChatFromLocalStorage(id);
    if (savedChat) return savedChat;
  }

  return defaultChat(1, sysMsg);
}

function defaultChat(id: number, sysMsg?: string) : Chat {
  // Empty string should give null here!
  const firstMsg = sysMsg ? initialSystemMessage(sysMsg) : null;
  const messages = [];
  if (firstMsg) {
    firstMsg.tokens = countTokens(firstMsg);
    messages.push(firstMsg);
  }

  return {
    id: id,
    messages: messages,
    status: "READY" as ChatStatus,
    createdAt: Date.now(),
    new: true,
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

function deletedChat(id: number) : Chat {
  return {
    id: id,
    messages: [
      {
        id: 1,
        role: "assistant",
        content: "deleting",
      }
    ],
    status: "DELETING" as ChatStatus,
    createdAt: Date.now(),
    new: false,
  }
}

function saveChatToLocalStorage(chat: Chat) {
  LSProxy.setChat(chat);
}

function loadChatFromLocalStorage(chatId: number) {
  const chat = LSProxy.getChat(chatId);
  if (chat) {
    if (!loadedChats.has(chatId)) {
      if (chat.status === "SENDING") {
        chat.status = "ERROR";
        saveChatToLocalStorage(chat);
      }
      loadedChats.add(chatId);
    }
  }

  return chat;
}

function deleteChatFromLocalStorage(chatId: number) {
  LSProxy.removeChat(chatId);
}

export {
  useChat,
  loadedChats,
}