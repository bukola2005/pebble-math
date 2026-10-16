import { Component } from "react";
import CTAButton from "./CTAButton";
import "./RouteErrorBoundary.css";

/**
 * Catches anything that goes wrong while a page loads or renders, and shows
 * a plain message with a way out instead of a white screen.
 *
 * The likely cause is a lazily loaded page whose file can't be fetched: the
 * connection dropped, or a new version of the site went live while the tab
 * was open and the old file is gone. Reloading fixes both.
 *
 * `resetKey` is the current path. Moving to another page clears the error,
 * so one page failing doesn't take the rest of the site with it.
 *
 * It has to be a class: React only offers error boundaries that way.
 */
export default class RouteErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error) {
    console.error("A page failed to load or render.", error);
  }

  componentDidUpdate(previous) {
    if (this.state.error && previous.resetKey !== this.props.resetKey) {
      this.setState({ error: null });
    }
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div className="pm-crash">
        {/* A plain link, not a router Link: a full page load is the point. */}
        <a className="pm-crash__mark" href="/">
          Pebble Math
        </a>
        <main id="main" className="pm-crash__main">
          <h1 className="pm-crash__title">This page didn’t load.</h1>
          <p className="pm-crash__text" role="alert">
            The connection may have dropped, or the site may have just been
            updated. Reloading usually fixes it.
          </p>
          <div className="pm-crash__actions">
            <CTAButton onClick={() => window.location.reload()}>
              Reload the page
            </CTAButton>
            <a className="pm-crash__home" href="/">
              Go to the home page
            </a>
          </div>
        </main>
      </div>
    );
  }
}
