//@ts-ignore
import { IClockSource } from "@coderatparadise/showrunner-time";
//@ts-ignore
import { DisplayTimeComponent } from "@coderatparadise/showrunner-time/extension";
import styles from "styles/Seek.module.css";

export const SeekBarComponent = (props: {
  className?: string;
  clock: IClockSource<unknown>;
}) => {
  // const [isHovering, setHovering] = useState(false);
  // const [hoveringPosition, setHoveringPostion] = useState(0);
  const position =
    (props.clock.current().frameCount() / props.clock.duration().frameCount()) *
    100;
  return (
    <div className={`${props.className} ${styles.container}`}>
      <DisplayTimeComponent
        clock={props.clock}
        show="current"
        className={`${styles.time}`}
      />
      <div className={`${props.className} ${styles.progressContainer}`}>
        <div className={`${props.className} ${styles.progressEmpty}`}>
          <span
            className={`${props.className} ${styles.position}`}
            style={{ left: `${position - 5 < 0 ? 0 : position - 5}%` }}
          />
          <div
            className={`${props.className} ${styles.progressComplete}`}
            style={{ width: `${position}%` }}
          />
        </div>
      </div>
      <DisplayTimeComponent
        clock={props.clock}
        show="duration"
        className={`${props.className} ${styles.time}`}
      />
    </div>
  );
};
