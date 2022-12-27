import {
  ClockStatus,
  SMPTE,
  BaseClockConfig,
  ClockIdentifier,
  IClockSource,
  FrameRate,
  MessageClockCurrent,
  MessageClockData,
  //@ts-ignore
} from "@coderatparadise/showrunner-time";
import { VideoManager } from "./VideoManager.js";
//@ts-ignore
import { AsyncUtils } from "@coderatparadise/showrunner-network";
import { AmpVideoData } from "./amp/AmpChannelService.js";

export class CurrentChapterClock implements IClockSource<unknown> {
  constructor(manager: VideoManager) {
    this.m_manager = manager;
    this.m_manager.startUpdating(this.identifier(), this._update.bind(this));
  }

  identifier(): ClockIdentifier {
    return new ClockIdentifier(
      this.m_manager.identifier(),
      "chapter",
      "current"
    );
  }

  config(): BaseClockConfig & unknown {
    return {
      name: "Current Chapter",
      blackList: ["name"],
    };
  }

  status(): ClockStatus {
    if (this.m_currentId) {
      const clock = this.m_manager.request(this.m_currentId);
      if (clock) return clock.status();
    }
    return ClockStatus.INVALID;
  }

  frameRate(): FrameRate {
    if (this.m_currentId) {
      const clock = this.m_manager.request(this.m_currentId);
      if (clock) return clock.frameRate();
    }
    return FrameRate.F25;
  }

  hasIncorrectFrameRate(): boolean {
    if (this.m_currentId) {
      const clock = this.m_manager.request(this.m_currentId);
      if (clock) return clock.hasIncorrectFrameRate();
    }
    return false;
  }

  isOverrun(): boolean {
    if (this.m_currentId) {
      const clock = this.m_manager.request(this.m_currentId);
      if (clock) return clock.isOverrun();
    }
    return false;
  }

  name(): string {
    const data: AmpVideoData = this.m_manager
      .cache()
      .get(this.m_currentId?.id() || "") as AmpVideoData;
    return this.m_currentId && data ? data.name : "No Video";
  }

  current(): SMPTE {
    if (this.m_currentId) {
      const clock = this.m_manager.request(this.m_currentId);
      if (clock) return clock.current();
    }
    return SMPTE.INVALID;
  }

  duration(): SMPTE {
    if (this.m_currentId) {
      const clock = this.m_manager.request(this.m_currentId);
      if (clock) return clock.duration();
    }
    return SMPTE.INVALID;
  }

  async cue(): Promise<boolean> {
    if (this.m_currentId) return await this.m_manager.cue(this.m_currentId);
    return await AsyncUtils.booleanReturn(false);
  }

  async uncue(): Promise<boolean> {
    if (this.m_currentId) return await this.m_manager.uncue(this.m_currentId);
    return await AsyncUtils.booleanReturn(false);
  }

  async play(): Promise<boolean> {
    if (this.m_currentId) return await this.m_manager.play(this.m_currentId);
    return await AsyncUtils.booleanReturn(false);
  }

  async pause(): Promise<boolean> {
    if (this.m_currentId) return await this.m_manager.pause(this.m_currentId);
    return await AsyncUtils.booleanReturn(false);
  }

  async stop(): Promise<boolean> {
    if (this.m_currentId) return await this.m_manager.stop(this.m_currentId);
    return await AsyncUtils.booleanReturn(false);
  }

  async recue(): Promise<boolean> {
    if (this.m_currentId) return await this.m_manager.recue(this.m_currentId);
    return await AsyncUtils.booleanReturn(false);
  }

  async setTime(time: SMPTE): Promise<boolean> {
    if (this.m_currentId) {
      return await this.m_manager.setTime(this.m_currentId, time);
    }
    return await AsyncUtils.booleanReturn(false);
  }

  async chapters(): Promise<ClockIdentifier[]> {
    return await AsyncUtils.typeReturn<ClockIdentifier[]>([]);
  }

  async addChapter(): Promise<boolean> {
    return await AsyncUtils.booleanReturn(false);
  }

  async removeChapter(): Promise<boolean> {
    return await AsyncUtils.booleanReturn(false);
  }

  _sortChapters(): void {
    // NOOP
  }

  async updateConfig(): Promise<void> {
    // NOOP
  }

  async _update(): Promise<void> {
    const currentOwner = this.m_manager.current().id;
    if (currentOwner) {
      if (currentOwner.toString() !== this.m_currentOwner?.toString())
        this.m_currentOwner = currentOwner;
      const chapters = await this.m_manager.chapters(this.m_currentOwner);
      for (const cid of chapters) {
        const chapter = await this.m_manager.request(cid);
        if (chapter) {
          if (
            this.m_currentId?.toString() !== chapter.identifier().toString()
          ) {
            if (chapter.status() === ClockStatus.RUNNING) {
              this.play();
              this.m_currentId = cid;
              this.pause();
              await this.m_manager.dispatch(
                { type: MessageClockData, handler: "event" },
                this.identifier()
              );
              break;
            }
          } else if (chapter.status() === ClockStatus.PAUSED) break;
        }
      }
    } else {
      this.m_currentId = undefined;
      this.m_currentOwner = undefined;
    }
    void this.m_manager.dispatch(
      { type: MessageClockCurrent, handler: "event" },
      this.identifier()
    );
  }

  data(): object {
    return { currentId: this.m_currentId, currentOwner: this.m_currentOwner };
  }
  private m_manager: VideoManager;
  private m_currentId: ClockIdentifier | undefined;
  private m_currentOwner: ClockIdentifier | undefined;
}
