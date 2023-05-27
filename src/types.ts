/**
 * Chat Typings
 * - ChatCollection has HeaderInfo of all Chats (but no messages).
 * - A Chat object has all the chat messages.
 * - Done because we don't want to hold ALL the chats and pass it around.
 */
export type Role = 'user' | 'system' | 'assistant';

export type ChatStatus = 'SENDING' | 'READY' | 'ERROR' | 'DELETING';

export type ChatCollection = ChatHeader[];

export interface ChatHeader {
  id: number;
  title: string;
  preview: string;  // Preview of first message.
  createdAt: number;
}

// "messages" are in sequential order, sorted by id.
export interface Chat {
  id: number;
  title?: string;
  preview?: string;
  status: ChatStatus;
  messages: ChatMessage[];
  createdAt: number,
  latestError?: string;
  tokens?: number;
}

// Since ids are auto-increment, we exclude id from the type
// Unfortunately, these means we have to cast all results from DB.
// - https://github.com/jakearchibald/idb/issues/150
export type DBChat = Omit<Chat, "id">;

export interface ChatMessage {
  id: number,
  role: Role;
  content: string;
  partial?: string; // when reading from stream.
  tokens? : number;
}

export interface UserSettings {
  model: string,
}


/*********************************************
 * Settings
 ********************************************/

export type Theme = "LIGHT" | "DARK";

export interface UserSettings {
  theme: Theme,
  model: string,
  systemMessage: string,
  apiKey?: string,
}

export function isUserSettings(settings: UserSettings) : settings is UserSettings {
  if (!settings) return false;
  if (settings.theme === undefined || typeof settings.theme !== 'string') return false;
  if (settings.model === undefined || typeof settings.model !== 'string') return false;
  if (settings.systemMessage === undefined || typeof settings.systemMessage !== 'string') return false;
  if (settings.apiKey && typeof settings.apiKey !== 'string') return false;

  return true;
}

/**
 * API
 */
export type APIStatus =  "SUCCESS" | "ERROR"