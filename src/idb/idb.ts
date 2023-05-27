import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { Constants } from '@/constants';

import { DBChat } from '@/types';

/*********************************************
 * IDB initialization/instance/upgrading
 ********************************************/

let DB : IDBPDatabase<ChatsDB>;

interface ChatsDB extends DBSchema {
  chats: {
    key: number;
    value: DBChat;
    indexes: { 'title': string, 'createdAt': number };

  }
}

async function initDB() {
  const db = await openDB<ChatsDB>(Constants.DB_NAME, Constants.DB_VERSION, {
    upgrade(db, _oldVersion, _newVersion, _transaction, _event) {
      if (!db.objectStoreNames.contains(Constants.DB_CHATS_STORE)) {
        const store = db.createObjectStore(Constants.DB_CHATS_STORE, { keyPath: "id", autoIncrement: true });
        store.createIndex("title", "title", { unique: false } );
        store.createIndex("createdAt", "createdAt", { unique: false } );
      }
    },
    terminated() {
      console.error("Browser closed connection while initializing IndexedDB");
    },
  })

  DB = db;
};


export default async() => {
  if (!DB) await initDB();
  return DB;
}