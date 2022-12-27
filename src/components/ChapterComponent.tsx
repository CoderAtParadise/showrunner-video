//@ts-ignore
import { AsyncUtils } from "@coderatparadise/showrunner-network";
import {
  BaseClockConfig,
  ChapterSettings,
  ClockIdentifier,
  ClockStatus,
  FrameRate,
  IClockManager,
  IClockSource,
  MessageClockCommand,
  MessageClockConfig,
  MessageClockCurrent,
  MessageClockData,
  MessageClockSetTime,
  MessageClockUpdateConfig,
  SMPTE,
  //@ts-ignore
} from "@coderatparadise/showrunner-time";
import {
  AdditionalData,
  CurrentClockState,
  //@ts-ignore
} from "@coderatparadise/showrunner-time/codec";
//@ts-ignore
import { CurrentDurationComponent } from "@coderatparadise/showrunner-time/extension";
import { Component, HTMLAttributes } from "react";
import styles from "../styles/Chapter.module.css";

export class ChapterComponent
  extends Component<
    HTMLAttributes<HTMLDivElement> & {
      clock: ClockIdentifier;
      manager: IClockManager;
      index: number;
    }
  >
  implements IClockSource<ChapterSettings>
{
  constructor(
    props: HTMLAttributes<HTMLDivElement> & {
      clock: ClockIdentifier;
      manager: IClockManager;
      index: number;
    }
  ) {
    super(props);
    this.m_id = props.clock;
    this.index = props.index;
    this.m_manager = props.manager;
    this.state = {
      currentState: undefined,
      config: undefined,
      additional: undefined,
    };
    this.m_manager.add(this);
  }

  async componentDidMount(): Promise<void> {
    this._update();
  }

  render() {
    const position =
      100 - (this.current().frameCount() / this.duration().frameCount()) * 100;
    return (
      <div
        className={`${this.props.className} ${styles.progressContainer}`}
        data-active={this.status() === ClockStatus.PAUSED}
      >
        <div className={`${styles.progressEmpty}`}>
          <div className={styles.floating}>
            <span className={styles.index}>{this.index + 1}</span>
            <CurrentDurationComponent
              className={`${styles.time} ${
                this.status() === ClockStatus.PAUSED ? styles.active : ""
              }`}
              clock={this}
              show="duration"
            />
          </div>
        </div>
        <div
          className={`${styles.progressComplete}`}
          style={{ width: `${position}%` }}
        >
          <div className={styles.floating}>
            <span className={styles.index}>{this.index + 1}</span>
            <CurrentDurationComponent
              className={`${styles.time} ${
                this.status() === ClockStatus.PAUSED ? styles.active : ""
              }`}
              clock={this}
              show="duration"
            />
          </div>
        </div>
      </div>
    );
  }

  config(): BaseClockConfig & ChapterSettings {
    return this.state.config || { name: "", time: SMPTE.INVALID };
  }

  frameRate(): FrameRate {
    return this.state.additional?.frameRate || FrameRate.F1000;
  }

  identifier(): ClockIdentifier {
    return this.m_id;
  }

  status(): ClockStatus {
    return this.state.currentState?.status || ClockStatus.INVALID;
  }

  hasIncorrectFrameRate(): boolean {
    return this.state.currentState?.incorrectFrameRate || false;
  }

  isOverrun(): boolean {
    return this.state.currentState?.overrun || false;
  }

  duration(): SMPTE {
    try {
      return new SMPTE(
        this.state.additional?.duration,
        this.state.additional?.frameRate
      );
    } catch (e) {
      return SMPTE.INVALID;
    }
  }

  name(): string {
    return this.state.additional?.name || "";
  }

  current(): SMPTE {
    try {
      return new SMPTE(
        this.state.currentState?.time,
        this.state.additional?.frameRate
      );
    } catch (e) {
      return SMPTE.INVALID;
    }
  }

  async cue(): Promise<boolean> {
    return AsyncUtils.booleanReturn(false);
  }

  async uncue(): Promise<boolean> {
    return AsyncUtils.booleanReturn(false);
  }

  async play(): Promise<boolean> {
    return AsyncUtils.booleanReturn(false);
  }

  async pause(): Promise<boolean> {
    return AsyncUtils.booleanReturn(false);
  }

  async stop(): Promise<boolean> {
    return AsyncUtils.booleanReturn(false);
  }

  async recue(): Promise<boolean> {
    return AsyncUtils.booleanReturn(false);
  }

  async setTime(time: SMPTE): Promise<boolean> {
    const settime = await this.m_manager.dispatch(
      { type: MessageClockSetTime, handler: "network" },
      this.identifier(),
      time
    );

    if (settime.type === MessageClockCommand) return settime.ret as boolean;
    return await AsyncUtils.booleanReturn(false);
  }

  async chapters(): Promise<ClockIdentifier[]> {
    return AsyncUtils.typeReturn<ClockIdentifier[]>([]);
  }

  async addChapter(): Promise<boolean> {
    return AsyncUtils.booleanReturn(false);
  }

  async removeChapter(): Promise<boolean> {
    return AsyncUtils.booleanReturn(false);
  }

  _sortChapters(): void {
    //NOOP
  }

  data(): object {
    return this.state.additional?.data || {};
  }

  async updateConfig(
    newConfig: BaseClockConfig & ChapterSettings,
    local?: boolean | undefined
  ): Promise<void> {
    this.setState({ config: newConfig });
    if (!local) {
      await this.m_manager.dispatch(
        { type: MessageClockUpdateConfig, handler: "network" },
        this.identifier(),
        newConfig
      );
    }
    return await AsyncUtils.voidReturn();
  }

  async _update(): Promise<void> {
    await this.m_manager.dispatch(
      { type: MessageClockData, handler: "network" },
      this.identifier()
    );
    await this.m_manager.dispatch(
      { type: MessageClockCurrent, handler: "network" },
      this.identifier()
    );
    await this.m_manager.dispatch(
      { type: MessageClockConfig, handler: "network" },
      this.identifier()
    );
  }

  _syncState(newState: CurrentClockState): void {
    this.setState({ currentState: newState });
  }

  _syncData(data: AdditionalData): void {
    this.setState({ additional: data });
  }

  private m_id: ClockIdentifier;
  private index: number;
  private m_manager: IClockManager;
  state: {
    currentState: CurrentClockState | undefined;
    config: (BaseClockConfig & ChapterSettings) | undefined;
    additional: AdditionalData | undefined;
  };
}
