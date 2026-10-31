const vibrate = (ms: number) => {
  try {
    navigator.vibrate?.(ms);
  } catch {
    /* not supported */
  }
};

export const tapLight = () => vibrate(8);
export const tapMedium = () => vibrate(16);
