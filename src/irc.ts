import net from "net";
import { logger } from "./logger";

const LOCAL_PORT = 6667;
const TWITCH_IRC_SERVER = "irc.chat.twitch.tv";
const TWITCH_IRC_PORT = 6667;

class Client {
  socket: net.Socket;
  twitchSocket: net.Socket | null;

  constructor(socket: net.Socket) {
    this.socket = socket;
    this.twitchSocket = null;
  }

  connectToTwitch() {
    this.twitchSocket = net.createConnection(
      {
        host: TWITCH_IRC_SERVER,
        port: TWITCH_IRC_PORT,
      },
      () => {
        logger.debug("Connected to Twitch IRC");
      }
    );

    this.twitchSocket.on("data", (data) => {
      logger.debug("Twitch -> PS4:", data.toString().trim());
      this.socket.write(data);
    });

    this.twitchSocket.on("error", (err) => {
      logger.error("Error on Twitch connection:", err);
    });

    this.twitchSocket.on("close", () => {
      logger.debug("Disconnected from Twitch IRC");
      this.socket.destroy();
    });

    // Forward all data from PS4 to Twitch
    this.socket.on("data", (data) => {
      logger.debug("PS4 -> Twitch:", data.toString().trim());
      if (this.twitchSocket) {
        this.twitchSocket.write(data);
      }
    });
  }
}

export const startIrcProxy = () => {
  const server = net.createServer((socket) => {
    logger.debug("PS4 connected to proxy");
    const client = new Client(socket);
    client.connectToTwitch();

    socket.on("error", (err) => {
      logger.error("Error on PS4 connection:", err);
    });

    socket.on("close", () => {
      logger.debug("PS4 disconnected");
      if (client.twitchSocket) {
        client.twitchSocket.destroy();
      }
    });
  });
  server.listen(LOCAL_PORT, "0.0.0.0", () => {
    logger.debug(`IRC proxy server running on port ${LOCAL_PORT}`);
  });
};
