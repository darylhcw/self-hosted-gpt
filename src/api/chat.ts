import { Constants } from '@/constants';
import { ChatMessage, APIStatus } from '@/types';

const ENV = import.meta.env;
const COMPLETIONS_URL = "https://api.openai.com/v1/chat/completions";
const LS_API_KEY = Constants.LS_API_KEY;


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
  const body = {
    model: model,
    messages: messages,
  }

  let status: APIStatus = "SUCCESS";

  try {
    const response = await fetch(COMPLETIONS_URL, {
      method: "POST",
      headers: header(),
      body: JSON.stringify(body),
    })
    const res = await response.json();
    return {
      status: status,
      data: res,
    }

  } catch (error: any) {
    status = "ERROR";
    if (error.response) {
      console.log(error.response.status);
      console.log(error.response.data);
    } else {
      console.error(error.message);
    }
    return {
      status: status,
      data: error?.response,
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

export {
  setAPIKey,
  sendChat,
  test
}
