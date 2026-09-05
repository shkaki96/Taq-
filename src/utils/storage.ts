import i18n from '../i18n';

export const safeSetItem = (key: string, value: string): boolean => {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (error) {
    console.error('localStorage error:', error);
    alert(i18n.t('common.storageFullWarning') as string);
    return false;
  }
};

export const safeGetItem = (key: string): string | null => {
  try {
    return localStorage.getItem(key);
  } catch (error) {
    console.error('localStorage get error:', error);
    return null;
  }
};
