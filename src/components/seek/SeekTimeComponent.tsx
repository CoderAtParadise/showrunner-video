import {
  zeroPad,
  SMPTE,
  //@ts-ignore
} from "@coderatparadise/showrunner-time";

export const SMPTEDisplayComponent = (props: {
  className?: string;
  style?: any;
  time: SMPTE;
  showFrames?: boolean;
}) => {
  if (props.showFrames) {
    return (
      <p style={props.style} className={props.className}>
        {props.time.toString()}
      </p>
    );
  } else {
    if (props.time.frameCount() === -1)
      return (
        <p style={props.style} className={props.className}>
          {"--:--:--"}
        </p>
      );
    return (
      <p
        style={props.style}
        className={props.className}
      >{`${props.time.offset()}${zeroPad(props.time.hours(), 2)}:${zeroPad(
        props.time.minutes(),
        2
      )}:${zeroPad(props.time.seconds(), 2)}`}</p>
    );
  }
};
