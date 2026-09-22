import "./GlassPanel.css";

/**
 * A translucent surface. Used as an accent — floating chips, the
 * eyebrow pill, the mobile menu — never as a whole page section.
 */
export default function GlassPanel({
  children,
  as: Tag = "div",
  className = "",
  ...rest
}) {
  return (
    <Tag className={`pm-glass ${className}`} {...rest}>
      {children}
    </Tag>
  );
}
