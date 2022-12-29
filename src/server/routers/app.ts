import { trpc } from "../trpc";
import { getManager } from "../channel/ManagerRegistry";
import { videoRouter } from "./video";
import { getClockRouter } from "./clock";
import {
  ManagerIdentifier,
  //@ts-ignore
} from "@coderatparadise/showrunner-time";

const clockRouter = getClockRouter(async (channel: ManagerIdentifier) => {
  return await getManager(new ManagerIdentifier(channel));
});

export const appRouter = trpc.mergeRouters(clockRouter, videoRouter);
//@ts-ignore: How is this circular referencing
export type AppRouter = typeof appRouter;
