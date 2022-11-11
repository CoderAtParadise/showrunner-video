// @ts-ignore
process.env.NODE_ENV = "production"; // Force to production mode
import { appRouter } from "./routers/app";
import { applyWSSHandler } from "@trpc/server/adapters/ws";
import http from "http";
import next from "next";
import { parse } from "url";
import ws from "ws";
import { loadChannels } from "./channel/ChannelLoader";
//@ts-ignore
import { Codec } from "@coderatparadise/showrunner-time";

const port = parseInt(process.env.PORT || "3000", 10);
const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

import EventEmitter from "events";
import multicast from "multicast-dns";
import ip from "ip";
EventEmitter.setMaxListeners(0); // We add event listeners for every subscription is this wise proabably not but ehh we are doing it and that is why we uncue videos
if (!process.env.DOCKER_ENV) {
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
}

app.prepare().then(() => {
  Codec.registerCodecs();
  loadChannels();
  const server = http.createServer((req, res) => {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const parsedUrl = parse(req.url!, true);
    handle(req, res, parsedUrl);
  });

  // eslint-disable-next-line no-unused-vars
  const wss = new ws.Server({ server });
  // wss.on("error",console.error);
  const handler = applyWSSHandler({ wss, router: appRouter });

  process.on("SIGTERM", () => {
    console.log("SIGTERM");
    handler.broadcastReconnectNotification();
  });
  server.listen(port);

  // tslint:disable-next-line:no-console
  console.log(
    `> Server listening at http://localhost:${port} as ${
      dev ? "development" : process.env.NODE_ENV
    }`
  );
});
