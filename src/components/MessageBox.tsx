import { useState, useCallback } from 'react';
import GrowingTextArea from '@/components/GrowingTextArea';
import { useDebounce } from '@/hooks/useDebounce';
import { useUserSettings } from '@/hooks/useUserSettings';
import { ChatStatus } from '@/types';
import styles from './MessageBox.module.css'


interface MessageBoxProps {
  status: ChatStatus;
  sendCB: (message: string) => Promise<void>;
  resendCB: () => Promise<void>;
  hasMsg : boolean;
}

export default function MessageBox({
  status,
  sendCB,
  resendCB,
  hasMsg,
} : MessageBoxProps
) {
  const settings = useUserSettings();
  const darkTheme = settings.theme === "DARK";
  const themeClass = darkTheme ? styles["dark-theme"] : "";

  const [isSending, setIsSending] = useState(false);
  const [message, setMessage] = useState("");

  const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(event.target.value);
  };

  const handleKeyPress = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  };

  const sendMessage = useCallback(async () => {
    if (!allowSend()) return;
    if (message.trim().length <= 0) return;

    setIsSending(true);
    setMessage("");
    await sendCB(message);
    setIsSending(false);
  }, [sendCB, message, setIsSending, isSending, status]);

  const debouncedSend = useDebounce(sendMessage, 1000);

  const resendMessage = useCallback(async () => {
    if (!allowSend()) return;
    if (message.trim().length <= 0) return;

    setIsSending(true);
    setMessage("");
    await resendCB();
    setIsSending(false);
  }, [resendCB, setIsSending, isSending, status]);

  const debouncedResend = useDebounce(resendMessage, 1000);

  function allowSend() {
    return !isSending && status !== "SENDING";
  }

  function allowResend() {
    return allowSend() && hasMsg;
  }

  function sendIcon() {
    if (status === "SENDING" || isSending) {
      return status === "SENDING" ? "send-wait-light.svg" : "send-wait.svg";
    } else {
      return darkTheme ? "send-light.svg" : "send.svg";
    }
  }


  return (
    <div className={`${styles.container} ${themeClass}`}>
      { allowResend()
          &&  <button onClick={debouncedResend} className={`${styles.regenerate} ${themeClass}`}>
                <img src={darkTheme ? "regenerate-light.svg" : "regenerate.svg"}/>
                Regenerate Response
              </button>
      }

      <div className={`${styles["send-container"]} ${themeClass}`}>
        <GrowingTextArea onChange={handleChange}
                         onKeyDown={handleKeyPress}
                         value={message}
                         placeholder="Send a message."/>
        <button onClick={status == "ERROR" ? debouncedResend : debouncedSend}
                className={styles.send}
                disabled={!allowSend()}>
          <img src={sendIcon()} alt="send"/>
        </button>
      </div>
    </div>
  );
};
