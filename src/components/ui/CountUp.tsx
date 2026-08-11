import { useEffect, useRef, useState } from "react";
import { animate, useInView } from "framer-motion";

interface CountUpProps {
  from?: number;
  to: number;
  duration?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}

export function CountUp({
  from = 0,
  to,
  duration = 1.5,
  decimals = 0,
  prefix = "",
  suffix = "",
  className = "",
}: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-20px" });
  const [displayValue, setDisplayValue] = useState(
    prefix + from.toFixed(decimals) + suffix
  );

  useEffect(() => {
    if (!isInView) return;

    const controls = animate(from, to, {
      duration,
      ease: [0.16, 1, 0.3, 1], // Custom smooth cubic-bezier
      onUpdate(value) {
        setDisplayValue(prefix + value.toFixed(decimals) + suffix);
      },
    });

    return () => controls.stop();
  }, [from, to, duration, decimals, prefix, suffix, isInView]);

  return (
    <span ref={ref} className={className}>
      {displayValue}
    </span>
  );
}

export default CountUp;
