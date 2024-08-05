import { networkInterfaces } from 'os';

const getLocalIpAddress = (): string => {
  const interfaces = networkInterfaces();
  for (const devName in interfaces) {
    const iface = interfaces[devName];
    for (const alias of iface!) {
      if (alias.family === 'IPv4' && !alias.internal) {
        return alias.address;
      }
    }
  }
  throw new Error('Unable to determine local IP address');
};

export const localIpAddress = getLocalIpAddress();
