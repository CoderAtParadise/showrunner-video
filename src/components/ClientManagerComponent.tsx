import {
  AsyncUtils,
  DispatchInfo,
  DispatchReturn,
  //@ts-ignore
} from "@coderatparadise/showrunner-network";
import {
  ClockIdentifier,
  ClockLookup,
  IClockManager,
  IClockSource,
  ManagerIdentifier,
  MessageClockCommand,
  MessageClockConfig,
  MessageClockCue,
  MessageClockCurrent,
  MessageClockData,
  MessageClockPause,
  MessageClockPlay,
  MessageClockRecue,
  MessageClockSetTime,
  MessageClockStop,
  MessageClockUncue,
  MessageClockChapter,
  SMPTE,
  //@ts-ignore
} from "@coderatparadise/showrunner-time";
import { Component, Fragment, ReactElement } from "react";
import { trpcClient } from "../utils/trpc";
import Router from "next/router";
import {
  ClockConfigCodec,
  ClockCurrentStateCodec,
  ClockDataCodec,
  //@ts-ignore
} from "@coderatparadise/showrunner-time/codec";
import { ClientClockSourceComponent } from "./ClientClockSourceComponent";
import { DisplayCurrentControlComponent } from "./DisplayCurrentControlComponent";

import styles from "../styles/Channel.module.css";
import { VerticalScrollable } from "./scrollable/VerticalScrollable";
import { TallyComponent } from "./TallyComponent";
import Image from "next/image";

export interface ChapterSync {
  //eslint-disable-next-line
  _syncChapters: (chapters: string[]) => void;
}

