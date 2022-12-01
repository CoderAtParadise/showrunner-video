import {
  BaseClockConfig,
  ChapterSettings,
  ClockIdentifier,
  ClockStatus,
  FrameRate,
  IClockManager,
  IClockSource,
  SMPTE,
  //@ts-ignore
} from "@coderatparadise/showrunner-time";
import {
  AdditionalData,
  CurrentClockState,
  //@ts-ignore
} from "@coderatparadise/showrunner-time/codec";
import { Component } from "react";

export class ChapterComponent
  extends Component<{ id: ClockIdentifier; manager: IClockManager }>
  implements IClockSource<ChapterSettings>
{
  constructor(props: { id: ClockIdentifier; manager: IClockManager }) {
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
    return <div />;
  }

  config(): BaseClockConfig & ChapterSettings {
    return this.state.config || { name: "", time: new SMPTE() };
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

  async _update(): Promise<void> {
    //NOOP
  }

  private m_id: ClockIdentifier;
  private m_manager: IClockManager;
  state: {
    currentState: CurrentClockState | undefined;
    config: (BaseClockConfig & ChapterSettings) | undefined;
    additional: AdditionalData | undefined;
  };
}
