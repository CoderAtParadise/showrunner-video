//@ts-ignore
import { IClockSource } from "@coderatparadise/showrunner-time";
import { Component } from "react";

export class CurrentChapterComponent extends Component {
  constructor(props: { className?: string; clock: IClockSource<unknown> }) {
    super(props);
    this.m_clock = props.clock;
  }
  render() {
    return <div />;
  }

  private m_clock: IClockSource<unknown>;
}
