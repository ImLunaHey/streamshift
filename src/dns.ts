import { Packet, createServer } from 'dns2';
import { resolve } from 'dns';
import { isIPv4, isIPv6 } from 'net';
import { logger } from './logger';
import { localIpAddress } from './local-ip';

let isConnected = false;

// Wait 30 seconds before logging a warning
setTimeout(() => {
  if (!isConnected) {
    logger.error('Make sure your PS4 is connected to the internet and that the DNS settings are correct');
    logger.info('Your DNS server should be set to', localIpAddress);
  }
}, 30_000);

const dnsServer = createServer({
  udp: true,
  handle: (request, send, rinfo) => {
    const response = Packet.createResponseFromRequest(request);
    const [question] = request.questions;
    const { name } = question;

    // Mark the console as connected after the first DNS request
    if (!isConnected) {
      logger.info('Console connected');
      isConnected = true;
    }

    // Intercept Twitch's ingest server
    if (name.endsWith('.contribute.live-video.net')) {
      response.answers.push({
        name: name,
        type: Packet.TYPE.A,
        class: Packet.CLASS.IN,
        ttl: 300,
        address: localIpAddress,
      });
      send(response);
      return;
    }

    // Intercept Twitch's IRC server
    if (name === 'irc.twitch.tv') {
      response.answers.push({
        name: name,
        type: Packet.TYPE.A,
        class: Packet.CLASS.IN,
        ttl: 300,
        address: localIpAddress,
      });
      send(response);
      return;
    }

    // For all other requests, use real DNS resolution
    resolve(name, (err, addresses_) => {
      const addresses = addresses_ as unknown as {
        address: string;
        family: number;
        ttl: number;
      }[];
      if (err) {
        logger.error(err);
        return;
      }
      for (const { address } of addresses) {
        logger.debug(`Resolved ${name}`, address);

        // Check if the address is a valid IPv4 address
        if (isIPv4(address)) {
          response.answers.push({
            name,
            type: Packet.TYPE.A,
            class: Packet.CLASS.IN,
            ttl: 300,
            address,
          });
          send(response);
          return;
        }

        // Check if the address is a valid IPv6 address
        if (isIPv6(address)) {
          response.answers.push({
            name,
            type: Packet.TYPE.AAAA,
            class: Packet.CLASS.IN,
            ttl: 300,
            address,
          });
          send(response);
          return;
        }
      }
    });
  },
});

export const startDns = () => {
  dnsServer.listen({
    udp: { port: 53, address: '0.0.0.0' },
  });

  logger.info('Waiting for your console to connect...');
};
