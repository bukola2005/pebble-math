import CTAButton from "./CTAButton";
import "./OnboardingStep.css";

/**
 * The shell every onboarding step shares: a counter, a question, the
 * step’s own content, and the two actions.
 */
export default function OnboardingStep({
  index,
  total,
  title,
  sub,
  children,
  onBack,
  onNext,
  nextLabel = "Continue",
  nextDisabled = false,
}) {
  return (
    <div className="pm-step">
      {index != null && (
        <p className="pm-step__count">
          Step {index} of {total}
        </p>
      )}

      <h2 className="pm-step__title">{title}</h2>
      {sub && <p className="pm-step__sub">{sub}</p>}

      <div className="pm-step__body">{children}</div>

      <div className="pm-step__actions">
        {onBack && (
          <button type="button" className="pm-step__back" onClick={onBack}>
            Back
          </button>
        )}
        {onNext && (
          <CTAButton onClick={onNext} disabled={nextDisabled}>
            {nextLabel}
          </CTAButton>
        )}
      </div>
    </div>
  );
}
