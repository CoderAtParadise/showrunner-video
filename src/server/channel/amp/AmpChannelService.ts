import {
  Command,
  AmpChannel,
  Return,
  returnCodeMatches,
  //@ts-ignore
} from "@coderatparadise/amp-grassvalley";
import { VideoManager } from "../VideoManager.js";
import {
  ChapterClock,
  ClockDirection,
  ClockStatus,
  SMPTE,
  //@ts-ignore
} from "@coderatparadise/showrunner-time";
import {
  Service,
  AsyncUtils,
  ServiceIdentifier,
  NetworkConnection,
  //@ts-ignore
} from "@coderatparadise/showrunner-network";
import { AmpMetadata, extractId, extractMetadata } from "./AmpVideoMetadata";
import { AmpVideoCtrlClock } from "./AmpVideoCtrlClock";
//@ts-ignore
import { ManagerIdentifierCodec } from "@coderatparadise/showrunner-time/codec";
import { loadChapters, saveChapters } from "../ChapterLoader.js";

export type AmpVideoData = {
  id: string;
  name: string;
  in: SMPTE;
  out: SMPTE;
  incorrectFramerate: boolean;
  status: ClockStatus;
  metadata: AmpMetadata;
};

export type AmpConnection = NetworkConnection & {
  channel: string;
};

export class AmpChannelService implements Service<AmpChannel, AmpConnection> {
  constructor(
    id: string,
    manager: VideoManager,
    connectionInfo: AmpConnection
  ) {
    this.m_id = id;
    this.m_manager = manager;
    this.m_connectionInfo = connectionInfo;
    this.m_source = new AmpChannel(
      this.m_connectionInfo.address,
      this.m_connectionInfo.port,
      this.m_connectionInfo.channel
    );
  }
  identifier(): ServiceIdentifier {
    return `amp:${this.m_id}`;
  }
  retry(): { maxRetries: number; timeBetweenRetries: number[] } {
    return {
      maxRetries: this.m_connectionInfo.maxRetries,
      timeBetweenRetries: this.m_connectionInfo.timeBetweenRetries,
    };
  }

  async open(
    //eslint-disable-next-line no-unused-vars
    retryHandler: (tryCounter: number) => Promise<boolean>
  ): Promise<boolean> {
    this.m_videoCache.clear();
    this.m_current = { id: "", time: new SMPTE(), raw: "" };
    const open = await this.m_source.open(retryHandler);
    if (open) this.update();
    return open;
  }

  isOpen(): boolean {
    return this.m_source?.isOpen() || false;
  }

  async close(): Promise<boolean> {
    this.m_source?.close(false);
    this.m_videoCache.clear();
    this.m_current = { id: "", time: new SMPTE(), raw: "" };
    return await AsyncUtils.booleanReturn(true);
  }

  async restart(): Promise<boolean> {
    this.m_source?.close(true);
    this.m_videoCache.clear();
    this.m_current = { id: "", time: new SMPTE(), raw: "" };
    return await AsyncUtils.booleanReturn(false);
  }

  get(): AmpChannel {
    if (this.m_source) return this.m_source;
    throw new Error("Amp Channel not open");
  }

  data(id: string, dataid?: string): unknown {
    if (id === "cache") {
      if (dataid !== undefined) return this.m_videoCache.get(dataid);
      else return this.m_videoCache;
    } else if (id === "current") return this.m_current;
  }

  config(newSettings?: object): AmpConnection {
    if (newSettings !== undefined) {
      // if(newSettings.maxRetries)
    }
    return this.m_connectionInfo;
  }

