import "./SectionHeading.css";

/**
 * Eyebrow + title (+ optional lead). Every section headline on the page
 * comes through here so the rhythm stays the same.
 */
export default function SectionHeading({
  eyebrow,
  title,
  lead,
  align = "left",
  size = "md",
  className = "",
  /* The section wrapping this heading points its aria-labelledby here,
     so screen-reader landmark lists read real section names. */
  id,
}) {
  return (
    <header
      className={`pm-heading pm-heading--${align} pm-heading--${size} ${className}`}
    >
      {eyebrow && <p className="pm-heading__eyebrow">{eyebrow}</p>}
      <h2 className="pm-heading__title" id={id}>
        {title}
      </h2>
      {lead && <p className="pm-heading__lead">{lead}</p>}
    </header>
  );
}
