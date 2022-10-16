export const booleanReturn = async (ret: boolean) => Promise.resolve(ret);
export const voidReturn = async () => Promise.resolve();
export const typeReturn = async <T>(ret: T) => Promise.resolve(ret);
