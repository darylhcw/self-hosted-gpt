import { useEffect, useCallback, useReducer } from 'react';
import { getDBChat, updateDBChat } from '@/idb/chat'
import { getChatCollection } from '@/idb/chatCollection';
import { ChatCollection, Chat, ChatHeader} from '@/types';

/**
 * "API" for chatCollection.
 * - Hook that has the state of the ChatCollection (header info of all chats).
 *   and lets you perform "API-like" operations like add/delete/etc.
 */
function useChatCollection() {
  const initColl : ChatCollection = [];
  const [chatCollection, dispatch] = useReducer(chatCollReducer, initColl);

  useEffect(() => {
    let isLatestFetch = true;

    async function fetchChatCollection() {
      try {
        const coll = await getChatCollection();
        if (isLatestFetch && coll) {
          setChatCollection(coll);
        }
      } catch (error) {
        console.error("Couldn't fetch ChatCollection!")
        console.error(error);
      }
    }
    fetchChatCollection();

    return () => { isLatestFetch = false };
  }, []);

  const setChatCollection = useCallback((coll: ChatCollection) => {
    dispatch({ type:'set-collection', coll:coll });
  }, [dispatch]);

  // Aside from adding to collection, generates the first title/preview.
  const addNewChat = useCallback(async(chat: Chat, firstMsg: string) => {
    const header: ChatHeader = {
      id: chat.id,
      title: firstMsg?.length <= 20 ? firstMsg : firstMsg.substring(0, 20),
      preview: firstMsg?.length <= 25 ? firstMsg : firstMsg.substring(0, 25),
      createdAt: chat.createdAt,
    }

    const savedChat = await getDBChat(chat.id);
    if (!savedChat) {
      console.warn("addNewChat() for coll failed getting chat - might be deleted.");
      return;
    }
    savedChat.title = header.title;
    savedChat.preview = header.preview;

    if (!await updateDBChat(savedChat)) {
      console.warn("addNewChat() for coll failed setting title/preview! - might be deleted.");
    }
    dispatch({ type: 'add-chat', header: header });
  }, [dispatch]);

  const setChatTitle = useCallback(async(chatId: number, title: string) => {
    const chat = await getDBChat(chatId);
    if (!chat) {
      console.warn("setChatTitle() failed getting chat - might be deleted.");
      return;
    }
    chat.title = title;

    const updated = await updateDBChat(chat);
    if (!updated) {
      console.warn("setChatTitle() failed setting title! - might be deleted.");
    }
    dispatch({ type: 'set-chat-title', id: chatId, title: title });
  }, [dispatch]);

  const setChatPreview = useCallback(async(chatId: number, preview: string) => {
    const chat = await getDBChat(chatId);
    if (!chat) {
      console.warn("setChatPreview() failed getting chat - might be deleted.");
      return;
    }
    chat.preview = preview;

    const updated = await updateDBChat(chat);
    if (!updated) {
      console.warn("setChatPreview() failed setting preview! - might be deleted.");
    }
    dispatch({ type: 'set-chat-preview', id: chatId, preview: preview });
  }, [dispatch]);

  const deleteChat = useCallback((chatId: number) => {
    dispatch({ type: 'delete-chat', id: chatId });
  }, [dispatch]);

  return {
    collection: chatCollection,
    dispatch: dispatch,
    setChatCollection: setChatCollection,
    addNewChat: addNewChat,
    setChatTitle: setChatTitle,
    setChatPreview: setChatPreview,
    deleteChat: deleteChat,
  }
}


export type ChatCollDispatchAction =
  | {type: "set-collection", coll: ChatCollection}
  | {type: "add-chat", header: ChatHeader}
  | {type: "set-chat-title", id: number, title: string}
  | {type: "set-chat-preview", id: number, preview: string}
  | {type: "delete-chat", id: number}

function chatCollReducer(state: ChatCollection, action: ChatCollDispatchAction) {
  switch (action.type) {
    case 'set-collection': {
      return action.coll;
    }
    case 'add-chat': {
      const existing = state.find((chat) => chat.id === action.header.id);
      if (existing) {
        console.warn("ChatCollection - adding chat failed, found header with same ID!");
        return state;
      }
      return [...state, action.header];
    }
    case 'set-chat-title': {
      return state.map((chat) => {
        if (chat.id === action.id) {
          return {...chat, title: action.title };
        }
        return chat;
      })
    };
    case 'set-chat-preview': {
      return state.map((chat) => {
        if (chat.id === action.id) {
          return {...chat, preview:action.preview }
        }
        return chat;
      })
    };
    case 'delete-chat': {
      return state.filter((chat) => chat.id !== action.id);
    };
  }
};


export {
  useChatCollection
}