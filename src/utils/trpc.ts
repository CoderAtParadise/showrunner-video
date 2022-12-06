import type { AppRouter } from "server/routers/app.js";
import {
  createTRPCProxyClient,
  createWSClient,
  httpBatchLink,
  httpLink,
  Operation,
  splitLink,
  wsLink,
} from "@trpc/client";

const port = process.env.NODE_ENV === "production" ? 3000 : 3001;

export function getEndingLink() {
  if (typeof window === `undefined`) {
    return splitLink({
      condition(op: Operation<unknown>) {
        return op.context.skipBatch === true;
      },
      true: httpLink({
        url: `http://video-showrunner.local:${port}/api/trpc`,
      }),
      false: httpBatchLink({
        url: `http://video-showrunner.local:${port}/api/trpc`,
        maxURLLength: 2083,
      }),
    });
  }
  const client = createWSClient({ url: `ws://video-showrunner.local:${port}` });
  return wsLink<AppRouter>({ client });
}

export const trpcClient = createTRPCProxyClient<AppRouter>({
  links: [getEndingLink()],
});
