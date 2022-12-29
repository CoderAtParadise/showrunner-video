import { ReactNode } from "react";
import { HorizontalScrollable } from "./HorizontalScrollable";
import { VerticalScrollable } from "./VerticalScrollable";

export const Scrollable = (props: {
  className?: string;
  children?: ReactNode;
  activeIndex?: number | (() => number);
  direction: "horizontal" | "vertical";
}) => {
  return props.direction === "horizontal" ? (
    <HorizontalScrollable
      className={props.className}
      activeIndex={props.activeIndex}
    >
      {props.children}
    </HorizontalScrollable>
  ) : (
    <VerticalScrollable
      className={props.className}
      activeIndex={props.activeIndex}
    >
      {props.children}
    </VerticalScrollable>
  );
};
