import {
  IClockManager,
  IClockSource,
  ClockLookup,
  SMPTE,
  FrameRate,
  MessageClockList,
  ManagerIdentifier,
  ClockIdentifier,
  //@ts-ignore
} from "@coderatparadise/showrunner-time";
import { EventEmitter } from "events";
import {
  AsyncUtils,
  DispatchInfo,
  DispatchReturn,
  NetworkConnection,
  Service,
  serviceManager,
  //@ts-ignore
} from "@coderatparadise/showrunner-network";
import { VideoCtrlData } from "./VideoCtrlData";
import { AmpChannelService, AmpVideoData } from "./amp/AmpChannelService";
//@ts-ignore
import { AmpCommand, CommandReturn } from "@coderatparadise/amp-grassvalley";
import { ManagerEvents } from "./ManagerRegistry";
import { CurrentCtrlClock } from "./CurrentCtrlClock";
import { CurrentChapterClock } from "./CurrentChapterClock";

export class VideoManager implements IClockManager<VideoCtrlData | unknown> {
  constructor(
    identifier: ManagerIdentifier,
    settings: { name: string; frameRate: FrameRate }
  ) {
    this.m_channel = identifier;
    this.m_settings = settings;
    this.add(new CurrentCtrlClock(this));
    this.add(new CurrentChapterClock(this));
  }

  identifier(): ManagerIdentifier {
    return this.m_channel;
  }

  name(): string {
    return this.m_settings.name;
  }

  async cue(id: ClockIdentifier): Promise<boolean> {
    const clock = this.request(id);
    if (!clock) return await AsyncUtils.booleanReturn(false);
    return await clock.cue();
  }

  async uncue(id: ClockIdentifier): Promise<boolean> {
    const clock = this.request(id);
    if (!clock) return await AsyncUtils.booleanReturn(false);
    return await clock.uncue();
  }

  async play(id: ClockIdentifier): Promise<boolean> {
    const clock = this.request(id);
    if (!clock) return await AsyncUtils.booleanReturn(false);
    return await clock.play();
  }

  async pause(id: ClockIdentifier): Promise<boolean> {
    const clock = this.request(id);
    if (!clock) return await AsyncUtils.booleanReturn(false);
    return await clock.pause(false);
  }

  async stop(id: ClockIdentifier): Promise<boolean> {
    const clock = this.request(id);
    if (!clock) return await AsyncUtils.booleanReturn(false);
    return await clock.stop(false);
  }

  async recue(id: ClockIdentifier): Promise<boolean> {
    const clock = this.request(id);
    if (!clock) return await AsyncUtils.booleanReturn(false);
    return await clock.recue(false);
  }

  async setTime(id: ClockIdentifier, time: SMPTE): Promise<boolean> {
    const clock = this.request(id);
    if (!clock) return await AsyncUtils.booleanReturn(false);
    return await clock.setTime(time);
  }

  request(
    id: ClockIdentifier
  ): IClockSource<VideoCtrlData | unknown> | undefined {
    return this.m_videos.get(id.toString());
  }

  list(filter: string | string[]): ClockLookup[] {
    if (filter.length === 0) return Array.from(this.m_videos.keys());
    return Array.from(this.m_videos.keys()).filter((key) => {
      const type = new ClockIdentifier(key).type();
      if (filter as string) return type === filter;
      else if (filter as string[]) {
        (filter as string[]).forEach((s) => type === s);
      }
    });
  }

  add(clock: IClockSource<any>): boolean {
    const id: ClockLookup = clock.identifier().toString();
    this.m_videos.set(id, clock);
    this.dispatch({ type: MessageClockList, handler: "event" });
    return this.m_videos.has(id);
  }
  remove(id: ClockLookup): boolean {
    this.dispatch({ type: MessageClockList, handler: "event" });
    return this.m_videos.delete(id);
  }

  startUpdating(
    id: ClockIdentifier,
    updateFunction: () => Promise<void>
  ): void {
    this.m_updateFunctions.set(id.toString(), updateFunction);
  }

  stopUpdating(id: ClockIdentifier): void {
    const index = this.m_updateFunctions.has(id.toString());
    if (index) this.m_updateFunctions.delete(id.toString());
  }

  update() {
    for (const _fn of this.m_updateFunctions.values()) _fn();
  }

  frameRate(): FrameRate {
    return this.m_settings.frameRate;
  }

  async chapters(id: ClockIdentifier): Promise<ClockIdentifier[]> {
    const owner: IClockSource<unknown> | undefined = this.request(id);
    if (owner) return await owner.chapters();

    return await AsyncUtils.typeReturn<ClockIdentifier[]>([]);
  }

  async addChapter(
    id: ClockIdentifier,
    chapter: ClockIdentifier
  ): Promise<boolean> {
    const owner: IClockSource<unknown> | undefined = this.request(id);
    if (owner) return await owner.addChapter(chapter);
    return await AsyncUtils.booleanReturn(false);
  }

  async removeChapter(
    id: ClockIdentifier,
    chapter: ClockIdentifier
  ): Promise<boolean> {
    const owner: IClockSource<unknown> | undefined = this.request(id);
    if (owner) return await owner.removeChapter(chapter);
    return await AsyncUtils.booleanReturn(false);
  }

