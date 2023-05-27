import getDB from '@/idb/idb'
import { Constants } from '@/constants';
import { Chat, ChatCollection } from '@/types';

/*********************************************
 * Chat Collection
 * - Header information for all chats to use in sidebar.
 ********************************************/

const DB = await getDB();
const CHATS_STORE = Constants.DB_CHATS_STORE;


// Gets all the chats and puts them to a collection.
// Minimize calling this if possible and only append/remove once fetched.
async function getChatCollection() {
  const coll : ChatCollection = [];

  const tx = DB.transaction(CHATS_STORE);
  const res = await tx.store.getAll();
  if (!res) return coll;

  for (const chat of res as Chat[]) {
    const header = {
      id: chat.id,
      createdAt: chat.createdAt,
      title: chat.title ?? "",
      preview: chat.preview ?? "",
    }
    coll.push(header);
  }

  return coll;
}


export {
  getChatCollection,
}