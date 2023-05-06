import { useState } from 'react';
import Modal from '@/components/Modal';
import {
  useUserSettings,
  useUserSettingsDispatch,
  userSettingsDispatchFunctions
} from '@/hooks/useUserSettings'
import { Theme } from '@/types';
import styles from './UserSettings.module.css';

export default function UserSettings({closeSettings} : {closeSettings:() => void}) {
  const settings = useUserSettings();
  const dispatchSettings = useUserSettingsDispatch();
  const { setTheme, setModel, setAPIKey, setSystemMessage } = userSettingsDispatchFunctions(dispatchSettings);

  function toggleTheme() {
    let res = "LIGHT";
    if (settings.theme === "LIGHT") res = "DARK";
    setTheme(res as Theme);
  }

  function handleModelChange(e: React.ChangeEvent<HTMLInputElement>) {
    setModel(e.target.value);
  }

  function handleAPIKeyChange(e: React.ChangeEvent<HTMLInputElement>) {



    setAPIKey(e.target.value);
  }

  function handleSysMsgChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setSystemMessage(e.target.value);
  }

  return (
    <Modal closeModal={closeSettings}>
      <div className={styles.container}>
        <div>
          {settings.theme}
          <button onClick={toggleTheme}>Change Theme</button>
        </div>
        <div>
          {/* Add buttons to choose 3.5/4 or "custom" input with an "OK" button */}
          <label htmlFor="model-input">Model</label>
          <input id="model-input" type="text" value={settings.model} onChange={handleModelChange}/>
        </div>
        <div>
          {/* Add info here to refer to GitHub for security specifics */}
          <label htmlFor="apikey-input">API Key</label>
          <input id="apikey-input" type="text" value={settings.apiKey} onChange={handleAPIKeyChange}/>
        </div>
        <div>
          {/* Add "default" button to switch back */}
          <label htmlFor="sysmsg-input">System Message - (Base Context for Chat)</label>
          <br/>
          <textarea id="sysmsg-input" rows={4} value={settings.systemMessage} onChange={handleSysMsgChange}/>
        </div>
      </div>
    </Modal>
  )
}
