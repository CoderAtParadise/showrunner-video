import styles from "../styles/Tally.module.css";

export const TallyComponent = (props: {
  className?: string;
  tally: { preview: boolean; program: boolean };
  name: string;
}) => {
  return (
    <div
      className={styles.tally}
      data-tallypreview={props.tally.preview}
      data-tallyprogram={props.tally.program}
    >
      <span>{props.name}</span>
    </div>
  );
};
