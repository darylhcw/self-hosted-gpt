import { useState, useEffect, useRef, useCallback } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import { useUserSettings } from '@/hooks/useUserSettings';
import { ChatStatus, Role } from '@/types';
import styles from './MessageBox.module.css'


interface MessageBoxProps {
  status: ChatStatus;
  sendCB: (message: string) => void;
  resendCB: () => void;
  lastSender: Role | null;
  errMsg?: string;
}


export default function MessageBox({
  status,
  sendCB,
  resendCB,
  lastSender,
  errMsg
} : MessageBoxProps
) {
  const settings = useUserSettings();
  const darkTheme = settings.theme === "DARK";
  const themeClass = darkTheme ? styles["dark-theme"] : "";

  const [isSending, setIsSending] = useState(false);
  const [message, setMessage] = useState("");
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  // Variable height textArea - with limit.
  useEffect(() => {
    const txtArea  = textAreaRef.current;

    if (txtArea) {
      // We need to reset the height momentarily to get the correct scrollHeight for the textarea
      txtArea.style.height = "0px";
      const scrollHeight = txtArea.scrollHeight;
      txtArea.style.height = scrollHeight + "px";
    }
  }, [textAreaRef, message]);

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
    if (message.trim.length <= 0 ) {
      setIsSending(true);
      const res = await sendCB(message);
      setMessage("");
      setIsSending(false);
    }
  }, [sendCB, message, setIsSending]);

  const debouncedSend = useDebounce(sendMessage, 1000);

  const resendMessage = useCallback(async () => {
    if (message.trim.length <= 0 ) {
      setIsSending(true);
      const res = await resendCB();
      setIsSending(false);
    }
  }, [resendCB, setIsSending]);

  const debouncedResend = useDebounce(resendMessage, 1000);

  function errorMessageBox() {
    return (
      <div>
        {errMsg}
      </div>
    )
  }

  function allowSend() {
    return status !== "ERROR" && lastSender !== "user";
  }

  function sendIcon() {
    if (status === "SENDING") {
      return status === "SENDING" ? "send-wait-light.svg" : "send-wait.svg";
    } else {
      return darkTheme ? "send-light.svg" : "send.svg";
    }
  }


  return (
    <div className={`${styles.container} ${themeClass}`}>
      { errMsg && errorMessageBox() }

      { lastSender === "assistant"
          &&  <button onClick={debouncedResend} className={`${styles.regenerate} ${themeClass}`}>
                <img src={darkTheme ? "regenerate-light.svg" : "regenerate.svg"}/>
                Regenerate Response
              </button>
      }

      <div className={styles["send-container"]}>
        { <button onClick={debouncedSend}
                  className={styles.send}
                  disabled={!allowSend()}>
            <img src={sendIcon()} alt="send"/>
          </button>
        }
        <textarea className={`${styles.txtArea} ${themeClass}`}
                  ref={textAreaRef}
                  onChange={handleChange}
                  onKeyDown={handleKeyPress}
                  value={message}
                  placeholder="Send a message."
                  rows={1}
        />
      </div>
      {/* <p>{status}</p> */}
      {/* { isSending && <p>SENDING...</p>} */}
    </div>
  );
};
