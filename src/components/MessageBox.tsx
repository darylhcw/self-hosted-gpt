import { useState, useEffect, useRef } from 'react';
import { ChatStatus } from '@/types';
import styles from './MessageBox.module.css'


interface MessageBoxProps {
  status: ChatStatus;
  sendCB: (message: string) => void;
}


export default function MessageBox({status, sendCB} : MessageBoxProps) {
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

  const sendMessage = () => {
    if (message.trim.length <= 0 ) {
      sendCB(message);
      setMessage("");
    }
  }

  return (
    <>
      <textarea
        className={styles.txtArea}
        ref={textAreaRef}
        onChange={handleChange}
        onKeyDown={handleKeyPress}
        value={message}
        placeholder="Send a message."
        rows={1}
      />
      <button onClick={sendMessage}>Send</button>
      <p>{status}</p>
    </>
  );
};
