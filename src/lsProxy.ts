import { UserSettings, isUserSettings } from '@/types';
import { Constants } from '@/constants';

/*********************************************
 * Proxy for local storage for type-checking and safe get/set.
 ********************************************/

class LSProxy {
  // Generic - not type checking at runtime.
  static setItem<T>(key: string, value: T | null) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  static getItem<T>(key: string): T | null {
    const data: string | null = localStorage.getItem(key);
    return data !== null ? JSON.parse(data) : null;
  }

  static removeItem(key: string) {
    localStorage.removeItem(key);
  }

  // Custom - getters do typecheck at runtime.
  static getUserSettings() : UserSettings | null {
    const settings : UserSettings | null = this.getItem<UserSettings>(Constants.LS_SETTINGS_KEY);
    if (!settings) return null;
    if (isUserSettings(settings)) return settings;

    return null;
  }

  static setUserSettings(settings: UserSettings) {
    this.setItem<UserSettings>(Constants.LS_SETTINGS_KEY, settings);
  }
}


export {
  LSProxy
}