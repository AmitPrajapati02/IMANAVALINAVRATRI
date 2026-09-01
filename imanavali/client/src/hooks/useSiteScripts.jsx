import { useEffect } from 'react';

export function useSiteScripts() {
  useEffect(() => {
    import('../assets/js/main.js').catch(() => {});
  }, []);
}

export function PageHero({ title }) {
  return (
    <section className="page-hero about-hero">
      <div className="container">
        <h1>{title}</h1>
      </div>
    </section>
  );
}
