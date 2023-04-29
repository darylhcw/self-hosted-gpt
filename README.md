# self-hosted-gpt
Self-host ChatGPT with GPT-3.5/GPT-4 using your own API key.


## Why?
- ChatGPT Plus costs $20 a month.
- With an API Key,it costs $0.06 per 1K tokens (at 8K context) for GPT-4.
- To reach $20, you need to use $20/$0.06 = 333.333 * 1K tokens = 333K tokens.
- Unless you REALLY use chatGPT like crazy, you will not reach that number.


Bonus: 
- If you don't care about GPT-4, and just want GPT-3.5, now it costs $0.002 per 1K tokens, which means you'll need 9 million tokens to reach $20.


## How to run?
1)  Simply edit the .env file and replace your API key with the one.
2)  You may also visit the github pages site:


## Questions
- Is this safe?
  - Yes. This is pure client-side static site. Your API key is only sent in POST requests to OpenAI. You can look at the code to confirm for yourself.
- Does this cost money?
  - Yes. Refer to https://openai.com/pricing for the pricing -- and the "Why?" section above.

