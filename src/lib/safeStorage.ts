/**
 * Safe browser storage helpers that gracefully handle private/incognito browsing
 * mode or restricted sandbox environments where sessionStorage access is blocked.
 */

export const getSafeSessionItem = (key: string): string | null => {
  try {
    return typeof window !== 'undefined' ? sessionStorage.getItem(key) : null;
  } catch {
    return null;
  }
};

export const setSafeSessionItem = (key: string, value: string): void => {
  try {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(key, value);
    }
  } catch {
    void 0;
  }
};

export const removeSafeSessionItem = (key: string): void => {
  try {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(key);
    }
  } catch {
    void 0;
  }
};

const exchangedCodes = new Set<string>();

export const hasExchangedCode = (code: string): boolean => {
  return exchangedCodes.has(code);
};

export const markCodeExchanged = (code: string): void => {
  exchangedCodes.add(code);
};

export const resetExchangedCodesForTesting = (): void => {
  exchangedCodes.clear();
};
