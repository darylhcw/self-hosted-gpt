import { useContext, createContext, useReducer, useCallback } from 'react';
import { LSProxy } from '@/lsProxy';
import { Constants } from '@/constants';
import { UserSettings, Theme } from '@/types';

const ENV_APIKEY = import.meta.env.VITE_OPENAI_API_KEY;


/*********************************************
 * Context
 ********************************************/

const UserSettingsContext = createContext<UserSettings>(initialUserSettings());
const UserSettingsDispatchContext = createContext<React.Dispatch<UserSettingsDispatchAction>>(initialDispatch);

function useUserSettings() {
  return useContext(UserSettingsContext);
}

function useUserSettingsDispatch() {
  return useContext(UserSettingsDispatchContext);
}

function UserSettingsProvider({children} : {children: React.ReactNode}) {
  const [settings, dispatch] = useReducer(userSettingsReducer, initialUserSettings());

  return (
    <UserSettingsContext.Provider value={settings}>
      <UserSettingsDispatchContext.Provider value={dispatch}>
        {children}
      </UserSettingsDispatchContext.Provider>
    </UserSettingsContext.Provider>
  );
}

function initialUserSettings() {
  const settings = LSProxy.getUserSettings();
  if (settings) {
    settings.apiKey = ENV_APIKEY ?? settings.apiKey;
    return settings;
  }

  return {
    theme: "LIGHT" as Theme,
    model: Constants.GPT_3_5,
    systemMessage: Constants.DEFAULT_SYS_MSG,
    apiKey: ENV_APIKEY,
  }
}


/*********************************************
 * Reducer
 ********************************************/

type UserSettingsDispatchAction =
  | {type: "set-theme", theme: Theme}
  | {type: "set-model", model: string}
  | {type: "set-api-key", apiKey: string}
  | {type: "set-system-message", systemMessage: string}


function userSettingsReducer(state: UserSettings, action: UserSettingsDispatchAction) {
  switch (action.type) {
    case 'set-theme': {
      const newState = {...state, theme: action.theme};
      LSProxy.setUserSettings(newState);
      return newState;
    }
    case 'set-model': {
      const newState = {...state, model: action.model};
      LSProxy.setUserSettings(newState);
      return newState;
    }
    case 'set-api-key': {
      const newState = {...state, apiKey: action.apiKey};
      LSProxy.setUserSettings(newState);
      return newState;
    }
    case 'set-system-message': {
      const newState = {...state, systemMessage: action.systemMessage};
      LSProxy.setUserSettings(newState);
      return newState;
    }
    default: return state;
  }
}

function userSettingsDispatchFunctions(dispatch: React.Dispatch<UserSettingsDispatchAction>) {
  const setTheme = useCallback((theme: Theme) => {
    dispatch({ type: "set-theme", theme: theme })
  }, [dispatch]);

  const setModel = useCallback((model: string) => {
    dispatch({ type: "set-model", model: model })
  }, [dispatch]);

  const setAPIKey = useCallback((apiKey: string) => {
    dispatch({ type: "set-api-key", apiKey: apiKey })
  }, [dispatch]);

  const setSystemMessage = useCallback((message: string) => {
    dispatch({ type: "set-system-message", systemMessage: message })
  }, [dispatch]);

  return {
    setTheme: setTheme,
    setModel: setModel,
    setAPIKey: setAPIKey,
    setSystemMessage: setSystemMessage,
  }
}

// Put here so ts doesn't complain and we don't have to deal with a null.
function initialDispatch(action: UserSettingsDispatchAction) {
  console.error(`Tried to call dispatch without UserSettingsReducer setup!! \n
                 Please ensure UserSettingsProvider component is created before creating/doing any dispatch actions!\n
                 Action tried ${action}`);
}


/*********************************************
 * Misc
 ********************************************/

export {
  useUserSettings, useUserSettingsDispatch,
  UserSettingsProvider,
  userSettingsDispatchFunctions,
}