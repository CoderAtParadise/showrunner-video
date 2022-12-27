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
import { Component, HTMLAttributes } from "react";
import styles from "../styles/CurrentChapter.module.css";
//@ts-ignore
import { CurrentDurationComponent } from "@coderatparadise/showrunner-time/extension";

export class CurrentChapterComponent
  extends Component<
    HTMLAttributes<HTMLDivElement> & {
      clock: ClockIdentifier;
      owner: IClockSource<unknown>;
      manager: IClockManager;
    }
  >
  implements IClockSource<ChapterSettings>
{
  constructor(
    props: HTMLAttributes<HTMLDivElement> & {
      clock: ClockIdentifier;
      owner: IClockSource<unknown>;
      manager: IClockManager;
    }
  ) {
    super(props);
    this.m_id = props.clock;
    this.m_manager = props.manager;
    this.state = {
      currentState: undefined,
      config: undefined,
      additional: undefined,
      markerPosition: 0,
    };
    this.m_owner = props.owner;
    this.m_manager.add(this);
  }

  async componentDidMount(): Promise<void> {
    this._update();
  }

  render() {
    const position =
      (this.duration().frameCount() / this.m_owner.duration().frameCount()) *
      100;
    return (
      <div
        className={`${this.props.className} ${styles.container}`}
      >
        <span
          className={styles.add}
          onClick={() => {
            console.log("Add new cue");
          }}
        >
          New Cue
        </span>
        <div className={styles.progress}>
          <span
            className={styles.position}
            style={{
              left: position < 0 ? 0 : `${position}%`,
            }}
          >
            <div className={styles.marker} />
            <CurrentDurationComponent
              clock={this}
              show="duration"
              className={styles.markerTime}
            />
          </span>
        </div>
        <CurrentDurationComponent
          clock={this}
          show="current"
          className={styles.time}
        />
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
  private m_manager: IClockManager;
  private m_owner: IClockSource<unknown>;
  state: {
    currentState: CurrentClockState | undefined;
    config: (BaseClockConfig & ChapterSettings) | undefined;
    additional: AdditionalData | undefined;
    markerPosition: number;
  };
}
