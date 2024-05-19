import { useState } from 'react';
import Modal from '@/components/Modal';
import {
  useUserSettings,
  useUserSettingsDispatch,
  useUserSettingsDispatchFunctions,
} from '@/hooks/useUserSettings'
import { Constants } from '@/constants';
import styles from './UserSettings.module.css';

interface UserSettingsProps {
  refreshNewChat: () => void;
  closeSettings: () => void;
}

const ENV_APIKEY = import.meta.env.VITE_OPENAI_API_KEY;

export default function UserSettings({closeSettings, refreshNewChat} : UserSettingsProps) {
  const settings = useUserSettings();
  const dispatchSettings = useUserSettingsDispatch();
  const { setTheme, setModel, setAPIKey, setSystemMessage } = useUserSettingsDispatchFunctions(dispatchSettings);

  const [showAPIKey, setShowAPIKey] = useState(false);

  const darkTheme = settings.theme === "DARK";

  function toggleTheme() {
    setTheme(darkTheme ? "LIGHT" : "DARK");
  }

  function handleModelChange(e: React.ChangeEvent<HTMLSelectElement>) {
    setModel(e.target.value);
  }

  function handleAPIKeyChange(e: React.ChangeEvent<HTMLInputElement>) {
    setAPIKey(e.target.value);
  }

  function handleSysMsgChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setSystemMessage(e.target.value);
    refreshNewChat();
  }

  function resetAPIKey() {
    setAPIKey(ENV_APIKEY ?? "");
  }

  function resetSysMsg() {
    setSystemMessage(Constants.DEFAULT_SYS_MSG);
    refreshNewChat();
  }

  function darkThemeClass() {
    return darkTheme ? styles.dark : "";
  }

  return (
    <Modal closeModal={closeSettings}>
      <div className={`${styles.container} ${darkThemeClass()}`}>
        <div className={styles["inner-container"]}>
          <h2>Settings:</h2>
          <button className={`${styles["close-button"]} ${darkThemeClass()}`}
                  onClick={() => closeSettings()}>
            &#10006;
          </button>
          <hr className={styles.hline}/>
          <div className={styles["theme-container"]}>
            Theme:

            <button onClick={toggleTheme}
                    className={`${styles.toggle} ${darkThemeClass()}`}>
              <div className={styles["inner-toggle"]}/>
            </button>
            {darkTheme ? "Dark" : "Light"}
          </div>

          <div className={`${styles.model} ${darkThemeClass()}`}>
            <label htmlFor="model-input">Model:</label>
            <select id="model-input"
                    value={settings.model}
                    onChange={handleModelChange}>
              <option value={Constants.GPT_3_5}>GPT-3.5-Turbo</option>
              <option value={Constants.GPT_4}>GPT-4</option>
              <option value={Constants.GPT_4_TURBO}>GPT-4-Turbo</option>
              <option value={Constants.GPT_4_OMNI}>GPT-4o</option>
            </select>
          </div>

          <div className={styles["apikey-container"]}>
            <label htmlFor="apikey-input">
              {"API Key (Is this safe? "}
              <a href="https://github.com/darylhcw/self-hosted-gpt#questions"
                rel="external help"
                target="_black"
                className={darkThemeClass()}>
                {"See here"}
              </a>
              {"):"}
            </label>
            <input id="apikey-input"
                   className={`${styles["apikey-input"]} ${darkThemeClass()}`}
                   type={showAPIKey ? "text" : "password"}
                   value={settings.apiKey}
                   onChange={handleAPIKeyChange}/>
            <div>
              <button className={`${styles.button} ${darkThemeClass()}`}
                      onClick={() => setShowAPIKey(!showAPIKey)}>
                { showAPIKey ? "Hide" : "Show"}
              </button>
              <button className={`${styles.button} ${darkThemeClass()}`}
                      onClick={() => setAPIKey("")}>
                Clear
              </button>
              <button className={`${styles.button} ${darkThemeClass()}`}
                      onClick={() => resetAPIKey()}>
                Reset to .env value
              </button>
            </div>
          </div>

          <div className={styles["sysmsg-container"]}>
            <label htmlFor="sysmsg-input">System Message - (Base Context for Chat)</label>
            <textarea id="sysmsg-input"
                      className={`${styles.sysmsg} ${darkThemeClass()}`}
                      rows={6}
                      value={settings.systemMessage}
                      onChange={handleSysMsgChange}/>
            <button className={`${styles.button} ${darkThemeClass()}`}
                    onClick={() => resetSysMsg()}>
              Reset to Default
            </button>
          </div>

        </div>
      </div>
    </Modal>
  )
}
