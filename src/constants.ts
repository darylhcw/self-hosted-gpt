export class Constants {
  // CSS
  static readonly MODAL_MAIN_ELEM = "MAIN_WRAPPER";
  static readonly BG_DARK_CLASS = "dark-theme-bg";
  static readonly SCROLLBAR_DARK_CLASS = "scroll-dark";

  // Models
  static readonly GPT_3_5 = "gpt-3.5-turbo";
  static readonly GPT_4 = "gpt-4";
  static readonly GPT_4_TURBO = "gpt-4-turbo"
  static readonly GPT_4_OMNI = "gpt-4o";

  static readonly GPT_3_5_MAX_TOKENS = 4096;
  static readonly GPT_4_MAX_TOKENS = 8192;
  static readonly GPT_4_TURBO_MAX_TOKENS = 128000;
  static readonly GPT_4_OMNI_MAX_TOKENS = 128000;

  // LocalStorage Keys;
  static readonly LS_SETTINGS_KEY = "LS-SETTINGS";

  // Taken from https://platform.openai.com/docs/guides/chat/instructing-chat-models
  static readonly DEFAULT_SYS_MSG = "You are GPT, a large language model trained by OpenAI. Answer as concisely as possible.";

  // Errors
  static readonly DEFAULT_ERR_MSG = "There was an error generating the response."

  static readonly DB_INIT_ERR_MSG = "There was an error opening IndexedDB. Site may function incorrectly! \nPlease ensure your browser allows this site to store data locally."
  static readonly DB_ERR_MSG = "There was an error saving/reading from IndexedDB. Site may function incorrectly! \nPlease ensure your browser allows this site to store data locally."

  // DB
  static readonly DB_NAME = "SelfHostGPT";
  static readonly DB_VERSION = 2;
  static readonly DB_CHATS_STORE = "chats";

  // Default Messages (When you start new chat)
  static readonly TITLE = "Self-Host GPT";
  static readonly NO_API_KEY_MSG1 = "Please ensure you have entered your OpenAI APIKey in the settings"
  static readonly NO_API_KEY_MSG2 = "found at the top left of the page."
  static readonly NO_API_KEY_SELF_HOST = "If self-hosting, ensure it is set in the .env file."

  // Other
  static readonly BLANK_CHAT_ID = -1;  // Something our real chat will never have.
}
