import { ChatCollection, isChatCollection, Chat, isChat } from '@/types';
import { Constants } from '@/constants';

/*********************************************
 * Proxy for local storage for type-checking and safe get/set.
 ********************************************/

class LSProxy {
  // Generic - not type checking at runtime.
  static setItem<T>(key: string, value: T | null) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  static getItem<T>(key: string): T | null {
    const data: string | null = localStorage.getItem(key);
    return data !== null ? JSON.parse(data).value : null;
  }

  // Custom - getters do typecheck at runtime.
  static getChatCollection() : ChatCollection | null {
    const coll: ChatCollection | null = this.getItem<ChatCollection>(Constants.LS_CH_KEY);
    if (!coll) return null;
    if (isChatCollection(coll)) return coll;

    return null;
  }

  static getChat(id: number) : Chat | null {
    const chat : Chat | null = this.getItem<Chat>(this.chatPrefixKey(id));
    if (!chat) return null;
    if (isChat(chat)) return chat;

    return null;
  }

  static setChat(chat: Chat) {
    this.setItem<Chat>(this.chatPrefixKey(chat.id), chat);
  }

  static chatPrefixKey(id: number) {
    return Constants.LS_CH_PREFIX_KEY + id.toString();
  }
}


export {
  LSProxy
}