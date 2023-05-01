/**
 * Chat Typings
 * - ChatCollection has HeaderInfo of all Chats (but no messages).
 * - A Chat object has all the chat messages.
 * - This is done to prevent holding ALL chat messages in memory at all times.
 *   Chat messages are saved to LocalStorage and fetched + parsed when set to current.
 */
export type Role = 'user' | 'system' | 'assistant';

export type ChatCollection = ChatHeader[];

export interface ChatHeader {
  id: number;
  title: string;
  preview: string;  // Preview of first message.
}

export interface Chat {
  new: boolean;
  id: number;
  title: string;
  messages: ChatMessage[];
}

export interface ChatMessage {
  role: Role;
  content: string;
}

export interface UserSettings {
  model: string,
}

export function isChatCollection(coll: ChatCollection) : coll is ChatCollection {
  if (!coll) return false;
  if (!Array.isArray(coll)) return false;
  for (const header of coll) {
    if (!isChatHeader(header)) return false;
  }

  return true;
}

export function isChatHeader(header: ChatHeader): header is ChatHeader {
  if (!header) return false;
  if (header.id === undefined || typeof header.id !== 'number') return false;
  if (header.title === undefined || typeof header.title !== 'string') return false;
  if (header.preview === undefined || typeof header.id !== 'string') return false;

  return true;
}

export function isChat(chat: Chat): chat is Chat {
  if (!chat) return false;
  if (chat.id === undefined || typeof chat.id !== 'number') return false;
  if (chat.title === undefined || typeof chat.title !== 'string') return false;
  if (chat.messages === undefined) return false;
  for (const msg of chat.messages) {
    if (!isChatMessage(msg)) return false;
  }

  return true;
}

export function isChatMessage(chatMsg: ChatMessage): chatMsg is ChatMessage {
  if (!chatMsg) return false;
  if (chatMsg.role === undefined || typeof chatMsg.role !== 'string') return false;
  if (chatMsg.content === undefined || typeof chatMsg.content !== 'string') return false;

  return true;
}


/**
 * API
 */
export type APIStatus =  "SUCCESS" | "ERROR"


export {

}