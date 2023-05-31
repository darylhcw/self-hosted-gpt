# self-hosted-gpt
Self-host ChatGPT with GPT-3.5/GPT-4 using your own API key.
- GithubPages Version: https://darylhcw.github.io/self-hosted-gpt/


## Why?
- ChatGPT Plus costs $20 a month.
- With an API Key,it costs $0.06 per 1K tokens (at 8K context) for GPT-4.
- To reach $20, you need to use $20/$0.06 = 333.333 * 1K tokens = 333K tokens.
- Unless you REALLY use chatGPT like crazy, you will not reach that number.
- If you don't care about GPT-4, and just want GPT-3.5, now it costs $0.002 per 1K tokens, which means you'll need 9 million tokens to reach $20.
- This version also has a token count for each chat message and the total token count at the bottom so you know how much you're using.

## How to run?
1)  Edit the .env file and replace your API key with the one (or just launch and add it in the settings).
2)  You may also visit the github pages site [here](https://darylhcw.github.io/self-hosted-gpt/) and fill in your API Key.


## Questions
**Q1:** Is it safe for me to input my APIKey?
 - I would say yes. This is fully static client-side only website. Your API key is only sent in POST requests to OpenAI. See more details in the "Security" section below.


**Q2:** Does this cost money?
- Yes. This is meant for you to use _your_ APIKey. Refer to [OpenAI](https://openai.com/pricing) for the pricing. Note the "Why?" section above.


**Q3:** How are tokens counted?
- Individual messages use token counts from GPT response and [gpt-tokenizer](https://www.npmjs.com/package/gpt-tokenizer).
We need to count tokens because the stream-type response from OpenAI does not return the usage!


## Security
**Q1:** How is my APIKey stored/used?
- The APIKey is stored locally in your browser in localStorage.
- It is **only** used to send requests to openAI.


**Q2:** How are my chats stored?
- They are stored locally in your browser through IndexedDB.


**Q3:** Isn't local storage unsafe? 
- Not really in this case. The main risk associated with using localStorage is Cross Site Scriping (XSS). Here's the precautions/measures against XSS.
  - XSS through user input - All user inputs are sanitized and will just be treated as plain strings in the code.
  - XSS through malicious scripts - This site is statically built with minimal, known packages, which I have ran a scan using Snyk to detect for any vulnerabilities or malicious code.
- Remember that we have no server - we just send requests to OpenAI and keep your data locally.
- I would only worry if someone malicious has physical access to your machine. But in that case, your OpenAI API Key is probably not on the top of the list.

