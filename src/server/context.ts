import * as trpc from "@trpc/server";
import * as trpcNext from "@trpc/server/adapters/next";
import { NodeHTTPCreateContextFnOptions } from "@trpc/server/adapters/node-http";
import { IncomingMessage } from "http";
import ws from "ws";
import { getRegistry } from "./channel/ManagerRegistry";

/**
 * Creates context for an incoming request
 * @link https://trpc.io/docs/context
 */
export const createContext = ({
  req,
  res,
}:
  | trpcNext.CreateNextContextOptions
  | NodeHTTPCreateContextFnOptions<IncomingMessage, ws>) => {
  return {
    req,
    res,
    registry: getRegistry(),
  };
};

export type Context = trpc.inferAsyncReturnType<typeof createContext>;
