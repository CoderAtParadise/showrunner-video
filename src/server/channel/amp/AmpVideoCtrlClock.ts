//@ts-ignore
import { Command, Return } from "@coderatparadise/amp-grassvalley";
import { AmpVideoData } from "./AmpChannelService.js";
import {
  IClockSource,
  BaseClockConfig,
  SMPTE,
  ClockStatus,
  ClockIdentifier,
  FrameRate,
  MessageClockCurrent,
  MessageClockConfig,
  MessageClockPlay,
  MessageClockPause,
  MessageClockStop,
  MessageClockUncue,
  MessageClockCue,
  MessageClockChapter,
  ChapterClock,
  //@ts-ignore
} from "@coderatparadise/showrunner-time";
import { VideoManager } from "../VideoManager.js";
//@ts-ignore
import { AsyncUtils } from "@coderatparadise/showrunner-network";
import { VideoCtrlData } from "../VideoCtrlData.js";

export class AmpVideoCtrlClock implements IClockSource<VideoCtrlData> {
  constructor(
    settings: BaseClockConfig & VideoCtrlData,
    manager: VideoManager,
    sourceId: string
  ) {
    this.m_config = settings;
    this.m_manager = manager;
    this.m_sourceId = sourceId;
    const defaultChapter = new ChapterClock(this.m_manager, this.identifier(), {
      name: "End",
      time: this.duration(),
    });
    this.m_manager.add(defaultChapter);
    this.addChapter(defaultChapter.identifier());
  }

  frameRate(): FrameRate {
    return this.m_manager.frameRate();
  }

  hasIncorrectFrameRate(): boolean {
    const data: AmpVideoData = this.m_manager
      .cache()
      .get(this.m_sourceId) as AmpVideoData;
    if (data) return data.incorrectFramerate;
    return false;
  }

  isOverrun(): boolean {
    return false;
  }

  identifier(): ClockIdentifier {
    return new ClockIdentifier(
      this.m_manager.identifier(),
      this.m_sourceId,
      "ampvideoctrl"
    );
  }

  status(): ClockStatus {
    return this.m_status;
  }

  config(): BaseClockConfig & VideoCtrlData {
    return { ...this.m_config, blackList: ["name"] };
  }

  name(): string {
    const data: AmpVideoData = this.m_manager
      .cache()
      .get(this.m_sourceId) as AmpVideoData;
    return this.m_sourceId !== "" ? data.name : "Unknown Source";
  }

  current(): SMPTE {
    const current = this.m_manager.current();
    if (
      current.id?.id() !== this.m_sourceId ||
      this.m_status === ClockStatus.UNCUED
    )
      return new SMPTE();
    return current.time;
  }

  duration(): SMPTE {
    const data: AmpVideoData = this.m_manager
      .cache()
      .get(this.m_sourceId) as AmpVideoData;
    if (data !== undefined) return data.out;
    else return new SMPTE();
  }

  async cue(): Promise<boolean> {
    if (
      this.m_status === ClockStatus.UNCUED &&
      !this.m_lockInput &&
      this.m_manager.cueLock(
        `${this.identifier().id}:${this.identifier().type}`,
        true
      )
    ) {
      this.m_lockInput = true;
      if (
        this.m_manager.current().id ||
        this.m_manager.current().id?.id() !== this.m_sourceId
      ) {
        const vdata = this.m_manager
          .cache()
          .get(this.m_sourceId) as AmpVideoData;
        if (!vdata) {
          this.m_lockInput = false;
          this.m_manager.cueLock(
            `${this.identifier().id}:${this.identifier().type}`,
            false
          );
          return await AsyncUtils.booleanReturn(false);
        }
        const cue = await this.m_manager.sendCommand(Command.InPreset, {
          byteCount: "A",
          data: { clipName: vdata.metadata.ampid },
        });
        if (cue.code !== Return.ACK.code) {
          this.m_lockInput = false;
          this.m_manager.cueLock(
            `${this.identifier().id}:${this.identifier().type}`,
            false
          );
          return await AsyncUtils.booleanReturn(false);
        }
      }
      this.m_status = ClockStatus.CUED;
      this.m_manager.startUpdating(this.identifier(), this._update.bind(this));
      void this.m_manager.dispatch(
        { type: MessageClockCurrent, handler: "event" },
        this.identifier()
      );
      void this.m_manager.dispatch(
        { type: MessageClockCue, handler: "notify" },
        this.identifier()
      );
      await (
        await this.chapters()
      ).forEach((chapter: ClockIdentifier) => {
        this.m_manager.cue(chapter);
      });
      this.m_lockInput = false;
      this.m_manager.cueLock(
        `${this.identifier().id}:${this.identifier().type}`,
        false
      );
      return await AsyncUtils.booleanReturn(true);
    }
    return await AsyncUtils.booleanReturn(false);
  }

