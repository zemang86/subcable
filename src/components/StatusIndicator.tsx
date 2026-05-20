type StatusIndicatorProps = {
  status: "active" | "inactive";
  pulse?: boolean;
  /** Scale multiplier on the 14×14 base. 1 = 14px, 0.7 = 9.8px, 2.5 = 35px. */
  scale?: number;
  className?: string;
};

export function StatusIndicator({
  status,
  pulse = false,
  scale = 1,
  className = "",
}: StatusIndicatorProps) {
  const cls = [
    "v1-status",
    status === "inactive" ? "inactive" : "",
    pulse ? "v1-pulse" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");
  const style = scale === 1 ? undefined : { transform: `scale(${scale})` };
  return <span className={cls} style={style} aria-hidden />;
}
