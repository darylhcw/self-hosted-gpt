import { useCallback, useReducer } from 'react';
import { LSProxy } from '@/lsProxy';
import { ChatCollection, ChatHeader } from '@/types';


/*********************************************
 * Chat Collection Reducer - State for all Chats.
 * Small note about localStorage handling:
 * - This is stored in LocalStorage using LS_CH_KEY
 * - Chats are stored individually using LS_CH_PREFIX_KEY + ID.
 ********************************************/

export type ChatCollDispatchAction =
  | {type: "add-chat", header?: ChatHeader}
  | {type: "set-chat-title", id: number, title: string}
  | {type: "set-chat-preview", id: number, preview: string}
  | {type: "delete-chat", id: number}

const initialState = initialChatCollection();

const chatCollReducer = (state: ChatCollection, action: ChatCollDispatchAction) => {
  switch (action.type) {
    case 'add-chat': {
      let newHeader = action.header;
      if (!newHeader) {
        const lastChat = state.at(-1);
        const nextId = lastChat ? lastChat.id + 1 : 1;
        // No header, add "New Chat" to latest position.
        newHeader = {
          id: nextId,
          title: "New Chat",
          preview: "",
        }
      }

      const newState = [...state, newHeader];
      saveChatCollToLocalStorage(newState);

      return newState
    };

    case 'set-chat-title': {
      const newState = state.map((chat) => {
        if (chat.id === action.id) {
          const newChat = {...chat};
          newChat.title = action.title;
          return newChat;
        }
        return chat;
      })
      saveChatCollToLocalStorage(newState);
      return newState;
    };

    case 'set-chat-preview': {
      const newState = state.map((chat) => {
        if (chat.id === action.id) chat.preview = action.preview;
        return chat;
      })
      saveChatCollToLocalStorage(newState);
      return newState;
    };

    case 'delete-chat': {
      const newState = state.filter((chat) => chat.id !== action.id);
      saveChatCollToLocalStorage(newState);
      return newState;
    };
  }
};

function useChatCollection() {
  const [chatCollection, dispatch] = useReducer(chatCollReducer, initialState);

  const addChat = useCallback((header?: ChatHeader) => {
    dispatch({ type: 'add-chat', header: header });
  }, [dispatch]);

  const setChatTitle = useCallback((chatId: number, title: string) => {
    dispatch({ type: 'set-chat-title', id: chatId, title: title });
  }, [dispatch]);

  const setChatPreview = useCallback((chatId: number, preview: string) => {
    dispatch({ type: 'set-chat-preview', id: chatId, preview: preview });
  }, [dispatch]);

  const deleteChat = useCallback((chatId: number) => {
    dispatch({ type: 'delete-chat', id: chatId });
  }, [dispatch]);

  return {
    collection: chatCollection,
    dispatch: dispatch,
    addChat: addChat,
    setChatTitle: setChatTitle,
    setChatPreview: setChatPreview,
    deleteChat: deleteChat,
  }
}


/*********************************************
 * Local Storage
 ********************************************/

function initialChatCollection() : ChatCollection {
  const savedChats = LSProxy.getChatCollection();
  return savedChats ?? [];
}

function saveChatCollToLocalStorage(coll: ChatCollection) {
  LSProxy.setChatCollection(coll);
}


export {
  useChatCollection
}