  private async pollCurrentInfo(): Promise<void> {
    const cTime = await this.get().sendCommand(Command.CurrentTimeSense);
    const cId = await this.get().sendCommand(Command.IDLoadedRequest);
    if (
      returnCodeMatches(Return.TimeUserBits, cTime.code, {
        byteCount: ["4"],
        commandCode: ["4"],
      }) &&
      returnCodeMatches(Return.IDLoaded, cId.code, { byteCount: ["2"] })
    ) {
      const rawId = (cId.data as { name: string }).name;
      const [currentId] = extractId(rawId);
      if (this.m_current.id !== currentId) {
        if (this.m_current.id !== "") {
          const vdata = this.data("cache", this.m_current.id) as
            | AmpVideoData
            | undefined;
          if (vdata === undefined) {
            return;
          }
          vdata.status = ClockStatus.UNCUED;
          this.m_current.id = "";
        }
        const vdata = this.data("cache", currentId) as AmpVideoData;
        if (!vdata) return;
        vdata.status = ClockStatus.CUED;
        this.m_current.id = currentId;
        clearTimeout(this.m_resetTimeout);
        this.m_resetTimeout = undefined;
      }
      const rawTimecode = (cTime.data as { timecode: string }).timecode;
      let currentTime: SMPTE = new SMPTE(0, this.m_manager.frameRate());
      try {
        currentTime = new SMPTE(rawTimecode, this.m_manager.frameRate());
        if (currentTime.frameCount() === -1) return;
      } catch (err) {
        const date = new Date();
        const time =
          date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds();
        //Log and ignore invalid timecode as it isn't really needed
        console.log(
          `Encountered an invalid timecode.:${rawTimecode} at ${time}`
        );
        //Skip the rest of the function as we shoulnd' make any changes if the timecode is invalid
        return;
      }
      if (this.m_lastChange === -1) this.m_lastChange = Date.now();
      const vdata = this.data("cache", this.m_current.id) as AmpVideoData;
      if (vdata !== undefined) {
        if (this.m_current.raw !== rawTimecode) {
          vdata.status = ClockStatus.RUNNING;
          this.m_lastChange = Date.now();
        } else if (
          this.m_current.raw === rawTimecode &&
          Date.now() - this.m_lastChange > 1100 / this.m_manager.frameRate()
        ) {
          if (vdata.status !== ClockStatus.UNCUED) {
            vdata.status = ClockStatus.PAUSED;
            if (vdata.in.equals(currentTime, true))
              vdata.status = ClockStatus.CUED;
            if (currentTime.greaterThanOrEqual(vdata.out, true)) {
              vdata.status = ClockStatus.STOPPED;
            }
          }
        }
        if (currentTime.hasIncorrectFrameRate())
          vdata.incorrectFramerate = currentTime.hasIncorrectFrameRate();
        this.m_current.time = currentTime;
        this.m_current.raw = rawTimecode;
      }
    } else {
      if (this.m_resetTimeout !== undefined) {
        this.m_resetTimeout = setTimeout(() => {
          console.log("Resetting");
          this.m_current.id = "";
          this.m_current.time = new SMPTE(0, this.m_manager.frameRate());
          this.m_current.raw = "";
        }, 8);
      }
    }
    return await AsyncUtils.voidReturn();
  }

