export class Constants {
  // CSS
  static readonly MODAL_MAIN_ELEM = "MAIN_WRAPPER";
  static readonly BG_DARK_CLASS = "dark-theme-bg";
  static readonly SCROLLBAR_DARK_CLASS = "scroll-dark";

  // Models
  static readonly GPT_3_5 = "gpt-3.5-turbo";
  static readonly GPT_4 = "gpt-4";

  static readonly GPT_3_5_MAX_TOKENS = 4096;
  static readonly GPT_4_MAX_TOKENS = 8192;

  // LocalStorage Keys;
  static readonly LS_SETTINGS_KEY = "LS-SETTINGS";

  // Taken from https://platform.openai.com/docs/guides/chat/instructing-chat-models
  static readonly DEFAULT_SYS_MSG = "You are ChatGPT, a large language model trained by OpenAI. Answer as concisely as possible. Knowledge cutoff: 2021-09-01";

  // Errors
  static readonly DEFAULT_ERR_MSG = "There was an error generating the response."

  static readonly DB_INIT_ERR_MSG = "There was an error opening IndexedDB. Site may function incorrectly! \
                                      Please ensure your browser allows this site to store data locally."
  static readonly DB_ERR_MSG = "There was an error saving/reading from IndexedDB. Site may function incorrectly! \
                                Please ensure your browser allows this site to store data locally."

  // DB
  static readonly DB_NAME = "SelfHostGPT";
  static readonly DB_VERSION = 2;
  static readonly DB_CHATS_STORE = "chats";

  // Other
  static readonly BLANK_CHAT_ID = -1;  // Something our real chat will never have.
}
