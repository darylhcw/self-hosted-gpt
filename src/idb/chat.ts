import getDB from './idb';
import { Constants } from '@/constants';
import { DBChat, Chat } from '@/types';

const CHATS_STORE = Constants.DB_CHATS_STORE;


/*********************************************
 * Lower lvl DB - Data Access Layer
 ********************************************/

async function addChat(chat: DBChat) : Promise<number| undefined> {
  const DB = await getDB();
  const tx = DB.transaction(CHATS_STORE, "readwrite");
  const res = await tx.store.add(chat);

  return res;
}

async function getChat(id: number) : Promise<Chat | undefined>{
  const DB = await getDB();
  const tx = DB.transaction(CHATS_STORE);
  const res = await tx.store.get(id);

  return res as Chat;
}

async function updateChat(chat: Chat) {
  const DB = await getDB();
  const tx = DB.transaction(CHATS_STORE, "readwrite");
  const res = await tx.store.put(chat);

  return res;
}

async function deleteChat(id: number) {
  const DB = await getDB();
  const tx = DB.transaction(CHATS_STORE, "readwrite");
  await tx.store.delete(id);

  return true;
}

/*********************************************
 * Repository Interface - for export use
 ********************************************/

/**
 * FIXME: Find a more suitable place for this.
 *
 * Keep track of loadedChatIds ("first-loads") per session, so we know if
 * anything was left in "SENDING" when we last closed the app.
 * - Set them to error accordingly.
 * - State happens on crash/close early -> we fix it here.
 */
const loadedChats = new Set<number>();

async function addDBChat(chat: DBChat) {
  let id;

  try {
    id = await addChat(chat);
  } catch (error) {
    console.error(`Couldn't add chat to db`);
    console.error(error);
  }

  return id;
}

async function getDBChat(chatId: number) {
  let chat;

  try {
    chat = await getChat(chatId);
    if (chat) {
      if (!loadedChats.has(chatId)) {
        if (chat.status === "SENDING") {
          chat.status = "ERROR";
          updateDBChat(chat);
        }
      }
    } else {
      console.error(`Couldn't get chat with id ${chatId} from db - undefined!`);
    }
  } catch (error) {
    console.error(`Couldn't get chat with id ${chatId} from db`);
    console.error(error);
  }

  return chat;
}

async function getLatestDBChatId() {
  const DB = await getDB();
  const tx = DB.transaction(CHATS_STORE);
  const index = tx.store.index("createdAt");
  const cursor = await index.openCursor(null, "prev");

  return (cursor?.value as Chat)?.id;
}

async function updateDBChat(chat: Chat) {
  let res;
  try {
    res = await updateChat(chat);
  } catch (error) {
    console.error(`Couldn't update chat with id ${chat.id} in db`);
    console.error(error);
  }

  return res;
}

async function deleteDBChat(chatId: number) {
  let res;
  try {
    res = await deleteChat(chatId);
  } catch (error) {
    console.error(`Couldn't delete chat with id ${chatId} in db`);
    console.error(error);
  }

  return res;
}


export {
  addDBChat,
  getDBChat,
  getLatestDBChatId,
  updateDBChat,
  deleteDBChat,
}