  async uncue(): Promise<boolean> {
    if (
      this.m_status !== ClockStatus.UNCUED &&
      this.m_status !== ClockStatus.INVALID
    ) {
      this.m_manager.stopUpdating(this.identifier());
      this.m_status = ClockStatus.UNCUED;
      void this.m_manager.dispatch(
        { type: MessageClockCurrent, handler: "event" },
        this.identifier()
      );
      void this.m_manager.dispatch(
        { type: MessageClockUncue, handler: "notify" },
        this.identifier()
      );
      await (
        await this.chapters()
      ).forEach((chapter: ClockIdentifier) => {
        this.m_manager.uncue(chapter);
      });
      this.m_lockInput = false;
      return await AsyncUtils.booleanReturn(true);
    }
    this.m_lockInput = false;
    return await AsyncUtils.booleanReturn(false);
  }

  async play(): Promise<boolean> {
    if (this.m_status === ClockStatus.UNCUED && !this.m_lockInput) {
      if (await this.cue()) {
        if (!this.m_config.playOnCue) return AsyncUtils.booleanReturn(true);
      }
    }
    if (this.m_status !== ClockStatus.RUNNING) {
      if (this.m_status === ClockStatus.STOPPED) void (await this.recue());
      const play = await this.m_manager.sendCommand(Command.Play, {
        byteCount: "0",
      });
      if (play.code === Return.ACK.code) {
        this.m_status = ClockStatus.RUNNING;
        void this.m_manager.dispatch(
          { type: MessageClockCurrent, handler: "event" },
          this.identifier()
        );
        void this.m_manager.dispatch(
          { type: MessageClockPlay, handler: "notify" },
          this.identifier()
        );
        return await AsyncUtils.booleanReturn(true);
      }
    }
    return await AsyncUtils.booleanReturn(false);
  }

  async pause(): Promise<boolean> {
    if (this.m_status === ClockStatus.RUNNING && !this.m_lockInput) {
      const stop = await this.m_manager.sendCommand(Command.Stop, {
        byteCount: "0",
      }); // PVS pauses on stop and will resume where left off
      if (stop.code === Return.ACK.code) {
        this.m_status = this.m_lastRequest = ClockStatus.PAUSED;
        void this.m_manager.dispatch(
          { type: MessageClockCurrent, handler: "event" },
          this.identifier()
        );
        void this.m_manager.dispatch(
          { type: MessageClockPause, handler: "notify" },
          this.identifier()
        );
        return await AsyncUtils.booleanReturn(true);
      }
    }
    return await AsyncUtils.booleanReturn(false);
  }

  async stop(): Promise<boolean> {
    if (this.m_status === ClockStatus.STOPPED && !this.m_lockInput)
      return await AsyncUtils.booleanReturn(true);
    if (
      this.m_status === ClockStatus.RUNNING ||
      this.m_status === ClockStatus.PAUSED
    ) {
      const stop = await this.m_manager.sendCommand(Command.Stop, {
        byteCount: "0",
      });
      if (stop.code === Return.ACK.code) {
        this.m_status = this.m_lastRequest = ClockStatus.STOPPED;
        void this.m_manager.dispatch(
          { type: MessageClockCurrent, handler: "event" },
          this.identifier()
        );
        void this.m_manager.dispatch(
          { type: MessageClockStop, handler: "notify" },
          this.identifier()
        );
        return await AsyncUtils.booleanReturn(true);
      }
    }
    return await AsyncUtils.booleanReturn(false);
  }

  async recue(): Promise<boolean> {
    if (
      this.m_status !== ClockStatus.UNCUED &&
      this.m_status !== ClockStatus.INVALID &&
      !this.m_lockInput
    ) {
      if (await this.uncue()) {
        const reset = await this.m_manager.sendCommand(Command.InPreset, {
          byteCount: "A",
          data: { clipName: "Reset" },
        });
        if (reset.code === Return.ACK.code) {
          this.m_manager.current().id = undefined;
          return await this.cue();
        }
      }
    }
    return await AsyncUtils.booleanReturn(false);
  }

