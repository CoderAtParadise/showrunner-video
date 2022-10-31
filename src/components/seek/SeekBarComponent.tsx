//@ts-ignore
import { IClockSource, SMPTE } from "@coderatparadise/showrunner-time";
//@ts-ignore
import { CurrentDurationComponent,SMPTEComponent } from "@coderatparadise/showrunner-time/extension";
import { useCallback, useState, MouseEvent, useRef } from "react";
import styles from "styles/Seek.module.css";

export const SeekBarComponent = (props: {
  className?: string;
  clock: IClockSource<unknown>;
}) => {
  const [isHovering, setHovering] = useState(false);
  const [seekPosition, setSeekPosition] = useState(0);
  const [hoverTime, setHoverTime] = useState(0);
  const position =
    (props.clock.current().frameCount() / props.clock.duration().frameCount()) *
    100;

  const hoverRef = useRef<HTMLDivElement>(null);

  const handleMouseOver = useCallback(() => {
    setHovering(true);
  }, []);
  const handleMouseOut = useCallback(() => {
    setHovering(false);
  }, []);

  const onMouseMove = useCallback(
    (e: MouseEvent<HTMLDivElement>) => {
      let rect = (hoverRef.current as HTMLDivElement).getBoundingClientRect();
      const x = e.clientX - rect.left;
      const x1 = x < 0 ? 0 : x > rect.width ? rect.width : x;
      setSeekPosition(x1);
      var percentage = 1 - (rect.width - x1) / rect.width;
      const time = Math.floor(percentage * props.clock.duration().frameCount());
      setHoverTime(time);
    },
    [props.clock]
  );

  const sendTime = useCallback(() => {
    if (isHovering)
      props.clock.setTime(new SMPTE(hoverTime, props.clock.frameRate()));
  }, [props.clock, hoverTime, isHovering]);

  return (
    <div className={`${props.className} ${styles.container}`}>
      <CurrentDurationComponent
        clock={props.clock}
        show="current"
        className={`${styles.time}`}
      />
      <div
        className={`${props.className} ${styles.progressContainer}`}
        onMouseOver={handleMouseOver}
        onMouseOut={handleMouseOut}
        onMouseMove={onMouseMove}
        onClick={sendTime}
      >
        <div
          ref={hoverRef}
          className={`${props.className} ${styles.progressEmpty}`}
        >
          <div
            className={`${styles.progressComplete}`}
            style={{ width: `${position}%` }}
          />
        </div>
        <span
          className={`${props.className} ${styles.position}`}
          style={{
            left: `${seekPosition < 0 ? 0 : seekPosition + 5}px`,
          }}
          data-hovering={isHovering}
        >
          <div className={styles.seek} />
          <SMPTEComponent
            className={styles.seekTime}
            time={new SMPTE(hoverTime, props.clock.frameRate())}
          />
        </span>
      </div>
      <CurrentDurationComponent
        clock={props.clock}
        show="duration"
        className={`${props.className} ${styles.time}`}
      />
    </div>
  );
};
