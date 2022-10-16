import { TRPCError } from "@trpc/server";
import { observable } from "@trpc/server/observable";
import { trpc } from "../trpc";
import { getManager, listManagers, ManagerEvents } from "../ManagerRegistry";
import { VideoManager } from "../VideoManager";
import { z } from "zod";
//@ts-ignore
import { ControlMode } from "@coderatparadise/showrunner-time";

export const videoRouter = trpc.router({
  listManagers: trpc.procedure.subscription(() => {
    return observable<{ id: string; name: string }[]>((emit) => {
      const onAdd = async () => {
        const managers = await listManagers();
        const data: { id: string; name: string }[] = [];
        managers.forEach((manager: VideoManager) =>
          data.push({ id: manager.id(), name: manager.name() })
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
      const manager = await getManager(input);
      return manager !== undefined;
    }),
  managerName: trpc.procedure
    .input(z.string())
    .output(z.string())
    .query(async ({ input }) => {
      const manager = await getManager(input);
      if (!manager)
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Failed to find manager`,
        });
      return manager.name();
    }),
  controlMode: trpc.procedure
    .input(z.string())
    .subscription(async ({ input }) => {
      const manager = await getManager(input);
      if (!manager)
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Failed to find manager`,
        });
      return observable<string>((emit) => {
        const onControlModeChange = async (mId) => {
          if (mId === input) {
            emit.next(manager.controlMode() as string);
          }
        };
        onControlModeChange(input);
        ManagerEvents.addListener("manager.mode", onControlModeChange);

        return () => {
          ManagerEvents.removeListener("manager.mode", onControlModeChange);
        };
      });
    }),
  setControlMode: trpc.procedure
    .input(z.object({ id: z.string(), controlMode: z.string() }))
    .mutation(async ({ input }) => {
      const manager = await getManager(input.id);
      if (!manager)
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Failed to find manager`,
        });
      return await manager.setControlMode(input.controlMode as ControlMode);
    }),
});

export type VideoRouter = typeof videoRouter;
