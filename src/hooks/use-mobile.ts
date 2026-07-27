import {useEffect, useState} from "react";

const MOBILE_BREAKPOINT = 650;

// Function overloads for proper typing
function useIsMobile(queryTouch: true): {
  hasTouch: boolean | undefined;
  isSmallScreen: boolean | undefined;
};
function useIsMobile(queryTouch?: false): boolean | undefined;
function useIsMobile(queryTouch = false) {
  const [isSmallScreen, setIsSmallScreen] = useState<boolean | undefined>(undefined);
  const [hasTouch, setHasTouch] = useState<boolean | undefined>(undefined);

  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = () => {
      setIsSmallScreen(window.innerWidth < MOBILE_BREAKPOINT);
    };
    mql.addEventListener("change", onChange);
    setIsSmallScreen(window.innerWidth < MOBILE_BREAKPOINT);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    const mql = window.matchMedia(`(hover: none)`);
    const onChange = () => {
      setHasTouch(mql.matches);
    };
    mql.addEventListener("change", onChange);
    setHasTouch(mql.matches);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  if (queryTouch)
    return {
      hasTouch,
      isSmallScreen
    };

  return isSmallScreen;
}

export {useIsMobile};
