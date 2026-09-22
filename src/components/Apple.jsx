import { useId } from "react";
import "./Apple.css";

/**
 * One apple, standalone. Same drawing as the crate apples in the hero
 * scene — this version is used wherever a single object needs to appear
 * inside a demonstration. useId keeps each gradient unique.
 */
export default function Apple({ size = 44, className = "", style }) {
  const gradientId = `pm-apple-${useId()}`;

  return (
    <svg
      className={`pm-apple ${className}`}
      style={style}
      width={size}
      height={size}
      viewBox="-20 -22 40 40"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0.6" y2="1">
          <stop offset="0%" stopColor="#FFB08C" />
          <stop offset="55%" stopColor="#FE885C" />
          <stop offset="100%" stopColor="#F0662F" />
        </linearGradient>
      </defs>
      <circle r="15" fill={`url(#${gradientId})`} />
      <path
        d="M1 -14c3.4-6.4 11-7.6 13.4-5.6 1.2 3.2-4.4 9-12 7.4z"
        fill="#7D8CF2"
      />
      <ellipse
        cx="-5.4"
        cy="-5.6"
        rx="4.4"
        ry="3"
        fill="#FFFFFF"
        opacity="0.5"
        transform="rotate(-28 -5.4 -5.6)"
      />
    </svg>
  );
}
