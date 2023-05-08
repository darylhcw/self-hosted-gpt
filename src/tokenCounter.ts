import { encode } from '@nem035/gpt-3-encoder';
import { ChatMessage } from '@/types';

/*********************************************
 * Count tokens.
 * - The reason we need this is because when streaming response,
 *   the usage is not sent back in the API.
 *   (OpenAI says it breaks some integrations)
 * - The token count here is not exactly accurate, but close enough.
 ********************************************/

function countTokens(message: ChatMessage | undefined) {
  if (!message) return 0;
  const actualSent = {
    role: message.role,
    content: message.content,
  }

  const encoded = encode(JSON.stringify(actualSent));
  return encoded?.length ?? 0;
}


export {
  countTokens,
}
