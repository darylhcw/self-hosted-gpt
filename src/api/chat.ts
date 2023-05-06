import { Constants } from '@/constants';
import { APIError } from './apiError';
import { ChatMessage } from '@/types';

const COMPLETIONS_URL = "https://api.openai.com/v1/chat/completions";

// Debug flags useful for debuggin in dev
const USE_MOCK_API = false;
const USE_MOCK_API_ERROR = false;


/*********************************************
 * Chat Completion
 ********************************************/

async function sendChat(apiKey: string, model: string, messages: ChatMessage[]) {
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
      headers: header(apiKey),
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
async function test(apiKey: string, model: string) {
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
      headers: header(apiKey),
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


function header(apiKey: string) {
  return {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${apiKey}`
  }
}

/*********************************************
 * Other
 ********************************************/

const MODELS_URL = "https://api.openai.com/v1/models";

// Get available models from OpenAI
async function getModels(apiKey: string) {
  try {
    const response = await fetch(MODELS_URL, {
      method: "GET",
      headers: header(apiKey),
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

const TIMEOUT_LENGTH = 1000;

function getFakeCompletionResponse(model: string, sentMessage?: string) {
  if (!sentMessage) sentMessage = "MOCK SEND MESSAGE";

  const ptokens = sentMessage.split(" ").length;
  const ctokens = ptokens + 2;
  const content = `MOCK_REPLY: ${sentMessage}`;

  return {
    "id": "mock-api-response-id",
    "object": "chat.completion",
    "created": Date.now(),
    "model": model,
    "choices": [
      {
        "message": {
          "role": "assistant",
          "content": content,
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
  sendChat,
  test,
  getModels,
}
