import { startDns } from "./dns";
import { startIrcProxy } from "./irc";
import { startRtmpServer } from "./rtmp";

startDns();
startIrcProxy();
startRtmpServer();
