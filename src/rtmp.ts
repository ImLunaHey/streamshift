import NodeMediaServer from 'node-media-server';
import { logger } from './logger';
import { localIpAddress } from './local-ip';

const nms = new NodeMediaServer({
  rtmp: {
    port: 1935,
    ping: 30,
    ping_timeout: 60,
  },
  http: {
    port: 8000,
    allow_origin: '*',
    mediaroot: './media',
  },
  logType: 0,
});

const knownFlashVersions = {
  'PlayStation4 1.0.0.0': 'Playstation 4',
  '*': 'Unknown Device',
} as const;

const connectedDevices = new Map<string, (typeof knownFlashVersions)[keyof typeof knownFlashVersions] | 'Unknown Device'>();

export const startRtmpServer = () => {
  nms.run();

  nms.on('preConnect', (id, args) => {
    const deviceName = knownFlashVersions[args.flashVer as keyof typeof knownFlashVersions] ?? 'Unknown device';
    connectedDevices.set(id, deviceName);
  });

  nms.on('prePublish', (id, streamPath, _args) => {
    const deviceName = connectedDevices.get(id);
    logger.info(`${deviceName} broadcasting at http://${localIpAddress}${streamPath}`);
  });
};
