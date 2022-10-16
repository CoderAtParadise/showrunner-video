//@ts-ignore
import { AsyncUtils } from "@coderatparadise/showrunner-network";
import {
  BaseClockConfig,
  ClockLookup,
  FrameRate,
  IClockSource,
  ClockIdentifier,
  ClockStatus,
  SMPTE,
  MessageClockCue,
  MessageClockCommand,
  MessageClockUncue,
  MessageClockPlay,
  MessageClockPause,
  MessageClockStop,
  MessageClockRecue,
  MessageClockSetTime,
  MessageClockUpdateConfig,
  MessageClockData,
  MessageClockConfig,
  IClockManager,
  MessageClockCurrent,
  //@ts-ignore
} from "@coderatparadise/showrunner-time";
//@ts-ignore
import { DisplayTimeComponent } from "@coderatparadise/showrunner-time/extension";
import {
  AdditionalData,
  ClockIdentifierCodec,
  CurrentClockState,
  //@ts-ignore
} from "@coderatparadise/showrunner-time/codec";
import styles from "../styles/ClientClockSource.module.css";
import { Component } from "react";
import { ClientManagerComponent } from "./ClientManagerComponent";

export class ClientClockSourceComponent
  extends Component<{ id: ClockLookup; manager: IClockManager }>
  implements IClockSource<unknown>
{
  constructor(props: {
    className?: string;
    id: ClockLookup;
    manager: IClockManager;
  }) {
    super(props);
    this.m_id = props.id;
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
    return (
      <div
        className={styles.container}
        data-controlmode={(this.m_manager as ClientManagerComponent).controlMode()}
        data-cued={this.status() !== ClockStatus.UNCUED}
        onClick={() => {
          this.cue();
        }}
      >
        <span className={styles.fileName}>{this.name()}</span>
        <DisplayTimeComponent
          clock={this}
          show="duration"
          showFrames
          className={styles.duration}
        />
      </div>
    );
  }

  config(): BaseClockConfig & unknown {
    return this.state.config || { name: "" };
  }

  frameRate(): FrameRate {
    return this.state.additional?.frameRate || FrameRate.F1000;
  }

  identifier(): ClockIdentifier {
    return ClockIdentifierCodec.deserialize(this.m_id);
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
      return new SMPTE();
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
      return new SMPTE();
    }
  }

  data(): object {
    return this.state.additional?.data || {};
  }

  async cue(): Promise<boolean> {
    const cued = await this.m_manager.dispatch(
      { type: MessageClockCue, handler: "network" },
      this.identifier()
    );
    if (cued.type === MessageClockCommand) {
      return cued.ret as boolean;
    }
    return await AsyncUtils.booleanReturn(false);
  }

  async uncue(): Promise<boolean> {
    const uncued = await this.m_manager.dispatch(
      { type: MessageClockUncue, handler: "network" },
      this.identifier()
    );
    if (uncued.type === MessageClockCommand) {
      return uncued.ret as boolean;
    }
    return await AsyncUtils.booleanReturn(false);
  }

  async play(): Promise<boolean> {
    const play = await this.m_manager.dispatch(
      { type: MessageClockPlay, handler: "network" },
      this.identifier()
    );
    if (play.type === MessageClockCommand) {
      return play.ret as boolean;
    }
    return await AsyncUtils.booleanReturn(false);
  }

  async pause(override: boolean): Promise<boolean> {
    const pause = await this.m_manager.dispatch(
      { type: MessageClockPause, handler: "network" },
      this.identifier(),
      override
    );
    if (pause.type === MessageClockCommand) {
      return pause.ret as boolean;
    }
    return await AsyncUtils.booleanReturn(false);
  }

  async stop(override: boolean): Promise<boolean> {
    const stop = await this.m_manager.dispatch(
      { type: MessageClockStop, handler: "network" },
      this.identifier(),
      override
    );
    if (stop.type === MessageClockCommand) {
      return stop.ret as boolean;
    }
    return await AsyncUtils.booleanReturn(false);
  }

  async recue(override: boolean): Promise<boolean> {
    const recue = await this.m_manager.dispatch(
      { type: MessageClockRecue, handler: "network" },
      this.identifier(),
      override
    );
    if (recue.type === MessageClockCommand) {
      return recue.ret as boolean;
    }
    return await AsyncUtils.booleanReturn(false);
  }

  async setTime(time: SMPTE): Promise<boolean> {
    const settime = await this.m_manager.dispatch(
      { type: MessageClockSetTime, handler: "network" },
      this.identifier(),
      time
    );
    if (settime.type === MessageClockCommand) {
      return settime.ret as boolean;
    }
    return await AsyncUtils.booleanReturn(false);
  }

  async updateConfig(
    settings: BaseClockConfig & unknown,
    local?: boolean
  ): Promise<void> {
    this.setState({ config: settings });
    if (!local) {
      await this.m_manager.dispatch(
        { type: MessageClockUpdateConfig, handler: "network" },
        this.identifier(),
        settings
      );
    }
    return await AsyncUtils.voidReturn();
  }

  _syncState(newState: CurrentClockState): void {
    this.setState({ currentState: newState });
  }

  _syncData(data: AdditionalData): void {
    this.setState({ additional: data });
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
    return await AsyncUtils.voidReturn();
  }

  private m_id: ClockLookup;
  private m_manager: IClockManager;
  state: {
    currentState: CurrentClockState | undefined;
    config: (BaseClockConfig & unknown) | undefined;
    additional: AdditionalData | undefined;
  };
}
