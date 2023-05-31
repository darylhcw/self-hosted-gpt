import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Constants } from '@/constants';
import styles from './Modal.module.css'

// Ensure only one modal open at a time;
let modalIsOpen = false;
const MODAL_ID = "THE-MODAL";
const BODY_SCROLLBAR_WIDTH = "8px"

interface ModalProps {
  children: React.ReactNode;
  closeModal: () => void;
}

export default function Modal({children, closeModal} : ModalProps) {
  useEffect(() => {
    modalOpen();
    return () => modalClosed();
  }, [])

  function preventBubbleUp(e : React.MouseEvent) {
    e.stopPropagation();
  }

  function handleKeydown(e: React.KeyboardEvent) {
    if (e.key == 'Escape') {
      e.preventDefault();
      closeModal();
    }
  }

  return (
    <>
      { createPortal(
          <div id={MODAL_ID} className={styles.overlay}
               onMouseDown={closeModal}
               onKeyDown={handleKeydown}>
            <div className={styles.container}
                 onMouseDown={preventBubbleUp}
                 onClick={preventBubbleUp}>
              {children}
            </div>
          </div>,
          document.body
      )}
    </>
  )
}

/**
 * Modal Open/Close
 * - Add overlay
 * - Prevent body scrolling
 * - Prevent interaction with things outside of modal.
 *   = Extremely basic focus trap.
 */
const FOCUSABLE = "button, input:not([disabled]), *[tabindex]";
let focusRemoved : [Element, string | null][] = [] ;
let lastFocus : Element | null;

function modalOpen() {
  modalIsOpen = true;
  if (!document) return;

  document.body.style.overflow = "hidden";
  document.body.style.paddingRight = BODY_SCROLLBAR_WIDTH;
  const main = document.querySelector("#" + Constants.MODAL_MAIN_ELEM);
  if (!main) return;

  const focusableElements = main.querySelectorAll(FOCUSABLE);
  focusableElements.forEach(elem => {
    if (document.activeElement === elem) lastFocus = elem;

    const original = elem.getAttribute("tabindex");
    elem.setAttribute("tabindex", "-1");
    focusRemoved.push([elem, original])
  });

  const modalElem = document.body.querySelector(`#${MODAL_ID}`);
  const modalFocusable = modalElem?.querySelector(FOCUSABLE);
  if (lastFocus) {
    (modalFocusable as HTMLElement)?.focus()
  }
}

function modalClosed() {
  modalIsOpen = false;
  if (!document) return;

  document.body.style.overflow = "unset";
  document.body.style.paddingRight = "0px";
  for (const [elem, original] of focusRemoved) {
    if (original) {
      elem.setAttribute("tabindex", original);
    } else {
      elem.removeAttribute("tabindex");
    }
  }
  (lastFocus as HTMLElement)?.focus();

  focusRemoved = [];
  lastFocus = null;
}
