export const safeSetItem = (key: string, value: string): boolean => {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (error) {
    console.error('localStorage error:', error);
    alert('مساحة التخزين ممتلئة. يرجى حذف بعض الملاحظات القديمة.');
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
