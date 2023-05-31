import styles from './TopBar.module.css';

export interface TopBarProps {
  toggleSideBar: () => void;
  newChat: () => void;
  title?: string;
}

export default function TopBar({toggleSideBar, newChat, title} : TopBarProps) {
  return (
    <header className={styles.header}>
      <button onClick={toggleSideBar}
              className={styles.button}>
        <img src="hamburger.svg"
             className={styles.hamburger}
             alt="open/close menu"/>
      </button>
      <h2 className="ellipsis-text">
        { title ?? "[Untitled]"}
      </h2>
      <button onClick={newChat}
              className={styles.button}>
        +
      </button>
    </header>
  )
}