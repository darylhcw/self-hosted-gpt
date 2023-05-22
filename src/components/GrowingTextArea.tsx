import { useEffect, useRef, forwardRef } from 'react';
import { useCombinedRefs } from '@/hooks/useCombinedRefs';

export interface GrowingTextAreaProps {
  onChange?: React.ChangeEventHandler<HTMLTextAreaElement>;
  onKeyDown?: React.KeyboardEventHandler<HTMLTextAreaElement>;
  value?: string;
  placeholder?: string;
}

export type TxtAreaRef = HTMLTextAreaElement;

const GrowingTextArea = forwardRef<TxtAreaRef, GrowingTextAreaProps>((props, forwardedRef) => {
  const fallbackRef = useRef<HTMLTextAreaElement>(null);
  const textAreaRef = useCombinedRefs<HTMLTextAreaElement>(fallbackRef, forwardedRef);

  useEffect(() => {
    const txtArea = textAreaRef.current;
    if (txtArea) {
      // We need to reset the height momentarily to get the correct scrollHeight for the textarea
      txtArea.style.height = "0px";
      const scrollHeight = txtArea.scrollHeight + 2;
      txtArea.style.height = scrollHeight + "px";
    }
  }, [textAreaRef, props.value]);

  return (
    <textarea ref={textAreaRef}
              onChange={props.onChange}
              onKeyDown={props.onKeyDown}
              value={props.value}
              placeholder={props.placeholder}
              rows={1}/>
  )
});


export default GrowingTextArea;