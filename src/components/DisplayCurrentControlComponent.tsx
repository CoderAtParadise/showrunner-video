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
  MessageClockCurrent,
  MessageClockConfig,
  MessageClockRemoveChapter,
  MessageClockAddChapter,
  MessageClockChapter,
  //@ts-ignore
} from "@coderatparadise/showrunner-time";
import {
  AdditionalData,
  CurrentClockState,
  //@ts-ignore
} from "@coderatparadise/showrunner-time/codec";
import { Component } from "react";
import styles from "../styles/DisplayCurrent.module.css";
import Image from "next/image";
import { SeekBarComponent } from "./seek/SeekBarComponent";
import { ClientManagerComponent } from "./ClientManagerComponent";
import { ChapterComponent } from "./ChapterComponent";

export class DisplayCurrentControlComponent
  extends Component<{ id: ClockIdentifier; manager: ClientManagerComponent }>
  implements IClockSource<unknown>
{
  constructor(props: {
    className?: string;
    id: ClockIdentifier;
    manager: ClientManagerComponent;
  }) {
    super(props);
    this.m_id = props.id;
    this.m_manager = props.manager;
    this.state = {
      currentState: undefined,
      config: undefined,
      additional: undefined,
      scroll: false,
      chapters: [],
    };
    this.m_manager.add(this);
  }

  async componentDidMount(): Promise<void> {
    this._update();
  }

  isEllipsisActive = (c) => {
    return c.clientWidth < c.scrollWidth;
  };

  componentDidUpdate(
    _prevProps: any,
    prevState: Readonly<{ additional: AdditionalData | undefined }>
  ) {
    if (
      (prevState.additional?.data as any)?.currentId !==
      (this.state.additional?.data as any)?.currentId
    ) {
      const c = document.getElementsByClassName(
        styles.filename
      )[0] as HTMLDivElement;
      const shouldScroll = this.isEllipsisActive(c);
      this.setState({ scroll: shouldScroll });
    }
  }

  rehearsal() {
    return (
      <div className={styles.control}>
        <div className={styles.playback}>
          <div
            className={styles.skipPrevious}
            title="Recue"
            onClick={() => {
              this.recue(false);
            }}
          >
            <Image
              src="/skip_previous.svg"
              alt="Recue"
              width={48}
              height={48}
              style={{ transform: "scale(0.9,1.2)" }}
            />
          </div>
          <div
            className={styles.playContainer}
            onClick={() => {
              this.play();
            }}
          >
            <div className={styles.play} title="Play">
              <p>PLAY</p>
              <Image
                src="/play.svg"
                alt="Play"
                width={48}
                height={48}
                style={{ transform: "scale(1.4)" }}
              />
            </div>
          </div>
          <div
            className={styles.pause}
            title="Pause"
            onClick={() => {
              this.pause(false);
            }}
          >
            <Image
              src="/pause.svg"
              alt="Pause"
              width={48}
              height={48}
              style={{ transform: "scale(0.9,1.2)" }}
            />
          </div>
        </div>
        <div className={styles.rehearsalcontrols}>
          <div
            className={styles.arrowContainer}
            onClick={() => {
              this.setTime(
                this.current()
                  .bound({
                    lower: new SMPTE("00:00:00:00"),
                    upper: this.duration(),
                  })
                  .subtract(new SMPTE("00:00:15:00"), true)
              );
            }}
          >
            <div className={styles.fastForward}>
              <Image
                src="/fast_rewind.svg"
                alt="Fast Rewind"
                width={48}
                height={48}
                style={{ transform: "scale(1.4)" }}
              />
              <p>15</p>
            </div>
          </div>
          <div
            className={styles.arrowContainer}
            onClick={() => {
              this.setTime(
                this.current()
                  .bound({
                    lower: new SMPTE("00:00:00:00"),
                    upper: this.duration(),
                  })
                  .add(new SMPTE("00:00:15:00"), true)
              );
            }}
          >
            <div className={styles.fastForward}>
              <p>15</p>
              <Image
                src="/fast_forward.svg"
                alt="Fast Forward"
                width={48}
                height={48}
                style={{ transform: "scale(1.4)" }}
              />
            </div>
          </div>
          <div
            className={styles.arrowContainer}
            onClick={() => {
              this.setTime(
                this.duration()
                  .bound({
                    lower: new SMPTE("00:00:00:00"),
                    upper: this.duration(),
                  })
                  .subtract(new SMPTE("00:00:20:00"), true)
              );
            }}
          >
            <div className={styles.fastForward}>
              <p>20</p>
              <Image
                src="/skip_next.svg"
                alt="Skip Next"
                width={48}
                height={48}
                style={{ transform: "scale(1.4)" }}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  program() {
    return (
      <div className={styles.onaircontainer}>
        <div className={styles.onair}>
          <Image
            src="/play.svg"
            alt="Play"
            width={48}
            height={48}
            style={{ transform: "scale(1.4)" }}
          />
          <p>ON AIR</p>
        </div>
      </div>
    );
  }

  preview() {
    return (
      <div className={styles.playbackmode}>
        <div
          className={styles.skipPrevious}
          title="Recue"
          onClick={() => {
            this.recue(false);
          }}
        >
          <Image
            src="/skip_previous.svg"
            alt="Recue"
            width={48}
            height={48}
            style={{ transform: "scale(0.9,1.2)" }}
          />
        </div>
        <div
          className={styles.playContainer}
          onClick={() => {
            this.play();
          }}
        >
          <div className={styles.play} title="Play">
            <p>PLAY</p>
            <Image
              src="/play.svg"
              alt="Play"
              width={48}
              height={48}
              style={{ transform: "scale(1.4)" }}
            />
          </div>
        </div>
      </div>
    );
  }

  render() {
    return (
      <div className={styles.container}>
        <div className={styles.filename}>
          <span
            className={`${styles.marquee} ${
              this.state.scroll ? styles.scroll : ""
            }`}
          >
            {this.name()}
          </span>
        </div>
        <SeekBarComponent className={styles.seek} clock={this} />
        <div className={styles.chapters}>
          {this.state.chapters.map((value: ClockIdentifier,index:number) => (
            <ChapterComponent
              key={value.toString()}
              clock={value}
              index={index}
              manager={this.m_manager}
            />
          ))}
        </div>
        {(() => {
          if (this.m_manager.tally().rehearsal) return this.rehearsal();
          if (this.m_manager.tally().program) return this.program();
          else return this.preview();
        })()}
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
    if (settime.type === MessageClockCommand) {
      return settime.ret as boolean;
    }
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
    data.data = JSON.parse(data.data as unknown as string);
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
    // NOOP
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
  private m_manager: ClientManagerComponent;
  state: {
    currentState: CurrentClockState | undefined;
    config: (BaseClockConfig & unknown) | undefined;
    additional: AdditionalData | undefined;
    scroll: boolean;
    chapters: ClockIdentifier[];
  };
}
