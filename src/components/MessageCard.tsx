import { ChatMessage } from "@/types";
import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import rehypeRaw from 'rehype-raw'
import { Theme } from '@/types';
import styles from "./MessageCard.module.css";


export interface MessageCardProps {
  theme: Theme;
  message: ChatMessage;
  editMessage: (messageId: number, content: string) => void;
}

export default function MessageCard({ theme, message, editMessage} : MessageCardProps) {
  console.log("MC RERENDER:", message.id);
  const partial = message.partial !== undefined;
  const darkTheme = theme == "DARK"

  function editMessageCB() {
    editMessage(message.id, message.content + "ASDF");
  }

  function copyTextCB() {
    if (!navigator?.clipboard) console.error("No navigator clipboard when copying text?!");
    navigator.clipboard.writeText(message.content);
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
          <ReactMarkdown rehypePlugins={[[rehypeHighlight, {detect: true, ignoreMissing: true}], rehypeRaw]}
                        components={markdownComps}
                        linkTarget="_new">
            {partial ? message.partial! : message.content}
          </ReactMarkdown>
          <p className={styles.tokens}>{`Tokens: ${message.tokens ?? "?"}`}</p>
        </div>
        <div>
        { message.role === "user"
            && <button onClick={editMessageCB} className={styles["action-button"]}>
                <img src={`edit${darkTheme ? "-light" : ""}.svg`} alt="edit"/>
               </button>
        }
          <button onClick={copyTextCB} className={styles["action-button"]}>
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
      ? <code className={className}{...props}>
         {children}
        </code>
      : <div className={`hljs ${styles.codeblock}`}>
          <code {...props} className={className}>
            {children}
          </code>
        </div>
  )
}
