import { useReducer } from 'react';
import { LSProxy } from '@/lsProxy';
import { Chat, ChatMessage, ChatHeader } from '@/types';

/*********************************************
 * Reducer for singular Chat
 ********************************************/

type ChatDispatchAction =
  | {type: "add-message", message: ChatMessage}
  | {type: "edit-message", index: number, content: string}
  | {type: "set-new", isNew: boolean}

const chatReducer = (state: Chat, action: ChatDispatchAction) => {
  switch (action.type) {
    case 'add-message': {
      const newMessages = [...state.messages, action.message]
      const newState = {...state, messages: newMessages}

      saveChatToLocalStorage(newState);
      return newState;
    }

    case 'edit-message': {
      // Remove all after the target message (same as ChatGPT - content useless after)
      const targetMessage = state.messages?.[action.index];
      if (!targetMessage) {
        console.error("Couldn't find target message during edit message!");
        return state;
      }

      const newMessage = {
        role: targetMessage.role,
        content: action.content,
      }
      const newMessages = [...state.messages];
      newMessages[action.index] = newMessage;

      const newState = {...state, messages: newMessages}

      saveChatToLocalStorage(newState);
      return newState;
    }

    case 'set-new': {
      return {...state, new:action.isNew}
    }
  }
}

function useChat(id : number | null) {
  const [chat, dispatch] = useReducer(chatReducer, initialChat(id));

  const addMessage = (message: ChatMessage) => {
    dispatch({ type: 'add-message', message: message});
  };

  const editMessage = (index: number, content: string) => {
    dispatch({ type: 'edit-message', index: index, content: content});
  }

  const setNew = (isNew: boolean) => {
    dispatch({ type: 'set-new', isNew: isNew})
  }

  const getDefaultHeader : (message: string) => ChatHeader = (message) => {
    return {
      id: chat.id,
      title: message?.length <= 20 ? message : message.substring(0, 20),
      preview: message?.length <= 25 ? message : message.substring(0, 25),
    }
  }

  return {
    chat: chat,
    dispatch: dispatch,
    addMessage: addMessage,
    editMessage: editMessage,
    setNew: setNew,
    getDefaultHeader: getDefaultHeader,
  }
}


/*********************************************
 * Local Storage
 ********************************************/

function initialChat(id: number | null) : Chat {
  if (id) {
    const savedChat = LSProxy.getChat(id);
    if (savedChat) return savedChat;
  }

  return {
    new: true,
    id: 1,
    title: "New Chat",
    messages: [],
  };
}

function saveChatToLocalStorage(chat: Chat) {
  LSProxy.setChat(chat);
}


export {
  useChat
}