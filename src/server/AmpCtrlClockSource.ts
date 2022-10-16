import {
  ClockStatus,
  SMPTE,
  BaseClockConfig,
  ClockIdentifier,
  IClockSource,
  ControlBar,
  FrameRate,
  MessageClockCurrent,
  MessageClockData,
  ClockLookup,
  //@ts-ignore
} from "@coderatparadise/showrunner-time";
import { VideoManager } from "./VideoManager.js";
//@ts-ignore
import { AsyncUtils } from "@coderatparadise/showrunner-network";
import { AmpVideoData } from "./AmpCurrentChannelService.js";
//@ts-ignore
import { ClockIdentifierCodec } from "@coderatparadise/showrunner-time/codec";

export class AmpCurrentCtrlClock implements IClockSource<unknown> {
  constructor(manager: VideoManager) {
    this.m_manager = manager;
    this.m_manager.startUpdating(
      ClockIdentifierCodec.serialize(this.identifier()) as ClockLookup,
      this._update.bind(this)
    );
  }

  identifier(): ClockIdentifier {
    return {
      service: "video",
      show: "video",
      session: this.m_manager.id(),
      id: "current",
      type: "ampcurrentctrl",
    };
  }

  config(): BaseClockConfig & unknown {
    return {
      name: "Current Video",
      blackList: ["name"],
    };
  }

  status(): ClockStatus {
    if (this.m_currentId) {
      const clock = this.m_manager.request(
        `video:video:${this.m_manager.id()}:${this.m_currentId}:ampvideoctrl`
      );
      if (clock) return clock.status();
    }
    return ClockStatus.INVALID;
  }

  frameRate(): FrameRate {
    if (this.m_currentId) {
      const clock = this.m_manager.request(
        `video:video:${this.m_manager.id()}:${this.m_currentId}:ampvideoctrl`
      );
      if (clock) return clock.frameRate();
    }
    return FrameRate.F25;
  }

  hasIncorrectFrameRate(): boolean {
    if (this.m_currentId) {
      const clock = this.m_manager.request(
        `video:video:${this.m_manager.id()}:${this.m_currentId}:ampvideoctrl`
      );
      if (clock) return clock.hasIncorrectFrameRate();
    }
    return false;
  }

  isOverrun(): boolean {
    if (this.m_currentId) {
      const clock = this.m_manager.request(
        `video:video:${this.m_manager.id()}:${this.m_currentId}:ampvideoctrl`
      );
      if (clock) return clock.isOverrun();
    }
    return false;
  }

  controlBar(): ControlBar[] {
    return [
      ControlBar.PLAY_PAUSE,
      ControlBar.STOP,
      ControlBar.RECUE,
      ControlBar.POSITION,
    ];
  }

  name(): string {
    const data: AmpVideoData = this.m_manager
      .cache()
      .get(this.m_currentId) as AmpVideoData;
    return this.m_currentId !== "" ? data.name : "No Video";
  }

  current(): SMPTE {
    if (this.m_currentId !== "") {
      const clock = this.m_manager.request(
        `video:video:${this.m_manager.id()}:${this.m_currentId}:ampvideoctrl`
      );
      if (clock) return clock.current();
    }
    return new SMPTE();
  }

  duration(): SMPTE {
    if (this.m_currentId !== "") {
      const clock = this.m_manager.request(
        `video:video:${this.m_manager.id()}:${this.m_currentId}:ampvideoctrl`
      );
      if (clock) return clock.duration();
    }
    return new SMPTE();
  }

  async cue(): Promise<boolean> {
    if (this.m_currentId !== "")
      return await this.m_manager.cue(
        `video:video:${this.m_manager.id()}:${this.m_currentId}:ampvideoctrl`
      );
    return await AsyncUtils.booleanReturn(false);
  }

  async uncue(): Promise<boolean> {
    if (this.m_currentId !== "") {
      return await this.m_manager.uncue(
        `video:video:${this.m_manager.id()}:${this.m_currentId}:ampvideoctrl`
      );
    }
    return await AsyncUtils.booleanReturn(false);
  }

  async play(): Promise<boolean> {
    if (this.m_currentId !== "")
      return await this.m_manager.play(
        `video:video:${this.m_manager.id()}:${this.m_currentId}:ampvideoctrl`
      );
    return await AsyncUtils.booleanReturn(false);
  }

  async pause(): Promise<boolean> {
    if (this.m_currentId !== "")
      return await this.m_manager.pause(
        `video:video:${this.m_manager.id()}:${this.m_currentId}:ampvideoctrl`
      );
    return await AsyncUtils.booleanReturn(false);
  }

  async stop(): Promise<boolean> {
    if (this.m_currentId !== "") {
      return await this.m_manager.stop(
        `video:video:${this.m_manager.id()}:${this.m_currentId}:ampvideoctrl`
      );
    }
    return await AsyncUtils.booleanReturn(false);
  }

  async recue(): Promise<boolean> {
    if (this.m_currentId !== "") {
      return await this.m_manager.recue(
        `video:video:${this.m_manager.id()}:${this.m_currentId}:ampvideoctrl`
      );
    }
    return await AsyncUtils.booleanReturn(false);
  }

  async setTime(time: SMPTE): Promise<boolean> {
    if (this.m_currentId !== "") {
      return await this.m_manager.setTime(
        `video:video:${this.m_manager.id()}:${this.m_currentId}:ampvideoctrl`,
        time
      );
    }
    return await AsyncUtils.booleanReturn(false);
  }

  async updateConfig(): Promise<void> {
    // NOOP
  }

  async _update(): Promise<void> {
    const currentId = this.m_manager.current().id;
    if (currentId) {
      if (currentId !== this.m_currentId) {
        void (await this.uncue());
        this.m_currentId = currentId;
        void (await this.cue());
      }
    } else {
      this.m_currentId = "";
    }
    void this.m_manager.dispatch(
      { type: MessageClockCurrent, handler: "event" },
      this.identifier()
    );
    await this.m_manager.dispatch(
      { type: MessageClockData, handler: "event" },
      this.identifier()
    );
  }

  data(): object {
    return { currentId: this.m_currentId };
  }
  private m_manager: VideoManager;
  private m_currentId: string = "";
}
