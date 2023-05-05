import { useState, useEffect, useRef, useCallback } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
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

  function isResend() {
    return status === "ERROR" && lastSender === "user";
  }

  return (
    <>
      { errMsg && errorMessageBox() }
      <textarea
        className={styles.txtArea}
        ref={textAreaRef}
        onChange={handleChange}
        onKeyDown={handleKeyPress}
        value={message}
        placeholder="Send a message."
        rows={1}
      />

      { isResend()
          ? <button onClick={debouncedResend}>Resend Message</button>
          : <button onClick={debouncedSend}>Send</button>
      }
      <p>{status}</p>
      { isSending && <p>SENDING...</p>}
    </>
  );
};
