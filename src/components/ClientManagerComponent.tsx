import {
  DispatchInfo,
  DispatchReturn,
  //@ts-ignore
} from "@coderatparadise/showrunner-network";
import {
  ClockLookup,
  IClockManager,
  IClockSource,
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
  SMPTE,
  ControlMode,
  //@ts-ignore
} from "@coderatparadise/showrunner-time";
import { Component, Fragment, ReactElement } from "react";
import { trpcClient } from "../utils/trpc";
import Router from "next/router";
import Image from "next/image";
import {
  ClockConfigCodec,
  ClockCurrentStateCodec,
  ClockDataCodec,
  ClockIdentifierCodec,
  //@ts-ignore
} from "@coderatparadise/showrunner-time/codec";
import { ClientClockSourceComponent } from "./ClientClockSourceComponent";
import { DisplayCurrentControlComponent } from "./DisplayCurrentControlComponent";

import styles from "../styles/Channel.module.css";
import { VerticalScrollable } from "./scrollable/VerticalScrollable";

export class ClientManagerComponent
  extends Component<{ id: string; children?: ReactElement }>
  implements IClockManager
{
  constructor(props: { id: string; children?: ReactElement }) {
    super(props);
    this.m_id = props.id;
  }

  async componentDidMount(): Promise<void> {
    try {
      //@ts-ignore
      const name: string = await trpcClient.managerName.query(this.m_id);
      this.setState({ name: name });
      const self = this;
      //@ts-ignore
      await trpcClient.list.subscribe(
        { lookup: this.m_id, filter: "ampvideoctrl" },
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
      await trpcClient.controlMode.subscribe(this.m_id, {
        onData(mode: string) {
          self.setState({ controlMode: mode as ControlMode });
        },
      });
    } catch (err) {
      Router.push("/");
    }
  }

  render() {
    return (
      <div className={styles.container} data-controlmode={this.controlMode()}>
        <div className={styles.control}>
          <div className={styles.status} data-controlmode={this.controlMode()}>
            <p>{this.name()}</p>
          </div>
          <DisplayCurrentControlComponent
            key={`video:video:${this.id()}:current:ampcurrentctrl`}
            id={`video:video:${this.id()}:current:ampcurrentctrl`}
            manager={this}
          />
        </div>
        <hr className={styles.hidden} />
        <div className={styles.videos}>
          <p />
          <VerticalScrollable className={styles.scrollable}>
            {this.list().map((id: ClockLookup) =>
              ClockIdentifierCodec.deserialize(id).type !== "ampcurrentctrl" ? (
                <Fragment key={id}>
                  <ClientClockSourceComponent id={id} manager={this} />
                  <p />
                </Fragment>
              ) : null
            )}
          </VerticalScrollable>
        </div>
        <div className={styles.remote}>
          <li className={styles.bullet}>
            <span>REMOTE</span>
          </li>
        </div>
        <div
          className={styles.lockedContainer}
          data-locked={this.controlMode()}
          onMouseUp={() => this.setState({ lockTime: 0 })}
        >
          <div className={styles.locked}>
            <Image
              src="/locked.svg"
              alt="Locked"
              width={48}
              height={48}
              style={{ transform: "scale(1.1,1.1)" }}
            />
          </div>
        </div>
      </div>
    );
  }

  id(): string {
    return this.m_id;
  }

  name(): string {
    return this.state.name;
  }
  /* eslint-disable no-unused-vars */
  cue(id: ClockLookup): Promise<boolean> {
    //@ts-ignore
    return trpcClient.cue.mutate(id);
  }

  uncue(id: ClockLookup): Promise<boolean> {
    //@ts-ignore
    return trpcClient.uncue.mutate(id);
  }

  play(id: ClockLookup): Promise<boolean> {
    //@ts-ignore
    return trpcClient.play.mutate(id);
  }

  pause(id: ClockLookup, override: boolean): Promise<boolean> {
    //@ts-ignore
    return trpcClient.pause.mutate({ lookup: id, override });
  }

  stop(id: ClockLookup, override: boolean): Promise<boolean> {
    //@ts-ignore
    return trpcClient.stop.mutate({ lookup: id, override });
  }

  recue(id: ClockLookup, override: boolean): Promise<boolean> {
    //@ts-ignore
    return trpcClient.recue.mutate({ lookup: id, override });
  }

  setTime(id: ClockLookup, time: SMPTE): Promise<boolean> {
    //@ts-ignore
    return trpcClient.setTime.mutate({ lookup: id, time: time.toString() });
  }

  request(id: ClockLookup): IClockSource<unknown> | undefined {
    return this.state.videos.get(id);
  }

  list(): ClockLookup[] {
    return Array.from(this.state.videos.keys());
  }

  add(clock: IClockSource): boolean {
    this.state.videos.set(
      ClockIdentifierCodec.serialize(clock.identifier()) as ClockLookup,
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

  async dispatch(
    dispatchInfo: DispatchInfo,
    ...args: any
  ): Promise<DispatchReturn> {
    if (dispatchInfo.handler === "network") {
      switch (dispatchInfo.type) {
        case MessageClockCue:
          return {
            type: MessageClockCommand,
            ret: this.cue(
              ClockIdentifierCodec.serialize(args[0]) as ClockLookup
            ),
          };
        case MessageClockUncue:
          return {
            type: MessageClockCommand,
            ret: this.uncue(
              ClockIdentifierCodec.serialize(args[0]) as ClockLookup
            ),
          };
        case MessageClockPlay:
          return {
            type: MessageClockCommand,
            ret: this.play(
              ClockIdentifierCodec.serialize(args[0]) as ClockLookup
            ),
          };
        case MessageClockPause:
          return {
            type: MessageClockCommand,
            ret: this.pause(
              ClockIdentifierCodec.serialize(args[0]) as ClockLookup,
              args[1]
            ),
          };
        case MessageClockStop:
          return {
            type: MessageClockCommand,
            ret: this.stop(
              ClockIdentifierCodec.serialize(args[0]) as ClockLookup,
              args[1]
            ),
          };
        case MessageClockRecue:
          return {
            type: MessageClockCommand,
            ret: this.recue(
              ClockIdentifierCodec.serialize(args[0]) as ClockLookup,
              args[1]
            ),
          };
        case MessageClockSetTime:
          return {
            type: MessageClockCommand,
            ret: this.setTime(
              ClockIdentifierCodec.serialize(args[0]) as ClockLookup,
              args[1]
            ),
          };
        case MessageClockData:
          return {
            type: MessageClockData,
            ret: (async () => {
              const id = ClockIdentifierCodec.serialize(args[0]) as ClockLookup;
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
              const id = ClockIdentifierCodec.serialize(args[0]) as ClockLookup;
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
            type: MessageClockCurrent,
            ret: (async () => {
              const id = ClockIdentifierCodec.serialize(args[0]) as ClockLookup;
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
    controlMode: ControlMode;
    lockTime: number;
  } = {
    name: "",
    videos: new Map<ClockLookup, IClockSource<any> | undefined>(),
    controlMode: ControlMode.Rehearsal,
    lockTime: 0,
  };

  controlMode(): ControlMode {
    // return ControlMode.Playback;
    return this.state.controlMode;
  }

  async setControlMode(mode: ControlMode): Promise<boolean> {
    //@ts-ignore
    return await trpcClient.setControlMode.mutate({
      id: this.m_id,
      controlMode: mode,
    });
  }

  private m_id: string;
}
