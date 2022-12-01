import { TRPCError } from "@trpc/server";
import {
  IClockManager,
  ClockLookup,
  MessageClockData,
  MessageClockCurrent,
  IClockSource,
  MessageClockConfig,
  MessageClockList,
  BaseClockConfig,
  SMPTE,
  ClockStatus,
  ClockIdentifier,
  ManagerIdentifier,
  MessageClockChapter,
  //@ts-ignore
} from "@coderatparadise/showrunner-time";
import { trpc } from "../trpc";
import { z } from "zod";
import { observable } from "@trpc/server/observable";
//@ts-ignore
import { codec, DispatchReturn } from "@coderatparadise/showrunner-network";
//@ts-ignore
import { Codec } from "@coderatparadise/showrunner-time";

export function getClockRouter(
  // eslint-disable-next-line no-unused-vars
  manager: (lookup: ManagerIdentifier) => Promise<IClockManager | undefined>
): any {
  const router = trpc.router({
    cue: trpc.procedure
      .input(z.string())
      .output(z.boolean())
      .mutation(async ({ input }) => {
        const _manager = await manager(new ManagerIdentifier(input));
        if (!_manager)
          throw new TRPCError({
            code: "NOT_FOUND",
            message: `Failed to find manager`,
          });
        return await _manager.cue(new ClockIdentifier(input));
      }),
    uncue: trpc.procedure
      .input(z.string())
      .output(z.boolean())
      .mutation(async ({ input }) => {
        const _manager = await manager(new ManagerIdentifier(input));
        if (!_manager)
          throw new TRPCError({
            code: "NOT_FOUND",
            message: `Failed to find manager`,
          });
        return await _manager.uncue(new ClockIdentifier(input));
      }),
    play: trpc.procedure
      .input(z.string())
      .output(z.boolean())
      .mutation(async ({ input }) => {
        const _manager = await manager(new ManagerIdentifier(input));
        if (!_manager)
          throw new TRPCError({
            code: "NOT_FOUND",
            message: `Failed to find manager`,
          });
        return await _manager.play(new ClockIdentifier(input));
      }),
    pause: trpc.procedure
      .input(
        z.object({
          lookup: z.string(),
          override: z.boolean(),
        })
      )
      .output(z.boolean())
      .mutation(async ({ input }) => {
        const _manager = await manager(new ManagerIdentifier(input.lookup));
        if (!_manager)
          throw new TRPCError({
            code: "NOT_FOUND",
            message: `Failed to find manager`,
          });
        return await _manager.pause(
          new ClockIdentifier(input.lookup),
          input.override
        );
      }),
    stop: trpc.procedure
      .input(
        z.object({
          lookup: z.string(),
          override: z.boolean(),
        })
      )
      .output(z.boolean())
      .mutation(async ({ input }) => {
        const _manager = await manager(new ManagerIdentifier(input.lookup));
        if (!_manager)
          throw new TRPCError({
            code: "NOT_FOUND",
            message: `Failed to find manager`,
          });
        return await _manager.stop(
          new ClockIdentifier(input.lookup),
          input.override
        );
      }),
    recue: trpc.procedure
      .input(
        z.object({
          lookup: z.string(),
          override: z.boolean(),
        })
      )
      .output(z.boolean())
      .mutation(async ({ input }) => {
        const _manager = await manager(new ManagerIdentifier(input.lookup));
        if (!_manager)
          throw new TRPCError({
            code: "NOT_FOUND",
            message: `Failed to find manager`,
          });
        return await _manager.recue(
          new ClockIdentifier(input.lookup),
          input.override
        );
      }),
    setTime: trpc.procedure
      .input(
        z.object({
          lookup: z.string(),
          time: z.string(),
        })
      )
      .output(z.boolean())
      .mutation(async ({ input }) => {
        const _manager = await manager(new ManagerIdentifier(input.lookup));
        if (!_manager)
          throw new TRPCError({
            code: "NOT_FOUND",
            message: `Failed to find manager`,
          });
        const clock = await _manager.request(new ClockIdentifier(input.lookup));
        if (clock?.status() === ClockStatus.RUNNING) {
          const timeSet = await _manager.setTime(
            new ClockIdentifier(input.lookup),
            new SMPTE(input.time)
          );
          if (timeSet)
            return await _manager.play(new ClockIdentifier(input.lookup));
        }
        return await _manager.setTime(
          new ClockIdentifier(input.lookup),
          new SMPTE(input.time)
        );
      }),
    data: trpc.procedure.input(z.string()).subscription(async ({ input }) => {
      const _manager = await manager(new ManagerIdentifier(input));
      if (!_manager)
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Failed to find manager`,
        });
      const clock = _manager.request(new ClockIdentifier(input));
      if (!clock)
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Failed to find a clock with id: ${input}`,
        });
      return observable<Codec.AdditionalData>((emit) => {
        const onUpdate = () => {
          const data = (
            codec.getCodec("sync_clock_data") as codec.Codec<IClockSource>
          ).serialize(clock) as Codec.AdditionalData;
          emit.next(data);
        };
        onUpdate();
        _manager?.listen(
          { type: MessageClockData, handler: "event" },
          onUpdate
        );
        return () => {
          _manager?.stopListening(
            { type: MessageClockData, handler: "event" },
            onUpdate
          );
        };
      });
    }),
    current: trpc.procedure
      .input(z.string())
      .subscription(async ({ input }) => {
        const _manager = await manager(new ManagerIdentifier(input));
        if (!_manager)
          throw new TRPCError({
            code: "NOT_FOUND",
            message: `Failed to find manager`,
          });
        const clock = _manager.request(new ClockIdentifier(input));
        if (!clock)
          throw new TRPCError({
            code: "NOT_FOUND",
            message: `Failed to find a clock with id: ${input}`,
          });
        return observable<Codec.CurrentClockState>((emit) => {
          const onUpdate = () => {
            const data = (
              codec.getCodec("sync_clock_current") as codec.Codec<IClockSource>
            ).serialize(clock) as Codec.CurrentClockState;
            emit.next(data);
          };
          onUpdate();
          _manager.listen(
            { type: MessageClockCurrent, handler: "event" },
            onUpdate
          );
          return () => {
            _manager.stopListening(
              { type: MessageClockCurrent, handler: "event" },
              onUpdate
            );
          };
        });
      }),
    config: trpc.procedure.input(z.string()).subscription(async ({ input }) => {
      const _manager = await manager(new ManagerIdentifier(input));
      if (!_manager)
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Failed to find manager`,
        });
      const clock = _manager.request(new ClockIdentifier(input));
      if (!clock)
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Failed to find a clock with id: ${input}`,
        });
      return observable<BaseClockConfig & unknown>((emit) => {
        /* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment */
        const onUpdate = () => {
          const data = (
            codec.getCodec("sync_clock_config") as codec.Codec<IClockSource>
          ).serialize(clock) as BaseClockConfig & unknown;
          emit.next(data);
        };
        onUpdate();
        /* eslint-enable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment */
        _manager.listen(
          { type: MessageClockConfig, handler: "event" },
          onUpdate
        );
        return () => {
          _manager.stopListening(
            { type: MessageClockConfig, handler: "event" },
            onUpdate
          );
        };
      });
    }),
    updateConfig: trpc.procedure
      .input(z.object({ lookup: z.string() }).passthrough())
      .output(z.void())
      .mutation(async ({ input }) => {
        const _manager = await manager(new ManagerIdentifier(input.lookup));
        if (!_manager)
          throw new TRPCError({
            code: "NOT_FOUND",
            message: `Failed to find manager`,
          });
        const clock = _manager.request(new ClockIdentifier(input.lookup));
        if (!clock)
          throw new TRPCError({
            code: "NOT_FOUND",
            message: `Failed to find a clock with id: ${input.lookup}`,
          });
        const config = codec.getCodec(
          "sync_clock_config"
        ) as codec.Codec<IClockSource>;
        config.deserialize(input, clock);
      }),
    list: trpc.procedure
      .input(
        z.object({
          lookup: z.string(),
          filter: z.string().or(z.array(z.string())),
        })
      )
      .subscription(async ({ input }) => {
        const _manager = await manager(new ManagerIdentifier(input.lookup));
        if (!_manager)
          throw new TRPCError({
            code: "NOT_FOUND",
            message: `Failed to find manager`,
          });
        return observable<string[]>((emit) => {
          emit.next(_manager.list(input.filter));
          const onUpdate = () => {
            emit.next(_manager.list(input.filter));
          };
          _manager.listen(
            { type: MessageClockList, handler: "event" },
            onUpdate
          );
          return () => {
            _manager.stopListening(
              { type: MessageClockList, handler: "event" },
              onUpdate
            );
          };
        });
      }),
    create: trpc.procedure
      .input(
        z
          .object({
            lookup: z.string(),
            name: z.string(),
            type: z.string(),
          })
          .passthrough()
      )
      .mutation(async ({ input }) => {
        const _manager = await manager(new ManagerIdentifier(input.lookup));
        if (!_manager)
          throw new TRPCError({
            code: "NOT_FOUND",
            message: `Failed to find manager`,
          });
        const clock = (
          codec.getCodec("sync_create_clock") as codec.Codec<IClockSource>
        ).deserialize(input);
        if (!_manager.add(clock))
          throw new TRPCError({
            message: `Unable to create clock: ${input.type}:${input.name}`,
            code: "PARSE_ERROR",
          });
        void _manager.dispatch(
          { type: MessageClockList, handler: "event" },
          _manager.identifier()
        );
      }),
    remove: trpc.procedure.input(z.string()).mutation(async ({ input }) => {
      const _manager = await manager(new ManagerIdentifier(input));
      if (!_manager)
        throw new TRPCError({
          code: "NOT_FOUND",
          message: `Failed to find manager`,
        });
      if (_manager.remove(input as ClockLookup))
        throw new TRPCError({
          message: `Unable to delete clock: ${input}`,
          code: "NOT_FOUND",
        });
      void _manager.dispatch(
        { type: MessageClockList, handler: "event" },
        _manager.identifier()
      );
    }),
    chapters: trpc.procedure
      .input(z.string())
      .subscription(async ({ input }) => {
        const _manager = await manager(new ManagerIdentifier(input));
        if (!_manager)
          throw new TRPCError({
            code: "NOT_FOUND",
            message: `Failed to find manager`,
          });
        return observable<string[]>((emit) => {
          const onUpdate = async (ret: DispatchReturn) => {
            if (ret.ret.toString() === input) {
              const chapters = await (
                await _manager.chapters(new ClockIdentifier(input))
              ).map<string>((chapter: ClockIdentifier) => chapter.toString());
              emit.next(chapters);
            }
          };
          onUpdate({
            type: MessageClockChapter,
            ret: new ClockIdentifier(input),
          });
          _manager.listen(
            { type: MessageClockChapter, handler: "event" },
            onUpdate
          );
          return () => {
            _manager.stopListening(
              { type: MessageClockChapter, handler: "event" },
              onUpdate
            );
          };
        });
      })
  });
  return router;
}
