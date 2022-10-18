import type { AppRouter } from "server/routers/app.js";
import {
  createWSClient,
  httpBatchLink,
  httpLink,
  Operation,
  splitLink,
  wsLink,
} from "@trpc/react";
import {createTRPCProxyClient} from "@trpc/client";

export function getEndingLink() {
  if (typeof window === `undefined`) {
    return splitLink({
      condition(op: Operation<unknown>) {
        return op.context.skipBatch === true;
      },
      true: httpLink({
        url: `http://video-showrunner.local:3001/api/trpc`,
      }),
      false: httpBatchLink({
        url: `http://video-showrunner.local:3001/api/trpc`,
        maxURLLength: 2083,
      }),
    });
  }
  const client = createWSClient({ url: "ws://video-showrunner.local:3001" });
  return wsLink<AppRouter>({ client });
}

export const trpcClient = createTRPCProxyClient<AppRouter>({
  links: [getEndingLink()],
});
