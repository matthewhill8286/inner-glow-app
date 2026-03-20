import { t } from 'i18next';
import { create } from 'zustand';
import { SliceCreator } from './zustand-helpers';

export interface AlertAction {
  text: string;
  style?: 'default' | 'cancel' | 'destructive';
  onPress?: () => void;
}

export interface AlertState {
  visible: boolean;
  title: string;
  message: string;
  actions: AlertAction[];
}

const defaultAlertState: AlertState = {
  visible: false,
  title: '',
  message: '',
  actions: [],
};

// --- Slices ---

interface AlertSlice {
  alert: AlertState;
  setAlert: (val: AlertState) => void;
  hideAlert: () => void;
}

const createAlertSlice: SliceCreator<AlertSlice> = (set, get) => ({
  alert: defaultAlertState,
  setAlert: (val) => set({ alert: val }),
  hideAlert: () => set({ alert: { ...get().alert, visible: false } }),
});

interface AuthSlice {
  authToken: string | null;
  setAuthToken: (val: string | null) => void;
}

const createAuthSlice: SliceCreator<AuthSlice> = (set) => ({
  authToken: null,
  setAuthToken: (val) => set({ authToken: val }),
});

type GlobalState = AlertSlice & AuthSlice;

export const globalStore = create<GlobalState>()((set, get, api) => ({
  ...createAlertSlice(set, get, api),
  ...createAuthSlice(set, get, api),
}));

export const alertVar = (val?: AlertState) => {
  if (val !== undefined) globalStore.getState().setAlert(val);
  return globalStore.getState().alert;
};

export const useAlert = () => globalStore((s) => s.alert);

export const showAlert = (title: string, message: string, actions?: AlertAction[]) => {
  alertVar({
    visible: true,
    title,
    message,
    actions: actions || [{ text: t('common.ok', { defaultValue: 'OK' }) }],
  });
};

export const hideAlert = () => globalStore.getState().hideAlert();

export const authTokenVar = (val?: string | null) => {
  if (val !== undefined) globalStore.getState().setAuthToken(val);
  return globalStore.getState().authToken;
};

export const useAuthToken = () => globalStore((s) => s.authToken);
