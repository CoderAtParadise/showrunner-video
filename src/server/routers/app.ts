import { trpc } from "../trpc";
import { getManager } from "../ManagerRegistry";
import { videoRouter } from "./video";
import { getClockRouter } from "./clock";
import {
  ClockLookup,
  ClockIdentifier,
  //@ts-ignore
} from "@coderatparadise/showrunner-time";
//@ts-ignore
import { ClockIdentifierCodec } from "@coderatparadise/showrunner-time/codec";

const clockRouter = getClockRouter(async (channel: ClockLookup) => {
  const identifier = ClockIdentifierCodec.deserialize(
    channel
  ) as ClockIdentifier;
  return await getManager(identifier.session);
});

export const appRouter = trpc.mergeRouters(clockRouter, videoRouter);
//@ts-ignore: How is this circular referencing
export type AppRouter = typeof appRouter;