  private async pollVideoData(): Promise<void> {
    const cFirstId = await this.get().sendCommand(Command.ListFirstID, {
      byteCount: "2",
    });
    const cNextId = await this.get().sendCommand(Command.ListNextID, {
      data: { count: 255 },
    });
    const getDuration = async (id: string): Promise<string> => {
      if (id !== "") {
        const cDuration = await this.get().sendCommand(
          Command.IDDurationRequest,
          {
            data: { clipName: id },
          }
        );
        if (
          returnCodeMatches(Return.IDDuration, cDuration.code, {
            byteCount: ["4"],
          })
        )
          return await AsyncUtils.typeReturn(
            (cDuration.data as { timecode: string }).timecode
          );
      }
      return await AsyncUtils.typeReturn("00:00:00:00");
    };
    if (
      returnCodeMatches(Return.IDListing, cFirstId.code, { byteCount: ["A"] })
    ) {
      let allVideos = (cFirstId.data as { clipNames: string[] }).clipNames;
      if (
        returnCodeMatches(Return.IDListing, cNextId.code, { byteCount: ["A"] })
      ) {
        allVideos = [
          ...allVideos,
          ...(cNextId.data as { clipNames: string[] }).clipNames,
        ];
      }
      allVideos = [...new Set(allVideos)];
      allVideos.splice(allVideos.indexOf("Reset"), 1);
      for (const key of this.m_videoCache.values()) {
        const index = allVideos.indexOf(key.metadata.ampid);
        if (index !== -1) {
          allVideos.splice(index, 1);
          this.m_cuedRemove.splice(
            this.m_cuedRemove.findIndex((k) => (k.id = key.id)),
            1
          );
        } else if (this.m_cuedRemove.findIndex((k) => k.id === key.id) !== -1) {
          const i = this.m_cuedRemove.find((k) => k.id === key.id);
          if (i) {
            const now = Date.now();
            if (now > i.time + 1000) {
              this.m_videoCache.delete(i.id);
              this.m_manager.remove(
                `${
                  ManagerIdentifierCodec.serialize(
                    this.m_manager.identifier()
                  ) as `${string}:${string}:${string}`
                }:${i.id}:ampvideoctrl`
              );
              this.m_cuedRemove.splice(
                this.m_cuedRemove.findIndex((k) => (k.id = key.id)),
                1
              );
            }
          }
        } else {
          if (this.m_cuedRemove.findIndex((k) => k.id === key.id) !== -1)
            this.m_cuedRemove.push({ id: key.id, time: Date.now() });
        }
      }
      if (allVideos.length > 0) {
        for (const id of allVideos) {
          const timecode = await getDuration(id);
          let duration: SMPTE;
          try {
            duration = new SMPTE(timecode, this.m_manager.frameRate());
          } catch (e) {
            const date = new Date();
            const time =
              date.getHours() +
              ":" +
              date.getMinutes() +
              ":" +
              date.getSeconds();
            //Log and ignore invalid timecode as it isn't really needed
            console.log(
              `Encountered an invalid timecode.:${timecode} at ${time}`
            );
            //Skip the rest of the function as we shoulnd' make any changes if the timecode is invalid
            return;
          }
          const meta = extractMetadata(id, duration!, this.m_manager);
          if (!this.m_videoCache.has(meta.id)) {
            this.m_videoCache.set(meta.id, {
              ...meta,
              incorrectFramerate: duration!.hasIncorrectFrameRate(),
              status: ClockStatus.UNCUED,
            });
            const clock = new AmpVideoCtrlClock(
              {
                name: "",
                direction: ClockDirection.COUNTDOWN,
                playOnCue: false,
              },
              this.m_manager,
              meta.id
            );
            if (!(await loadChapters(clock, this.m_manager))) {
              const defaultChapter = new ChapterClock(
                this.m_manager,
                clock.identifier(),
                {
                  name: "End",
                  time: clock.duration(),
                }
              );
              this.m_manager.add(defaultChapter);
              clock.addChapter(defaultChapter.identifier());
              saveChapters(clock, this.m_manager);
            }
            this.m_manager.add(clock);
          }
        }
      }
    }
    return await AsyncUtils.voidReturn();
  }

  update() {
    setInterval(() => {
      if (this.isOpen()) void this.pollVideoData();
    }, 1000);
    setInterval(async () => {
      if (this.isOpen() && this.m_previousFrameComplete) {
        void (await this.pollCurrentInfo());
      }
    }, (1000 / this.m_manager.frameRate()) * 2);
  }

  private m_previousFrameComplete: boolean = true;
  private m_id: string;
  private m_connectionInfo: AmpConnection;
  private m_source: AmpChannel;
  private m_cuedRemove: { id: string; time: number }[] = [];
  private m_resetTimeout: any | undefined = undefined;
  private m_current: { id: string; time: SMPTE; raw: string } = {
    id: "",
    time: new SMPTE(),
    raw: "",
  };

  private m_videoCache: Map<string, AmpVideoData> = new Map<
    string,
    AmpVideoData
  >();
  private m_lastChange: number = -1;
  private m_manager: VideoManager;
}
