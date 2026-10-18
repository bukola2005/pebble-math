import { Fragment } from "react";
import { Link } from "react-router-dom";
import draft from "../../docs/privacy-and-terms-draft.md?raw";
import { useDocumentTitle } from "../lib/useDocumentTitle";
import "./LegalPage.css";

/*
  /privacy and /terms. The words come straight from
  docs/privacy-and-terms-draft.md at build time, so the pages always say
  exactly what that file says: edit the file, not this component.

    /privacy  the "# Privacy Notice" section
    /terms    the "# Terms of Use" section

  The draft's own preamble and its "Notes for whoever reviews this" are
  for the people preparing it and are not shown. Every [BRACKETED]
  placeholder is highlighted, so what still needs filling in is easy to
  see.
*/

const PAGES = {
  privacy: { heading: "# Privacy Notice", title: "Privacy notice" },
  terms: { heading: "# Terms of Use", title: "Terms of use" },
};

/** The draft's section that starts with `heading`, up to the next top-level part. */
function section(heading) {
  const lines = draft.replace(/\r\n/g, "\n").split("\n");
  const start = lines.findIndex((line) => line.trim() === heading);
  if (start < 0) return [];
  let end = lines.length;
  for (let i = start + 1; i < lines.length; i++) {
    // The next "# " heading, or the reviewers' notes, ends this part.
    if (/^# /.test(lines[i]) || /^## Notes for whoever reviews this/.test(lines[i])) {
      end = i;
      break;
    }
  }
  const body = lines.slice(start, end);
  // The rule that separates parts in the draft isn't part of either page.
  while (body.length && (body[body.length - 1].trim() === "" || body[body.length - 1].trim() === "---")) body.pop();
  return body;
}

/** Splits the markdown into blocks: headings, paragraphs, lists and rules. */
function blocks(lines) {
  const out = [];
  let paragraph = [];
  let list = null;
  const flush = () => {
    if (paragraph.length) out.push({ type: "p", text: paragraph.join(" ") });
    if (list) out.push(list);
    paragraph = [];
    list = null;
  };
  for (const raw of lines) {
    const line = raw.trimEnd();
    const heading = /^(#{1,3}) (.*)$/.exec(line);
    if (!line.trim()) flush();
    else if (heading) {
      flush();
      out.push({ type: `h${heading[1].length}`, text: heading[2] });
    } else if (line.trim() === "---") {
      flush();
      out.push({ type: "hr" });
    } else if (/^\s*[-*] /.test(line)) {
      if (paragraph.length) {
        out.push({ type: "p", text: paragraph.join(" ") });
        paragraph = [];
      }
      list ??= { type: "ul", items: [] };
      list.items.push(line.replace(/^\s*[-*] /, ""));
    } else if (list) list.items[list.items.length - 1] += ` ${line.trim()}`;
    else paragraph.push(line.trim());
  }
  flush();
  return out;
}

/** Bold, italics and [PLACEHOLDERS] within a line. Everything else is plain text. */
function Inline({ text }) {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\](?!\())/g);
  return parts.map((part, i) => {
    if (/^\*\*[^*]+\*\*$/.test(part)) return <strong key={i}><Inline text={part.slice(2, -2)} /></strong>;
    if (/^\*[^*]+\*$/.test(part)) return <em key={i}><Inline text={part.slice(1, -1)} /></em>;
    if (/^\[[^\]]+\]$/.test(part)) return <mark key={i} className="pm-legal__todo">{part}</mark>;
    return <Fragment key={i}>{part}</Fragment>;
  });
}

export default function LegalPage({ doc }) {
  const page = PAGES[doc];
  useDocumentTitle(page.title);
  const content = blocks(section(page.heading));

  return (
    <div className="pm-legal">
      <header className="pm-legal__top">
        <Link className="pm-legal__mark" to="/">
          Pebble Math
        </Link>
      </header>

      <main id="main" className="pm-legal__body">
        {content.length === 0 && <p>This page's text isn't in place yet.</p>}
        {content.map((block, i) => {
          switch (block.type) {
            case "h1":
              return <h1 key={i} className="pm-legal__title"><Inline text={block.text} /></h1>;
            case "h2":
              return <h2 key={i} className="pm-legal__heading"><Inline text={block.text} /></h2>;
            case "h3":
              return <h3 key={i} className="pm-legal__subheading"><Inline text={block.text} /></h3>;
            case "hr":
              return <hr key={i} className="pm-legal__rule" />;
            case "ul":
              return (
                <ul key={i} className="pm-legal__list">
                  {block.items.map((item, j) => (
                    <li key={j}><Inline text={item} /></li>
                  ))}
                </ul>
              );
            default:
              return <p key={i}><Inline text={block.text} /></p>;
          }
        })}
      </main>

      <footer className="pm-legal__foot">
        <nav aria-label="Legal">
          <Link className="pm-legal__link" to="/privacy">Privacy notice</Link>
          <Link className="pm-legal__link" to="/terms">Terms of use</Link>
          <Link className="pm-legal__link" to="/">Pebble Math home</Link>
        </nav>
      </footer>
    </div>
  );
}
