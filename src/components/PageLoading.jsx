import "./PageLoading.css";

/**
 * A full-page "Loading…" on the same lavender wash as the account pages.
 * Shown while a lazily loaded page is fetched, and while a signed-in
 * session is still being read.
 */
export default function PageLoading() {
  return (
    <div className="pm-gate">
      <p className="pm-gate__text" role="status">
        Loading…
      </p>
    </div>
  );
}
