//@ts-ignore
import { AsyncUtils } from "@coderatparadise/showrunner-network";
import {
  BaseClockConfig,
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
  MessageClockAddChapter,
  MessageClockRemoveChapter,
  MessageClockChapter,
  //@ts-ignore
} from "@coderatparadise/showrunner-time";
//@ts-ignore
import { CurrentDurationComponent } from "@coderatparadise/showrunner-time/extension";
import {
  AdditionalData,
  CurrentClockState,
  //@ts-ignore
} from "@coderatparadise/showrunner-time/codec";
import styles from "../styles/ClientClockSource.module.css";
import { Component, HTMLAttributes } from "react";
import { ClientManagerComponent } from "./ClientManagerComponent";

export class ClientClockSourceComponent
  extends Component<HTMLAttributes<HTMLDivElement> & { clock: ClockIdentifier; manager: IClockManager }>
  implements IClockSource<unknown>
{
  constructor(props: HTMLAttributes<HTMLDivElement> & {
    clock: ClockIdentifier;
    manager: IClockManager;
  }) {
    super(props);
    this.m_id = props.clock;
    this.m_manager = props.manager;
    this.state = {
      currentState: undefined,
      config: undefined,
      additional: undefined,
      chapters: [],
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
        data-tallypreview={
          (this.m_manager as ClientManagerComponent).tally().preview
        }
        data-tallyprogram={
          (this.m_manager as ClientManagerComponent).tally().program
        }
        data-cued={this.status() !== ClockStatus.UNCUED}
        onClick={() => {
          this.cue();
        }}
      >
        <span className={styles.fileName}>{this.name()}</span>
        {/* <span className={styles.hovername}>{this.name()}</span> */}
        <CurrentDurationComponent
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
    if (settime.type === MessageClockCommand) return settime.ret as boolean;
    return await AsyncUtils.booleanReturn(false);
  }

  async chapters(): Promise<ClockIdentifier[]> {
    return await AsyncUtils.typeReturn<ClockIdentifier[]>(this.state.chapters);
  }

  async addChapter(chapter: ClockIdentifier): Promise<boolean> {
    const addChapter = await this.m_manager.dispatch(
      { type: MessageClockAddChapter, handler: "network" },
      this.identifier(),
      chapter
    );
    if (addChapter.ret as boolean) return addChapter.ret as boolean;
    return AsyncUtils.booleanReturn(false);
  }

  async removeChapter(chapter: ClockIdentifier): Promise<boolean> {
    const removeChapter = await this.m_manager.dispatch(
      { type: MessageClockRemoveChapter, handler: "network" },
      this.identifier(),
      chapter
    );
    if (removeChapter.ret as boolean) return removeChapter.ret as boolean;
    return AsyncUtils.booleanReturn(false);
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

  _syncChapters(chapters: string[]) {
    const identifiers: ClockIdentifier[] = [];
    chapters.forEach((chapter: string) =>
      identifiers.push(new ClockIdentifier(chapter))
    );
    this.setState({ chapters: identifiers });
  }

  _sortChapters(): void {
    //NOOP
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
    await this.m_manager.dispatch(
      { type: MessageClockChapter, handler: "network" },
      this.identifier()
    );
    return await AsyncUtils.voidReturn();
  }

  private m_id: ClockIdentifier;
  private m_manager: IClockManager;
  state: {
    currentState: CurrentClockState | undefined;
    config: (BaseClockConfig & unknown) | undefined;
    additional: AdditionalData | undefined;
    chapters: ClockIdentifier[];
  };
}
