import "./CTAButton.css";

/**
 * The only button in the system.
 * variant="primary"   → solid orange, warm near-black label (the one action)
 * variant="secondary" → glass pill with a purple label (supporting action)
 * size="sm"           → navbar scale
 */
export default function CTAButton({
  children,
  variant = "primary",
  size = "md",
  href,
  className = "",
  ...rest
}) {
  const classes = [
    "pm-btn",
    `pm-btn--${variant}`,
    size === "sm" ? "pm-btn--sm" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  if (href) {
    return (
      <a className={classes} href={href} {...rest}>
        <span className="pm-btn__label">{children}</span>
      </a>
    );
  }

  return (
    <button type="button" className={classes} {...rest}>
      <span className="pm-btn__label">{children}</span>
    </button>
  );
}
