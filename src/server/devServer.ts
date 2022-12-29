import { createContext } from "./context.js";
import { appRouter } from "./routers/app.js";
import { applyWSSHandler } from "@trpc/server/adapters/ws";
import ws from "ws";
import { loadChannels } from "./channel/ChannelLoader.js";
//@ts-ignore
import { Codec } from "@coderatparadise/showrunner-time";
import EventEmitter from "events";
import multicast from "multicast-dns";
import ip from "ip";
//@ts-ignore
import { registerCodec } from "@coderatparadise/showrunner-network/codec";
import { AmpConnectionCodec } from "./channel/amp/AmpConnectionCodec.js";
import { CodecDataCurrent } from "./channel/codec/CodecDataCurrent.js";
EventEmitter.setMaxListeners(0); // We add event listeners for every subscription is this wise proabably not but ehh we are doing it and that is why we uncue videos
const mdns = multicast();

mdns.on("query", function (query) {
  // iterate over all questions to check if we should respond
  query.questions.forEach(function (q) {
    if (q.type === "A" && q.name === "video-showrunner.local") {
      // send an A-record response for example.local
      mdns.respond({
        answers: [
          {
            name: "video-showrunner.local",
            type: "A",
            ttl: 300,
            data: ip.address(),
          },
        ],
      });
    }
  });
});
mdns.query({
  questions: [
    {
      name: "video-showrunner.local",
      type: "A",
    },
  ],
});

if (!global.fetch) {
  //eslint-disable
  (global as any).fetch = import("node-fetch");
}
Codec.registerCodecs();
registerCodec("connection:amp", AmpConnectionCodec);
registerCodec("sync_clock_data_current",CodecDataCurrent);
loadChannels();
const wss = new ws.Server({ port: 3001 });

const handler = applyWSSHandler({ wss, router: appRouter, createContext });

wss.on("connection", (ws) => {
  console.log(`➕➕ Connection (${wss.clients.size})`);
  ws.once("close", () => {
    console.log(`➖➖ Connection (${wss.clients.size})`);
  });
});
console.log("✅ WebSocket Server listening on ws://localhost:3001");

process.on("SIGTERM", () => {
  console.log("SIGTERM");
  handler.broadcastReconnectNotification();
  wss.close();
});
