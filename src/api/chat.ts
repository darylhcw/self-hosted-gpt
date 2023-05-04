import { Constants } from '@/constants';
import { APIError } from './apiError';
import { ChatMessage, APIStatus } from '@/types';

const ENV = import.meta.env;
const COMPLETIONS_URL = "https://api.openai.com/v1/chat/completions";
const LS_API_KEY = Constants.LS_API_KEY;

// Debug flags useful for debuggin in dev
const USE_MOCK_API = false;
const USE_MOCK_API_ERROR = false;


/*********************************************
 * API Key
 * - Set in ENV.
 * - For the hosted version, this taken from user input
 *   and saved in local storage.
 ********************************************/

let apiKey = initAPIKey();

function initAPIKey() {
  let key = localStorage?.getItem(LS_API_KEY);
  if (!key) key = ENV.VITE_OPENAI_API_KEY;
  return key;
}

function setAPIKey(key: string) {
  apiKey = key;
  localStorage?.setItem(LS_API_KEY, key);
}

function header() {
  return {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${apiKey}`
  }
}


/*********************************************
 * Chat Completion
 ********************************************/

async function sendChat(model: string, messages: ChatMessage[]) {
  if (USE_MOCK_API) return mockSendChat(model, messages);
  if (USE_MOCK_API_ERROR) return mockSendChatError(model, messages);

  const toSendMessages = messages.map((message) => {
    return {
      role: message.role,
      content: message.content
    }
  });

  const body = {
    model: model,
    messages: toSendMessages,
  }

  try {
    const response = await fetch(COMPLETIONS_URL, {
      method: "POST",
      headers: header(),
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      throw new APIError(`OpenAI HTTP status code: ${response.status}`, response);
    }

    const res = await response.json();
    return {
      status: "SUCCESS",
      data: res,
    }

  } catch (error: any) {
    let res = error.message;
    try {
      res = await error.response.json();
      console.error("OpenAI API Error:", res.error?.message);
    } catch (parseError : any) {
      console.error("Error parsing response JSON:", parseError.message);
    }

    return {
      status: "ERROR",
      data: res,
    }
  }
}

// Say HI to ensure OpenAI API is working.
async function test(model: string) {
  const params = {
    model: model,
    messages: [
      {
        role: "user",
        content: "Please respond with one word. Hello!",
      },
    ]
  }

  try {
    const response = await fetch(COMPLETIONS_URL, {
      method: "POST",
      headers: header(),
      body: JSON.stringify(params),
    })
    const res = await response.json();
    console.log(res);
    return res;
  } catch (error) {
    if (error instanceof Error) {
      console.log(error.message);
    } else {
      console.error(error);
    }
  }
}

/*********************************************
 * Debug/Test
 ********************************************/

const TIMEOUT_LENGTH = 3000;

function getFakeCompletionResponse(model: string, sentMessage?: string) {
  if (!sentMessage) sentMessage = "MOCK SEND MESSAGE";

  let ptokens = sentMessage.split(" ").length;
  let ctokens = ptokens + 2;

  return {
    "id": "mock-api-response-id",
    "object": "chat.completion",
    "created": Date.now(),
    "model": model,
    "choices": [
      {
        "message": {
          "role": "assistant",
          "content": `MOCK_REPLY: ${sentMessage}`,
        },
        "finish_reason": "stop",
        "index": 0,
      }
    ],
    "usage": {
      "prompt_tokens": ptokens,
      "completion_tokens": ctokens,
      "total_tokens": ptokens + ctokens,
    }
  }
}

// Mock version with timeout and fake response for debugging.
async function mockSendChat(model: string, messages: ChatMessage[]) {
  const lastMessage = messages.at(-1)?.content;
  await new Promise(r => setTimeout(r, TIMEOUT_LENGTH));

  return {
    status: "SUCCESS",
    data: getFakeCompletionResponse(model, lastMessage),
  }
}

// Mock version with timeout and fake error for debugging.
async function mockSendChatError(model: string, messages: ChatMessage[]) {
  await new Promise(r => setTimeout(r, TIMEOUT_LENGTH));
  const response = {
    error: {
      message: "MOCK ERROR",
    }
  }

  return {
    status: "ERROR",
    data: response,
  }
}


export {
  setAPIKey,
  sendChat,
  test
}