  _sortChapters(id: ClockIdentifier) {
    const owner: IClockSource<unknown> | undefined = this.request(id);
    if (owner) owner._sortChapters();
  }

  addConnection(
    type: string,
    connection: Service<any, NetworkConnection>
  ): void {
    serviceManager.registerSource(connection as Service<any, unknown>);
    if (this.connections(type) !== undefined)
      this.connections(type)?.push(connection);
    else this.m_connections.set(type, [connection]);
    serviceManager.openSource(connection.identifier());
  }

  async removeConnection(type: string, index: number): Promise<void> {
    const connections = this.connections(type);
    if (connections) {
      const connection = connections.at(index);
      if (connection) {
        if (await connection.close()) {
          serviceManager.removeSource(connection.identifier());
          connections.splice(index, 1);
        }
      }
    }
  }

  connectionTypes(): string[] {
    return Array.from(this.m_connections.keys());
  }

  connections(type: string): Service<unknown, NetworkConnection>[] | undefined {
    return this.m_connections.get(type);
  }

  // TODO overhaul to make more generic
  sendCommand(
    command: AmpCommand, // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data?: { byteCount?: string; commandCode?: string; data?: any }
  ): Promise<CommandReturn> {
    let ret: Promise<CommandReturn> | undefined = undefined;
    for (const connection of this.connections("amp") as AmpChannelService[]) {
      if (connection.isOpen()) {
        if (ret === undefined) {
          ret = connection.get().sendCommand(command, data);
        } else {
          void connection.get().sendCommand(command, data);
        }
      }
    }
    if (ret === undefined)
      ret = new Promise<CommandReturn>(() => {
        return { code: "-1" };
      });
    return ret;
  }

  // TODO overhaul to make more generic
  cache(): Map<string, AmpVideoData> {
    for (const connection of this.connections("amp") as AmpChannelService[]) {
      if (connection.isOpen())
        return connection.data("cache") as Map<string, AmpVideoData>;
    }
    return new Map<string, AmpVideoData>();
  }

  current(): { id: ClockIdentifier | undefined; time: SMPTE } {
    for (const connection of this.connections("amp") as AmpChannelService[]) {
      if (connection.isOpen()) {
        const current = connection.data("current") as {
          id: string;
          time: SMPTE;
        };
        return {
          id: new ClockIdentifier(
            this.identifier(),
            current.id,
            "ampvideoctrl"
          ),
          time: current.time,
        };
      }
    }
    return { id: undefined, time: SMPTE.INVALID };
  }

  setRehearsalMode(rehearsal: boolean): void {
    this.m_tally.rehearsal = rehearsal;
    ManagerEvents.emit("manager.tally");
  }

  tally(): { rehearsal: boolean; preview: boolean; program: boolean } {
    return this.m_tally;
  }

  cueLock(owner: string, lock: boolean): boolean {
    if (this.m_cueLock.locked && owner != this.m_cueLock.owner) return false;
    if (lock) {
      this.m_cueLock.locked = true;
      this.m_cueLock.owner = owner;
      return true;
    } else {
      this.m_cueLock.locked = false;
      this.m_cueLock.owner = "";
      return true;
    }
  }

  /* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment */
  async dispatch(
    dispatchInfo: DispatchInfo,
    ...args: any
  ): Promise<DispatchReturn> {
    if (dispatchInfo.handler === "event") {
      this.m_eventHandler.emit(dispatchInfo.type, {
        type: dispatchInfo.type,
        ret: [...args],
      });
    }

    return { type: "invalid:invalid", ret: [] };
  }
  /* eslint-enable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment */

  listen(
    dispatchInfo: DispatchInfo,
    // eslint-disable-next-line no-unused-vars
    f: (dispatch: DispatchReturn) => void
  ): void {
    if (dispatchInfo.handler === "event") {
      this.m_eventHandler.on(dispatchInfo.type, f);
    }
  }

  stopListening(
    dispatchInfo: DispatchInfo,
    // eslint-disable-next-line no-unused-vars
    f: (dispatch: DispatchReturn) => void
  ): void {
    if (dispatchInfo.handler === "event") {
      this.m_eventHandler.off(dispatchInfo.type, f);
    }
  }

  private m_channel: ManagerIdentifier;
  private m_videos: Map<ClockLookup, IClockSource<VideoCtrlData | unknown>> =
    new Map<ClockLookup, IClockSource<VideoCtrlData | unknown>>();
  private m_updateFunctions: Map<ClockLookup, () => Promise<void>> = new Map<
    ClockLookup,
    () => Promise<void>
  >();
  private m_eventHandler: EventEmitter = new EventEmitter();
  private m_settings: { name: string; frameRate: FrameRate };
  private m_connections: Map<string, Service<unknown, NetworkConnection>[]> =
    new Map<string, Service<unknown, NetworkConnection>[]>();
  private m_tally: { rehearsal: boolean; preview: boolean; program: boolean } =
    { rehearsal: true, preview: false, program: false };
  private m_cueLock: { owner: string; locked: boolean } = {
    owner: "",
    locked: false,
  };
}
