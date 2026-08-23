import { PendingLink } from "../components/PendingLink";

export default function EnglishNotFound() {
  return (
    <div className="not-found-page">
      <section className="not-found-card" aria-labelledby="english-not-found-title">
        <div className="not-found-mark" aria-hidden="true">
          <span>404</span>
          <i className="not-found-reed reed-left" />
          <i className="not-found-reed reed-right" />
        </div>

        <div className="not-found-copy">
          <span className="eyebrow">ARCHIVE WAYPOINT · 404</span>
          <h1 id="english-not-found-title">This road is not in the archive</h1>
          <p className="not-found-lead">The wayfarers have already continued beyond this page.</p>
          <p className="not-found-note">
            The folio may have been sealed, moved, or never entered in the public catalogue.
          </p>

          <div className="not-found-actions">
            <PendingLink className="primary-action" href="/en" prefetch={false}>
              Return to the overview
            </PendingLink>
            <PendingLink className="secondary-action" href="/en/search" prefetch={false}>
              Search the archive
            </PendingLink>
          </div>
        </div>

        <div className="not-found-wayline" aria-hidden="true">
          <span />
          <i />
        </div>
      </section>
    </div>
  );
}
