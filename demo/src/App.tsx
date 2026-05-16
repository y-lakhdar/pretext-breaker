import { useState } from 'react';
import { PretextBreaker } from 'pretext-breaker';
import 'pretext-breaker/styles.css';
import './App.css';

const features = [
  'Reads visible document content and turns it into bricks.',
  'Works well on docs, guides, changelogs, and long-form pages.',
  'Ships as a React component with configurable triggers and selectors.',
];

export default function App() {
  const [gameKey, setGameKey] = useState(0);

  return (
    <>
      <main className="page-shell">
        <section className="hero">
          <div className="eyebrow">Demo</div>
          <h1>pretext-breaker</h1>
          <p className="hero-copy">
            React component for turning document content into a playable block breaker overlay.
          </p>

          <div className="hero-actions">
            <button id="play-cta" className="primary-action" onClick={() => setGameKey((prev) => prev + 1)}>
              Play this page
            </button>
            <a href="https://github.com/y-lakhdar/pretext-breaker" className="secondary-action" target="_blank" rel="noopener noreferrer">
              GitHub
            </a>
            <a href="https://www.npmjs.com/package/pretext-breaker" className="secondary-action" target="_blank" rel="noopener noreferrer">
              npm
            </a>
          </div>

          <div className="hero-meta">
            <span>Trigger: button / Konami code / ?game=true</span>
            <code>↑↑↓↓←→←→BA</code>
          </div>
        </section>

        <section className="grid two-column">
          <article className="panel stack-gap">
            <h2>Install</h2>
            <pre>
              <code>pnpm add pretext-breaker</code>
            </pre>
            <h2>Mount once</h2>
            <pre>
              <code>{`import 'pretext-breaker/styles.css';
import { PretextBreaker } from 'pretext-breaker';

export function App() {
  return (
    <>
      <DocsPage />
      <PretextBreaker />
    </>
  );
}`}</code>
            </pre>
          </article>

          <article className="panel stack-gap">
            <h2>What it does</h2>
            <ul>
              {features.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>

            <h2>Typical flow</h2>
            <ol>
              <li>Render your normal page content.</li>
              <li>
                Mount <code>PretextBreaker</code> once near the app root.
              </li>
              <li>
                Trigger it from a button, Konami code, or <code>?game=true</code>.
              </li>
            </ol>
          </article>
        </section>

        <section className="grid two-column">
          <article className="panel stack-gap">
            <h2>Good targets</h2>
            <p>
              The demo works best on pages with real structure: headings, paragraphs, lists, tables, and inline code.
            </p>
            <ul>
              <li>Documentation homepages</li>
              <li>Framework guides</li>
              <li>API references</li>
              <li>Engineering blog posts</li>
            </ul>
          </article>

          <article className="panel stack-gap">
            <h2>Notes</h2>
            <dl>
              <dt>Client-side only</dt>
              <dd>Mount it where DOM access is available.</dd>
              <dt>Default trigger</dt>
              <dd>Konami code and <code>?game=true</code> work without extra setup.</dd>
              <dt>Selector control</dt>
              <dd>Use <code>documentBricks</code> when the page shell needs to be filtered.</dd>
            </dl>
          </article>
        </section>

        <section className="panel stack-gap playground-copy">
          <div className="section-heading">
            <h2>Demo content</h2>
            <p>This section exists so the page has enough structure to produce a good level.</p>
          </div>

          <h3>Integration checklist</h3>
          <ul>
            <li>Import the shared stylesheet once.</li>
            <li>Mount the component near the page root.</li>
            <li>Test selectors on the actual content layout.</li>
            <li>Keep the trigger deliberate so the overlay stays opt-in.</li>
          </ul>
        </section>

        <footer className="site-footer">
          <div className="footer-links">
            <a href="https://github.com/y-lakhdar/pretext-breaker" target="_blank" rel="noopener noreferrer">
              GitHub
            </a>
            <a href="https://www.npmjs.com/package/pretext-breaker" target="_blank" rel="noopener noreferrer">
              npm
            </a>
          </div>
          <p>Built for docs-like pages that should stay readable before and during the joke.</p>
        </footer>
      </main>

      <PretextBreaker key={gameKey} trigger={{ initialActive: gameKey > 0 }} />
    </>
  );
}
