import { ReactNode } from "react";
import { HorizontalScrollable } from "./HorizontalScrollable";
import { VerticalScrollable } from "./VerticalScrollable";


export const Scrollable = (props: {
    className?: string;
    children?: ReactNode;
    direction: "horizontal" | 'vertical'
  }) => {
    return props.direction === "horizontal" ? <HorizontalScrollable className={props.className}>{props.children}</HorizontalScrollable> : <VerticalScrollable className={props.className}>{props.children}</VerticalScrollable>
}