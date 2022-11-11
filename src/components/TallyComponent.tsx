import styles from "../styles/Tally.module.css";

export const TallyComponent = (props: {
  className?: string;
  tally: { preview: boolean; program: boolean };
  name: string;
}) => {
  return (
    <div
      className={styles.tally}
      data-tallyPreview={props.tally.preview}
      data-tallyProgram={props.tally.program}
    >
      <p>{props.name}</p>
    </div>
  );
};
