import {
  CSSProperties,
  ReactNode,
  useCallback,
  useRef,
  useEffect,
  useState,
  MouseEvent,
} from "react";
import styles from "../../styles/Carousel.module.css";

interface ScrollThumbCSSProperties extends CSSProperties {
  "--thumb-width": number;
  "--thumb-left": number;
}

const SCROLL_BOX_MIN_WIDTH = 5;

export const HorizontalCarousel = (props: {
  className?: string;
  children?: ReactNode;
  activeIndex: number | (() => number);
}) => {
  const [hovering, setHovering] = useState(false);
  const [scrollBoxWidth, setScrollBoxWidth] = useState(SCROLL_BOX_MIN_WIDTH);
  const [scrollBoxLeft, setScrollBoxLeft] = useState(0);
  const [lastScrollThumbPosition, setScrollThumbPosition] = useState(0);
  const [isDragging, setDragging] = useState(false);
  const handleMouseOver = useCallback(() => {
    setHovering(true);
  }, []);
  const handleMouseOut = useCallback(() => {
    setHovering(false);
  }, []);

  const handleDocumentMouseUp = useCallback(
    (e: any) => {
      if (isDragging) {
        e.preventDefault();
        setDragging(false);
      }
    },
    [isDragging]
  );

  const handleDocumentMouseMove = useCallback(
    (e: any) => {
      if (isDragging) {
        e.preventDefault();
        e.stopPropagation();
        const scrollHostElement = scrollHostRef.current as HTMLDivElement;
        const { scrollWidth, offsetWidth } = scrollHostElement;

        const deltaX = e.clientX - lastScrollThumbPosition;
        const percentage = deltaX * (scrollWidth / offsetWidth);
        setScrollThumbPosition(e.clientX);
        setScrollBoxLeft(
          Math.min(
            Math.max(0, scrollBoxLeft + deltaX),
            offsetWidth - scrollBoxWidth
          )
        );
        scrollHostElement.scrollLeft = Math.min(
          scrollHostElement.scrollLeft + percentage,
          scrollWidth - offsetWidth
        );
      }
    },
    [isDragging, lastScrollThumbPosition, scrollBoxLeft, scrollBoxWidth]
  );

  const shouldDisplayScroll = useCallback(() => {
    if (!scrollHostRef) return false;
    const scrollHostElement = scrollHostRef.current as HTMLDivElement;
    const { clientWidth, scrollWidth } = scrollHostElement;
    return clientWidth < scrollWidth;
  }, []);

  const handleScrollThumbMouseDown = useCallback(
    (e: MouseEvent<HTMLDivElement>) => {
      if (shouldDisplayScroll()) {
        e.preventDefault();
        e.stopPropagation();
        setScrollThumbPosition(e.clientX);
        setDragging(true);
      }
    },
    [shouldDisplayScroll]
  );
  const handleScroll = useCallback(
    (e) => {
      if (!scrollHostRef) return;
      const scrollHostElement = scrollHostRef.current as HTMLDivElement;
      if (e.deltaY == 0) return;
      e.preventDefault();
      scrollHostElement.scrollBy({ left: e.deltaY < 0 ? -20 : 20 });
      const { scrollLeft, scrollWidth, offsetWidth } = scrollHostElement;
      let newLeft = (scrollLeft / scrollWidth) * offsetWidth;
      newLeft = Math.min(newLeft, offsetWidth - scrollBoxWidth);
      setScrollBoxLeft(newLeft);
    },
    [scrollBoxWidth]
  );

  const scrollHostRef = useRef<HTMLDivElement>(null);
  const setscrollWidth = useCallback(() => {
    const scrollHostElement = scrollHostRef.current;
    const { clientWidth, scrollWidth } = scrollHostElement as HTMLDivElement;
    const scrollBoxPercentage =
      scrollWidth !== 0 ? clientWidth / scrollWidth : 0;
    const scrollbarWidth = Math.max(
      scrollBoxPercentage * clientWidth,
      SCROLL_BOX_MIN_WIDTH
    );
    setScrollBoxWidth(scrollbarWidth);
  }, []);

  useEffect(() => {
    const getActiveIndex = () => {
      return typeof props.activeIndex === "function"
        ? props.activeIndex()
        : props.activeIndex;
    };
    if (!isDragging && !hovering) {
      setTimeout(() => {
        if (!scrollHostRef) return;
        const scrollHostElement = scrollHostRef.current as HTMLDivElement;
        const { scrollWidth,offsetWidth } = scrollHostElement;
        const childElement = scrollHostElement.children[
          getActiveIndex()
        ] as HTMLDivElement;
        if (childElement) {
          let newLeft = (childElement.offsetLeft - lastScrollThumbPosition / scrollWidth) * offsetWidth;
          newLeft = Math.min(
            newLeft,
            offsetWidth - scrollBoxWidth
          );
          setScrollBoxLeft(newLeft);
          scrollHostElement.scrollLeft = newLeft; 
        }
      }, 500);
    }
  }, [isDragging, hovering, props, scrollBoxWidth, lastScrollThumbPosition]);

  useEffect(() => {
    setscrollWidth();
    const scrollHostElement = scrollHostRef.current;
    window.addEventListener("resize", setscrollWidth, true);
    scrollHostElement?.addEventListener("wheel", handleScroll, {
      capture: true,
      passive: false,
    });
    return () => {
      window.removeEventListener("resize", setscrollWidth, true);
      scrollHostElement?.removeEventListener("wheel", handleScroll, true);
    };
  }, [handleScroll, props.children, setscrollWidth]);

  useEffect(() => {
    document.addEventListener("mousemove", handleDocumentMouseMove);
    document.addEventListener("mouseup", handleDocumentMouseUp);
    document.addEventListener("mouseleave", handleDocumentMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleDocumentMouseMove);
      document.removeEventListener("mouseup", handleDocumentMouseUp);
      document.removeEventListener("mouseleave", handleDocumentMouseUp);
    };
  }, [handleDocumentMouseMove, handleDocumentMouseUp]);
  const thumbStyle: ScrollThumbCSSProperties = {
    "--thumb-width": scrollBoxWidth,
    "--thumb-left": scrollBoxLeft,
  };
  return (
    <div
      className={`${styles.scrollContainer} ${props.className}`}
      onMouseOver={handleMouseOver}
      onMouseOut={handleMouseOut}
    >
      <div
        ref={scrollHostRef}
        data-type="horizontal"
        className={styles.scrollHost}
      >
        {props.children}
      </div>
      <div
        className={styles.scrollbar}
        data-type="horizontal"
        data-hovering={(hovering && shouldDisplayScroll()) || isDragging}
      >
        <div
          className={styles.scrollThumb}
          data-type={`horizontal`}
          style={thumbStyle}
          onMouseDown={handleScrollThumbMouseDown}
        />
      </div>
    </div>
  );
};
