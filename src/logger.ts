const isDebug = process.env.DEBUG !== undefined;

export const logger = {
  info: (...args: any[]) => {
    console.info(...args);
  },
  debug: (...args: any[]) => {
    if (isDebug) {
      console.debug(...args);
    }
  },
  error: (...args: any[]) => {
    console.error(...args);
  },
};
