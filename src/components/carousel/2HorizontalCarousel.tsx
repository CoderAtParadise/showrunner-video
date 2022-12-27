// import {
//   ReactNode,
//   Children,
//   useState,
//   useEffect,
//   useCallback,
//   useRef,
// } from "react";

// import styles from "../../styles/Carousel.module.css";

// const SCROLL_BOX_MIN_WIDTH = 5;

// export const HorizontalCarousel = (props: {
//   className?: string;
//   children?: ReactNode;
//   activeIndex?: number | (() => number);
// }) => {
//   const getActiveIndex = () => {
//     return props.activeIndex
//       ? typeof props.activeIndex === "function"
//         ? props.activeIndex()
//         : props.activeIndex
//       : 0;
//   };
//   const [hovering, setHovering] = useState(false);
//   const [viewIndex, setViewIndex] = useState(getActiveIndex());
//   const [activeIndex, setActiveIndex] = useState(getActiveIndex());
//   const [scrollBoxWidth, setScrollBoxWidth] = useState(SCROLL_BOX_MIN_WIDTH);
//   const [scrollBoxLeft, setScrollBoxLeft] = useState(0);

//   useEffect(() => {
//     setInterval(() => {
//       const newIndex = getActiveIndex();
//       if (activeIndex !== newIndex) {
//         setActiveIndex(newIndex);
//         setViewIndex(newIndex);
//       }
//     }, 1000);
//     // eslint-disable-next-line  react-hooks/exhaustive-deps
//   }, []);

//   const handleMouseOver = useCallback(() => {
//     setHovering(true);
//   }, []);
//   const handleMouseOut = useCallback(() => {
//     setHovering(false);
//   }, []);

//   const handleScroll = useCallback(() => {
//     if (!scrollHostRef) return;
//     const scrollHostElement = scrollHostRef.current as HTMLDivElement;
//     const { scrollLeft, scrollWidth, offsetWidth } = scrollHostElement;
//     let newLeft = (scrollLeft / scrollWidth) * offsetWidth;
//     newLeft = Math.min(newLeft, offsetWidth - scrollBoxWidth);
//     setScrollBoxLeft(newLeft);
//   }, [scrollBoxWidth]);

//   const setScrollWidth = useCallback(() => {
//     const scrollHostElement = scrollHostRef.current;
//     const { clientWidth, scrollWidth } = scrollHostElement as HTMLDivElement;
//     const scrollBoxPercentage =
//       scrollWidth !== 0 ? clientWidth / scrollWidth : 0;
//     const scrollbarWidth = Math.max(
//       scrollBoxPercentage * clientWidth,
//       SCROLL_BOX_MIN_WIDTH
//     );
//     setScrollBoxWidth(scrollbarWidth);
//   }, []);

//   useEffect(() => {
//     setScrollWidth();
//     const scrollHostElement = scrollHostRef.current;
//     window.addEventListener("resize", setScrollWidth, true);
//     scrollHostElement?.addEventListener("scroll", handleScroll, true);
//     return () => {
//       window.removeEventListener("resize", setScrollWidth, true);
//       scrollHostElement?.removeEventListener("scroll", handleScroll, true);
//     };
//   }, [handleScroll, props.children, setScrollWidth]);

//   const scrollHostRef = useRef<HTMLDivElement>(null);

//   return (
//     <div
//       className={`${props.className} ${styles.container}`}
//       onMouseOver={handleMouseOver}
//       onMouseOut={handleMouseOut}
//     >
//       <div className={`${styles.reset}`}></div>
//       <span ref={scrollHostRef} className={styles.scrollHost}>
//         {Children.map(props.children, (child, index) => {
//           return (
//             <span ref={undefined} key={index}>
//               {child}
//             </span>
//           );
//         })}
//       </span>
//     </div>
//   );
// };

export {};
