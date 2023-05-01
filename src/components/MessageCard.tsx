import { ChatMessage } from "@/types";
import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import rehypeRaw from 'rehype-raw'
import styles from "./MessageCard.module.css";


export default function MessageCard({ message } : {message: ChatMessage}) {
  return (
    <>
      <p>{message.role}</p>
      <ReactMarkdown rehypePlugins={[[rehypeHighlight, {detect: true, ignoreMissing: true}], rehypeRaw]}
                     components={markdownComps}
                     linkTarget="_new">
        {message.content}
      </ReactMarkdown>
    </>
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
