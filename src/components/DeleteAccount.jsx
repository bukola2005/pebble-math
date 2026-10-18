import { useEffect, useRef, useState } from "react";
import AuthField from "./AuthField";
import { useAuth } from "../context/AuthContext";
import { deleteMyAccount, noteAccountDeleted } from "../lib/account";
import "./DeleteAccount.css";

const CONFIRM_WORD = "DELETE";

/**
 * "Delete my account", at the foot of the dashboard. Nothing happens until
 * the grown-up has typed DELETE: then the account, every child on it and
 * everything they played are removed, they are signed out, and the sign-in
 * page says it's done.
 */
export default function DeleteAccount({ childCount }) {
  const { signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [devHint, setDevHint] = useState("");
  const fieldRef = useRef(null);
  const openButton = useRef(null);
  const wasOpen = useRef(false);

  // Into the box when it opens; back to the button when it closes.
  useEffect(() => {
    if (open) fieldRef.current?.focus();
    else if (wasOpen.current) openButton.current?.focus();
    wasOpen.current = open;
  }, [open]);

  const ready = typed.trim() === CONFIRM_WORD;
  const children =
    childCount === 1 ? "the child on it" : childCount > 1 ? `all ${childCount} children on it` : "any children on it";

  const close = () => {
    setOpen(false);
    setTyped("");
    setError("");
    setDevHint("");
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    if (!ready || deleting) return;
    setDeleting(true);
    setError("");
    setDevHint("");
    try {
      const { error: failure } = await deleteMyAccount();
      if (failure) throw failure;
    } catch (failure) {
      setDeleting(false);
      setError("That didn’t work, and nothing was deleted. Please check your connection and try again.");
      if (import.meta.env.DEV) setDevHint(`${failure?.message ?? failure}. If it names delete_my_account, run that SQL in supabase/schema.sql.`);
      return;
    }
    // End the session on this device. Signed out, the dashboard sends them
    // to the sign-in page, which says the account is gone.
    noteAccountDeleted();
    await signOut().catch(() => {});
  };

  return (
    <section className="pm-delete" aria-labelledby="delete-heading">
      <h2 id="delete-heading" className="pm-delete__title">
        Delete my account
      </h2>
      <p className="pm-delete__text">
        This deletes your account and {children}, with everything they have played. It can’t be undone.
      </p>

      {!open ? (
        <button ref={openButton} type="button" className="pm-delete__open" onClick={() => setOpen(true)}>
          Delete my account
        </button>
      ) : (
        <form className="pm-delete__form" onSubmit={onSubmit} noValidate>
          <AuthField
            id="delete-confirm"
            ref={fieldRef}
            label={`Type ${CONFIRM_WORD} to confirm`}
            hint="In capital letters."
            value={typed}
            onChange={(event) => setTyped(event.target.value)}
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
          />
          {error && (
            <p className="pm-delete__alert" role="alert">
              {error}
            </p>
          )}
          {devHint && <p className="pm-delete__dev">{devHint}</p>}
          <div className="pm-delete__actions">
            <button type="submit" className="pm-delete__confirm" disabled={!ready || deleting}>
              {deleting ? "Deleting…" : "Delete everything"}
            </button>
            <button type="button" className="pm-delete__cancel" onClick={close} disabled={deleting}>
              Cancel
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
