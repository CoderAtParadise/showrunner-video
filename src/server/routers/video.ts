import { TRPCError } from "@trpc/server";
import { observable } from "@trpc/server/observable";
import { trpc } from "../trpc";
import {
  getManager,
  listManagers,
  ManagerEvents,
} from "../channel/ManagerRegistry";
import { z } from "zod";
import { VideoManager } from "server/channel/VideoManager";
//@ts-ignore
import { ManagerIdentifier, ManagerLookup } from "@coderatparadise/showrunner-time";

export const videoRouter = trpc.router({
  listManagers: trpc.procedure.subscription(() => {
    return observable<{ id: string; name: string }[]>((emit) => {
      const onAdd = async () => {
        const managers = await listManagers();
        const data: { id: ManagerLookup; name: string }[] = [];
        managers.forEach((manager: VideoManager) =>
          data.push({
            id: 
              manager.identifier().toString(),
            name: manager.name(),
          })
        );
        emit.next(data);
      };
      onAdd();
      ManagerEvents.addListener("manager.list", onAdd);
      return () => {
        ManagerEvents.removeListener("manager.list", onAdd);
      };
    });
  }),
  managerExists: trpc.procedure
    .input(z.string())
    .output(z.boolean())
    .query(async ({ input }) => {
      const manager = await getManager(new ManagerIdentifier(input));
      return manager !== undefined;
    }),
  managerName: trpc.procedure
    .input(z.string())
    .output(z.string())
    .query(async ({ input }) => {
      const manager = await getManager(new ManagerIdentifier(input));
      if (!manager)
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Failed to find manager`,
        });
      return manager.name();
    }),
  setRehearsalMode: trpc.procedure
    .input(z.object({ identifier: z.string(), rehearsal: z.boolean() }))
    .mutation(async ({ input }) => {
      const manager = await getManager(new ManagerIdentifier(input.identifier));
      if (!manager)
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Failed to find manager`,
        });
      manager.setRehearsalMode(input.rehearsal);
    }),
  tally: trpc.procedure.input(z.string()).subscription(async ({ input }) => {
    const manager = await getManager(new ManagerIdentifier(input));
    if (!manager)
      throw new TRPCError({
        code: "NOT_FOUND",
        message: `Failed to find manager`,
      });
    return observable<{
      rehearsal: boolean;
      preview: boolean;
      program: boolean;
    }>((emit) => {
      const tally = async () => {
        emit.next(manager.tally());
      };
      tally();
      ManagerEvents.addListener("manager.tally", tally);
      return () => {
        ManagerEvents.removeListener("manager.tally", tally);
      };
    });
  }),
});

export type VideoRouter = typeof videoRouter;
