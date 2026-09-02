import { PageHero } from '../hooks/useSiteScripts';

export default function StaticPage({ title, children, policy = false }) {
  return (
    <>
      <PageHero title={title} />
      <section className={policy ? 'section policy-section' : 'section'}>
        <div className="container">
          {policy ? <div className="policy-content">{children}</div> : children}
        </div>
      </section>
    </>
  );
}