export class ClientManagerComponent
  extends Component<{ id: string; children?: ReactElement }>
  implements IClockManager
{
  constructor(props: { id: string; children?: ReactElement }) {
    super(props);
    this.m_id = props.id;
  }

  identifier(): ManagerIdentifier {
    return new ManagerIdentifier("video", "video", this.m_id);
  }

  async componentDidMount(): Promise<void> {
    try {
      //@ts-ignore
      const name: string = await trpcClient.managerName.query(
        this.identifier()
      );
      this.setState({ name: name });
      const self = this;
      //@ts-ignore
      await trpcClient.list.subscribe(
        { lookup: this.identifier(), filter: "ampvideoctrl" },
        {
          onData(videos: string[]) {
            const map: Map<ClockLookup, IClockSource<any> | undefined> =
              new Map<ClockLookup, IClockSource<any> | undefined>();
            videos.forEach((video: string) => {
              map.set(video as ClockLookup, undefined);
            });
            self.setState({ videos: map });
          },
        }
      );
      //@ts-ignore
      trpcClient.tally.subscribe(this.identifier(), {
        onData(tally: {
          rehearsal: boolean;
          preview: boolean;
          program: boolean;
        }) {
          self.setState({ tally: tally });
        },
      });
    } catch (err) {
      Router.push("/");
    }
  }

  render() {
    return (
      <div
        className={styles.container}
        data-tallypreview={this.tally().preview}
        data-tallyprogram={this.tally().program}
      >
        <div className={styles.config}>
          {this.tally().rehearsal ? (
            <Image
              src="/rehearsal_on.svg"
              alt="Reheasal Mode On"
              width={48}
              height={48}
              style={{ transform: "scale(0.4)" }}
              onClick={() => {
                //@ts-ignore
                trpcClient.setRehearsalMode.mutate({
                  identifier: this.identifier(),
                  rehearsal: false,
                });
              }}
            />
          ) : (
            <Image
              src="/rehearsal_off.svg"
              alt="Reheasal Mode On"
              width={48}
              height={48}
              style={{ transform: "scale(0.4)" }}
              onClick={() => {
                //@ts-ignore
                trpcClient.setRehearsalMode.mutate({
                  identifier: this.identifier(),
                  rehearsal: true,
                });
              }}
            />
          )}
        </div>
        <div className={styles.control}>
          <TallyComponent tally={this.tally()} name={this.name()} />
          <DisplayCurrentControlComponent
            key={new ClockIdentifier(
              this.identifier(),
              "current",
              "current"
            ).toString()}
            id={new ClockIdentifier(this.identifier(), "current", "current")}
            manager={this}
          />
        </div>
        <hr className={styles.hidden} />
        <div className={styles.videos}>
          <p />
          <VerticalScrollable className={styles.scrollable}>
            {this.list().map((id: ClockLookup) => {
              console.log(id);
              const identifier = new ClockIdentifier(id);
              return identifier.type() !== "current" ? (
                <Fragment key={id}>
                  <ClientClockSourceComponent id={identifier} manager={this} />
                  <p />
                </Fragment>
              ) : null;
            })}
          </VerticalScrollable>
        </div>
        <div className={styles.remote}>
          <li className={styles.bullet}>
            <span>REMOTE</span>
          </li>
        </div>
      </div>
    );
  }

  name(): string {
    return this.state.name;
  }
  /* eslint-disable no-unused-vars */
  cue(id: ClockIdentifier): Promise<boolean> {
    //@ts-ignore
    return trpcClient.cue.mutate(id);
  }

  uncue(id: ClockIdentifier): Promise<boolean> {
    //@ts-ignore
    return trpcClient.uncue.mutate(id);
  }

  play(id: ClockIdentifier): Promise<boolean> {
    //@ts-ignore
    return trpcClient.play.mutate(id);
  }

  pause(id: ClockIdentifier, override: boolean): Promise<boolean> {
    //@ts-ignore
    return trpcClient.pause.mutate({ lookup: id, override });
  }

  async stop(id: ClockIdentifier, override: boolean): Promise<boolean> {
    //@ts-ignore
    return await trpcClient.stop.mutate({ lookup: id, override });
  }

  async recue(id: ClockIdentifier, override: boolean): Promise<boolean> {
    //@ts-ignore
    return await trpcClient.recue.mutate({ lookup: id, override });
  }

  async setTime(id: ClockIdentifier, time: SMPTE): Promise<boolean> {
    //@ts-ignore
    return await trpcClient.setTime.mutate({ lookup: id, time: time });
  }

  async chapters(id: ClockIdentifier): Promise<ClockIdentifier[]> {
    const clock = this.request(id);
    if (clock) return await clock.chapters();
    return AsyncUtils.typeReturn<ClockIdentifier[]>([]);
  }

  async addChapter(
    id: ClockIdentifier,
    chapter: ClockIdentifier
  ): Promise<boolean> {
    //@ts-ignore
    return await trpcClient.addChapter.mutate({ lookup: id, chapter: chapter });
  }

  async removeChapter(
    id: ClockIdentifier,
    chapter: ClockIdentifier
  ): Promise<boolean> {
    //@ts-ignore
    return await trpcClient.removeChapter.mutate({
      lookup: id,
      chapter: chapter,
    });
  }

  _sortChapters(): void {
    //NOOP
  }

  request(id: ClockIdentifier): IClockSource<unknown> | undefined {
    return this.state.videos.get(id.toString());
  }

  list(): ClockLookup[] {
    return Array.from(this.state.videos.keys());
  }

  add(clock: IClockSource): boolean {
    this.state.videos.set(
      clock.identifier().toString(),
      clock as ClientClockSourceComponent
    );
    this.setState({ videos: this.state.videos });
    return true;
  }

  remove(): boolean {
    return false;
  }

  startUpdating(): void {
    throw new Error("Function not implemented.");
  }

  stopUpdating(): void {
    throw new Error("Function not implemented.");
  }

  update(): void {
    // HOP;
  }

  tally(): { rehearsal: boolean; preview: boolean; program: boolean } {
    return this.state.tally;
  }

  async dispatch(
    dispatchInfo: DispatchInfo,
    ...args: any
  ): Promise<DispatchReturn> {
    if (dispatchInfo.handler === "network") {
      switch (dispatchInfo.type) {
        case MessageClockCue:
          return {
            type: MessageClockCommand,
            ret: this.cue(args[0]),
          };
        case MessageClockUncue:
          return {
            type: MessageClockCommand,
            ret: this.uncue(args[0]),
          };
        case MessageClockPlay:
          return {
            type: MessageClockCommand,
            ret: this.play(args[0]),
          };
        case MessageClockPause:
          return {
            type: MessageClockCommand,
            ret: this.pause(args[0], args[1]),
          };
        case MessageClockStop:
          return {
            type: MessageClockCommand,
            ret: this.stop(args[0], args[1]),
          };
        case MessageClockRecue:
          return {
            type: MessageClockCommand,
            ret: this.recue(args[0], args[1]),
          };
        case MessageClockSetTime:
          return {
            type: MessageClockCommand,
            ret: this.setTime(args[0], args[1]),
          };
        case MessageClockChapter:
          return {
            type: MessageClockChapter,
            ret: (async () => {
              const id = args[0];
              const clock = await this.request(id);
              if (clock) {
                //@ts-ignore
                await trpcClient.chapters.subscribe(id, {
                  onData(data) {
                    if ((clock as unknown as ChapterSync)._syncChapters)
                      (clock as unknown as ChapterSync)._syncChapters(data);
                  },
                });
              }
            })(),
          };
        case MessageClockData:
          return {
            type: MessageClockData,
            ret: (async () => {
              const id = args[0];
              const clock = await this.request(id);
              if (clock) {
                //@ts-ignore
                await trpcClient.data.subscribe(id, {
                  onData(data) {
                    ClockDataCodec.deserialize(data, clock);
                  },
                });
              }
            })(),
          };
        case MessageClockCurrent:
          return {
            type: MessageClockCurrent,
            ret: (async () => {
              const id = args[0];
              const clock = await this.request(id);
              if (clock) {
                //@ts-ignore
                await trpcClient.current.subscribe(id, {
                  onData(data) {
                    ClockCurrentStateCodec.deserialize(data, clock);
                  },
                });
              }
            })(),
          };
        case MessageClockConfig:
          return {
            type: MessageClockConfig,
            ret: (async () => {
              const id = args[0];
              const clock = await this.request(id);
              if (clock) {
                //@ts-ignore
                await trpcClient.config.subscribe(id, {
                  onData(data) {
                    ClockConfigCodec.deserialize(data, clock);
                  },
                });
              }
            })(),
          };
      }
    }
    return { type: "invalid:invalid", ret: [] };
  }

  listen(
    dispatchInfo: DispatchInfo,
    f: (dispatchReturn: DispatchReturn) => void
  ): void {}

  stopListening(
    dispatchInfo: DispatchInfo,
    f: (dispatchReturn: DispatchReturn) => void
  ): void {}

  state: {
    name: string;
    videos: Map<ClockLookup, IClockSource<any> | undefined>;
    chapters: Map<ClockLookup, ClockIdentifier[]>;
    tally: { rehearsal: boolean; preview: boolean; program: boolean };
    lockTime: number;
  } = {
    name: "",
    videos: new Map<ClockLookup, IClockSource<any> | undefined>(),
    chapters: new Map<ClockLookup, ClockIdentifier[]>(),
    tally: { rehearsal: true, preview: false, program: false },
    lockTime: 0,
  };
  private m_id: string;
}
