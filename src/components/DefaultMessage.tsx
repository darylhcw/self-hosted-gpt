import { useUserSettings } from '@/hooks/useUserSettings';
import { Constants } from '@/constants';
import styles from './DefaultMessage.module.css'


export default function DefaultMessage() {
  const settings = useUserSettings();

  return (
    <div className={styles.container}>
      <div className={styles.inner}>
        <h2>{ Constants.TITLE }</h2>
        { !settings.apiKey &&
          <div className={`${styles.card} ${settings.theme === "DARK" ? styles.dark : ""}`}>
            <p>Welcome!</p>
            <p>
              { Constants.NO_API_KEY_MSG1 + ' ("'}
              <img src={settings.theme === "DARK" ? "settings-light.svg" : "settings.svg"}
                   alt="settings gear icon"/>
              { '") ' + Constants.NO_API_KEY_MSG2 }
            </p>
            <p>{ Constants.NO_API_KEY_SELF_HOST}</p>
          </div>
        }
      </div>
    </div>
  )
}