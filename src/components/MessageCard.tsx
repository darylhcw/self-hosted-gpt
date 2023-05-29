import { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import rehypeRaw from 'rehype-raw'
import GrowingTextArea from '@/components/GrowingTextArea';
import { ChatMessage, Theme } from "@/types";
import styles from "./MessageCard.module.css";

const OPEN_TIME = 500;
const BLINK_TIME = 200;

export interface MessageCardProps {
  theme: Theme;
  message: ChatMessage;
  errMsg?: string;
  editMessage: (messageId: number, content: string) => void;
}

export default function MessageCard({ theme, message, errMsg, editMessage} : MessageCardProps) {
  const darkTheme = theme == "DARK"

  const [isEditing, setIsEditing] = useState(false);
  const [editedMsg, setEditedMsg] = useState(message.content);
  const editTxtArea = useRef<HTMLTextAreaElement>(null);

  // Use ref. We don't dispatch more state changes on each stream read callback.
  const blinkRef = useRef(false);

  useEffect(() => {
    let isLatest = true;

    function blink() {
      if (!isLatest) return;

      setTimeout(blink, (blinkRef.current ? OPEN_TIME : BLINK_TIME));
      blinkRef.current = !blinkRef.current;
    }
    blink();

    return () => { isLatest = false };
  }, [])

  useEffect(() => {
    editTxtArea?.current?.focus();
  }, [isEditing]);

  function editMessageCB() {
    setIsEditing(true);
  }

  function handleEditMsgChange(event: React.ChangeEvent<HTMLTextAreaElement>) {
    setEditedMsg(event.target.value);
  }

  function editMessageSaveCB() {
    editMessage(message.id, editedMsg);
    setIsEditing(false);
  }

  function editMessageCancelCB() {
    setIsEditing(false);
    setEditedMsg(message.content);
  }

  function copyTextCB() {
    if (!navigator?.clipboard) console.error("No navigator clipboard when copying text?!");
    navigator.clipboard.writeText(message.content);
  }

  function renderErrorMsg() {
    return (
      <p className={`${darkTheme ? styles["error-dark"] : styles.error}`}>
        {errMsg}
      </p>
    )
  }

  function renderMessage() {
    let content;
    if (message.content.trim().length > 0) {
      content = message.content
    } else if (message.partial) {
      content = message.partial + (blinkRef.current ? "" : "█");
    } else {
      content = (blinkRef.current ? "" : "█");
    }

    return (
      <ReactMarkdown rehypePlugins={[[rehypeHighlight, {detect: true, ignoreMissing: true}], rehypeRaw]}
                     components={markdownComps}
                     linkTarget="_new">
        { content }
      </ReactMarkdown>
    )
  }

  function renderEditingMessage() {
    return (
      <div className={`${styles["editing-container"]} ${darkTheme ? styles["dark-theme"] : ""}`}>
        <GrowingTextArea ref={editTxtArea}
                         onChange={handleEditMsgChange}
                         value={editedMsg}/>
        <div>
          <button className={styles["save-edit-btn"]}
                  onClick={() => editMessageSaveCB()}>
            Save and Submit
          </button>
          <button onClick={() => editMessageCancelCB()}>
            Cancel
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={`${styles.container} ${message.role == "assistant" ? styles["assistant-bg"] : ""} ${darkTheme ? styles["dark-theme"] : ""}`}>
      <div className={styles["container-inner"]}>
        <img src={ message.role == "assistant"
                     ? (darkTheme ? "robot-light.svg" : "robot.svg")
                     : (darkTheme ? "user-light.svg" : "user.svg")
                 }
             className={styles.icon}
             alt={message.role}/>

        <div className={styles["message-text"]}>
          { errMsg
              ? renderErrorMsg()
              : isEditing
                  ? renderEditingMessage()
                  : renderMessage()
          }
          <p className={styles.tokens}>{`Tokens: ${message.tokens ?? "?"}`}</p>
        </div>
        <div className={styles["buttons-container"]}>
        { message.role === "user"
            && <button onClick={editMessageCB}
                       className={`${styles["action-button"]} ${darkTheme ? "hover-brighten" : ""}`}>
                  <img src={`edit${darkTheme ? "-light" : ""}.svg`} alt="edit"/>
               </button>
        }
          <button onClick={copyTextCB}
                  className={`${styles["action-button"]} ${darkTheme ? "hover-brighten" : ""}`}>
            <img src={`clipboard${darkTheme ? "-light" : ""}.svg`} alt="copy"/>
          </button>
        </div>
      </div>
    </div>
  )
}


/**
 * Extra modifications to nodes.
 * - Without an extra div, the background only appears behind text.
 * - Also lets us add copy/paste bar to code blocks.
 */
const markdownComps = {
  code: CodeBlock
}

function CodeBlock({
  node,
  inline,
  className,
  children,
  ...props
} : {
  node : object,
  inline?: boolean,
  className?: string,
  children: React.ReactNode,
}) {
  return (
    inline
      ? <code className={`hljs ${styles["inline-codeblock"]}`}{...props}>
         {children}
        </code>
      : <div className={`hljs ${styles.codeblock}`}>
          <code {...props} className={styles["codeblock-inner"]}>
            {children}
          </code>
        </div>
  )
}
