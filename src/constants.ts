export class Constants {
  // Models
  static readonly GPT_3_5 = "gpt-3.5-turbo";
  static readonly GPT_4 = "gpt-4";

  static readonly GPT_3_5_MAX_TOKENS = 4096;
  static readonly GPT_4_MAX_TOKENS = 8192;

  // LocalStorage Keys
  static readonly LS_CH_KEY = "LS-CHAT-HISTORY";
  static readonly LS_CH_PREFIX_KEY = "LS-CHAT";
  static readonly LS_SETTINGS_KEY = "LS-SETTINGS";

  // Taken from https://platform.openai.com/docs/guides/chat/instructing-chat-models
  static readonly DEFAULT_SYS_MSG = "You are ChatGPT, a large language model trained by OpenAI. Answer as concisely as possible. Knowledge cutoff: 2021-09-01";
  static readonly DEFAULT_ERR_MSG = "There was an error generating the response."

  static readonly MODAL_MAIN_ELEM = "MAIN_WRAPPER";
}
