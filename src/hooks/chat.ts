import { useReducer, useCallback } from 'react';
import { LSProxy } from '@/lsProxy';
import { Chat, ChatMessage, ChatHeader, ChatStatus } from '@/types';

/*********************************************
 * Reducer for singular Chat
 ********************************************/

export type ChatDispatchAction =
  | {type: "new-chat", id: number}
  | {type: "add-message", chatId: number, message: ChatMessage, createdAt: number}
  | {type: "edit-message", messageId: number, content: string}
  | {type: "set-chat", id: number}
  | {type: "set-status", chatId: number, status: ChatStatus, setAt: number}
  | {type: "set-old"}
  | {type: "delete-chat", chatId: number}

const chatReducer = (state: Chat, action: ChatDispatchAction) => {
  switch (action.type) {
    case 'new-chat': {
      return defaultChat(action.id);
    }

    case 'add-message': {
      let chat = state;
      if (chat.createdAt > action.createdAt) return state;

      const isCurrent = (state.id === action.chatId);
      if (!isCurrent) {
        const savedChat = loadChatFromLocalStorage(action.chatId);
        if (!savedChat) {
          console.warn("Unable to add message to chat - error or chat may have been deleted");
          return state;
        } else {
          chat = savedChat;
        }
      }

      if (isDupeMessage(chat.messages, action.message.id)) {
        return state;
      }

      const newMessages = [...chat.messages, action.message]
      const newState = {...chat, messages: newMessages}

      saveChatToLocalStorage(newState);
      return newState;
      // return isCurrent ? newState : state;
    }

    case 'edit-message': {
      // delete all after the target message (same as ChatGPT - content useless after)
      const targetMessage = state.messages.findLast((message) => message.id === action.messageId);
      if (!targetMessage) {
        console.error("Couldn't find target message during edit message!");
        return state;
      }

      const newMessage = {
        id: action.messageId,
        role: targetMessage.role,
        content: action.content,
      }

      const newMessages = state.messages.filter((message) => message.id < action.messageId);
      newMessages.push(newMessage);

      const newState = {...state, messages: newMessages}

      saveChatToLocalStorage(newState);
      return newState;
    }

    case 'set-status': {
      let chat = state;
      if (chat.createdAt > action.setAt) return state;

      const isCurrent = (state.id === action.chatId);
      if (!isCurrent) {
        const savedChat = loadChatFromLocalStorage(action.chatId);
        if (!savedChat) {
          console.warn("Unable to add message to chat - error or chat may have been deleted");
          return state;
        } else {
          chat = savedChat;
        }
      }

      const newState = {...chat, status: action.status}
      saveChatToLocalStorage(newState);

      return isCurrent ? newState : state;
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
  }
}

function useChat(id : number | null) {
  const [chat, dispatch] = useReducer(chatReducer, initialChat(id));

  const newChat = useCallback((id: number) => {
    dispatch({ type: 'new-chat', id:id});
  }, [dispatch]);

  const addMessage = useCallback((chatId: number, message: ChatMessage) => {
    dispatch({ type: 'add-message', chatId: chatId, message: message, createdAt: Date.now()});
  }, [dispatch]);

  const editMessage = useCallback((messageId: number, content: string) => {
    dispatch({ type: 'edit-message', messageId: messageId, content: content});
  }, [dispatch]);

  const setCurrentChat = useCallback((id: number) => {
    dispatch({ type: 'set-chat', id: id});
  } ,[dispatch]);

  const deleteChat = useCallback((id: number) => {
    dispatch({ type: 'delete-chat', chatId: id});
  } ,[dispatch]);

  const setStatus = useCallback((chatId: number, status: ChatStatus) => {
    dispatch({ type: 'set-status', chatId: chatId, status: status, setAt: Date.now()});
  } ,[dispatch]);

  const setOld = useCallback(() => {
    dispatch({ type: 'set-old'});
  } ,[dispatch]);

  const getDefaultHeader : (message: string) => ChatHeader = useCallback((message) => {
    return {
      id: chat.id,
      title: message?.length <= 20 ? message : message.substring(0, 20),
      preview: message?.length <= 25 ? message : message.substring(0, 25),
    }
  } ,[chat]);

  return {
    chat: chat,
    dispatch: dispatch,
    newChat: newChat,
    addMessage: addMessage,
    editMessage: editMessage,
    setStatus: setStatus,
    setOld: setOld,
    setCurrentChat: setCurrentChat,
    deleteChat: deleteChat,
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
 * "Async" functions
 * - Chat switching possible when sending.
 * - These methods affect the saved chat state rather than the one in memory.
 * - Refresh is called to refresh state if needed.
 ********************************************/

type RefreshCB = (id: number) => void;

function setSendingAsync(chatId: number, sending: boolean, refreshCB: RefreshCB) {
  const chat = loadChatFromLocalStorage(chatId);
  if (!chat) {
    console.warn("Unable to add message to chat (async response) - error or chat may have been deleted");
    return;
  }

  // chat.sending = sending;
  saveChatToLocalStorage(chat);

  refreshCB(chatId);
}

/*********************************************
 * Scenarios:
 * - Close tab before callback?
 *   = "Sending" state on load (prevents sending)
 * - Debounce send
 *
 * === Generic error handling
 ********************************************/


/*********************************************
 * Local Storage/Init
 ********************************************/

// Keep track of loadedChatIds ("first-loads") per session, so we know if
// anything was left in "SENDING" when we last closed the app.
// -  Set them to error accordingly.
const loadedChats = new Set<number>();

function initialChat(id: number | null) : Chat {
  if (id) {
    const savedChat = loadChatFromLocalStorage(id);
    if (savedChat) return savedChat;
  }

  return defaultChat(1);
}

function defaultChat(id: number) : Chat {
  return {
    id: id,
    messages: [],
    status: "READY" as ChatStatus,
    createdAt: Date.now(),
    new: true,
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