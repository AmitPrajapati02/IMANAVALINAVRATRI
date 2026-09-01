import { PageHero } from '../hooks/useSiteScripts';

export default function StaticPage({ title, children }) {
  return (
    <>
      <PageHero title={title} />
      <section className="section">
        <div className="container">{children}</div>
      </section>
    </>
  );
}