  async setTime(time: SMPTE): Promise<boolean> {
    if (
      this.m_status !== ClockStatus.UNCUED &&
      this.m_status !== ClockStatus.INVALID &&
      !this.m_lockInput
    ) {
      this.m_lockInput = true;
      if (this.m_status === ClockStatus.CUED) {
        this.play();
      }
      const stime = await this.m_manager.sendCommand(Command.CueUpWithData, {
        byteCount: "4",
        data: { timecode: time.toString() },
      });
      if (stime.code === Return.ACK.code) {
        this.m_status = ClockStatus.PAUSED;
        this.m_lockInput = false;
        return await AsyncUtils.booleanReturn(true);
      }
      this.m_lockInput = false;
    }
    return await AsyncUtils.booleanReturn(false);
  }

  async chapters(): Promise<ClockIdentifier[]> {
    return await AsyncUtils.typeReturn<ClockIdentifier[]>(this.m_chapters);
  }

  async addChapter(chapter: ClockIdentifier): Promise<boolean> {
    if (
      !this.m_chapters.find(
        (id: ClockIdentifier) => id.toString() === chapter.toString()
      )
    ) {
      this.m_chapters.push(chapter);
      this._sortChapters();
      return await AsyncUtils.booleanReturn(true);
    }
    return await AsyncUtils.booleanReturn(false);
  }

  async removeChapter(chapter: ClockIdentifier): Promise<boolean> {
    const index = this.m_chapters.findIndex(
      (id: ClockIdentifier) => id.toString() === chapter.toString()
    );
    if (index !== -1) {
      this.m_chapters.splice(index, 1);
      this.m_manager.dispatch(
        { type: MessageClockChapter, handler: "event" },
        this.identifier()
      );
      return await AsyncUtils.booleanReturn(true);
    }
    return await AsyncUtils.booleanReturn(false);
  }

  _sortChapters(): void {
    this.m_chapters.sort((a: ClockIdentifier, b: ClockIdentifier) => {
      const asource = this.m_manager.request(a);
      const bsource = this.m_manager.request(b);
      if (asource && bsource) {
        if (asource.duration().lessThan(bsource.duration(), true)) return -1;
        if (asource.duration().equals(bsource.duration(), true)) return 0;
        if (asource.duration().greaterThan(bsource.duration(), true)) return 1;
      }
      return -1;
    });
    this.m_manager.dispatch(
      { type: MessageClockChapter, handler: "event" },
      this.identifier()
    );
  }

  async updateConfig(
    newConfig: BaseClockConfig & VideoCtrlData
  ): Promise<void> {
    if (newConfig.playOnCue) this.m_config.playOnCue = newConfig.playOnCue;
    if (newConfig.direction) this.m_config.direction = newConfig.direction;
    void this.m_manager.dispatch(
      { type: MessageClockConfig, handler: "event" },
      this.identifier()
    );
    return await AsyncUtils.voidReturn();
  }

  data(): object {
    return {};
  }

  async _update(): Promise<void> {
    const videoData = this.m_manager
      .cache()
      .get(this.m_sourceId) as AmpVideoData;
    if (videoData !== undefined) {
      if (this.m_manager.current().id?.id() !== this.m_sourceId) {
        this.uncue();
        return;
      }
      if (!this.m_lockInput) {
        if (
          this.m_lastRequest !== ClockStatus.INVALID &&
          this.m_lastRequest !== videoData.status
        ) {
          this.m_status = videoData.status = this.m_lastRequest;
          this.m_lastRequest = ClockStatus.INVALID;
        }
        if (this.m_status !== ClockStatus.UNCUED) {
          this.m_status = videoData.status;
        }
        void this.m_manager.dispatch(
          { type: MessageClockCurrent, handler: "event" },
          this.identifier()
        );
      }
    }
    return await AsyncUtils.voidReturn();
  }

  private m_lockInput: boolean = false;
  private m_lastRequest: ClockStatus = ClockStatus.INVALID;
  private m_config: BaseClockConfig & VideoCtrlData;
  private m_manager: VideoManager;
  private m_sourceId: string;
  private m_status: ClockStatus = ClockStatus.UNCUED;
  private m_chapters: ClockIdentifier[] = [];
}
