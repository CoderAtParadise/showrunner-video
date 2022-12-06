import {
  ClockStatus,
  SMPTE,
  BaseClockConfig,
  ClockIdentifier,
  IClockSource,
  FrameRate,
  MessageClockCurrent,
  MessageClockData,
  MessageClockChapter,
  //@ts-ignore
} from "@coderatparadise/showrunner-time";
import { VideoManager } from "./VideoManager.js";
//@ts-ignore
import { AsyncUtils } from "@coderatparadise/showrunner-network";
import { AmpVideoData } from "./amp/AmpChannelService.js";

export class CurrentCtrlClock implements IClockSource<unknown> {
  constructor(manager: VideoManager) {
    this.m_manager = manager;
    this.m_manager.startUpdating(this.identifier(), this._update.bind(this));
  }

  identifier(): ClockIdentifier {
    return new ClockIdentifier(this.m_manager.identifier(), "video", "current");
  }

  config(): BaseClockConfig & unknown {
    return {
      name: "Current Video",
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
      if (clock) {
        return clock.current();
      }
    }
    return new SMPTE();
  }

  duration(): SMPTE {
    if (this.m_currentId) {
      const clock = this.m_manager.request(this.m_currentId);
      if (clock) return clock.duration();
    }
    return new SMPTE();
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
    if (this.m_currentId)
      return await this.m_manager.chapters(this.m_currentId);
    return await AsyncUtils.typeReturn<ClockIdentifier[]>([]);
  }

  async addChapter(chapter: ClockIdentifier): Promise<boolean> {
    if (this.m_currentId)
      return await this.m_manager.addChapter(this.m_currentId, chapter);
    return await AsyncUtils.booleanReturn(false);
  }

  async removeChapter(chapter: ClockIdentifier): Promise<boolean> {
    if (this.m_currentId)
      return await this.m_manager.removeChapter(this.m_currentId, chapter);
    return await AsyncUtils.booleanReturn(false);
  }

  _sortChapters(): void {
    if (this.m_currentId) this.m_manager._sortChapters(this.m_currentId);
  }

  async updateConfig(): Promise<void> {
    // NOOP
  }

  async _update(): Promise<void> {
    const currentId = this.m_manager.current().id;
    if (currentId) {
      this.m_switchTimer = 0;
      if (currentId.toString() !== this.m_currentId?.toString()) {
        void (await this.uncue());
        this.m_currentId = currentId;
        void (await this.cue());
      }
    } else {
      if (this.m_switchTimer >= 500) this.m_currentId = undefined;
      else this.m_switchTimer++;
    }

    void this.m_manager.dispatch(
      { type: MessageClockCurrent, handler: "event" },
      this.identifier()
    );
    await this.m_manager.dispatch(
      { type: MessageClockData, handler: "event" },
      this.identifier()
    );
    await this.m_manager.dispatch(
      { type: MessageClockChapter, handler: "event" },
      this.identifier()
    );
  }

  data(): object {
    return { currentId: this.m_currentId };
  }
  private m_manager: VideoManager;
  private m_currentId: ClockIdentifier | undefined;
  private m_switchTimer: number = 0;
}
