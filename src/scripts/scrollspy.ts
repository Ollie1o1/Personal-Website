// Marks the TOC link for the section currently at the top of the viewport.
export function initScrollSpy() {
  const links = new Map<string, HTMLAnchorElement>();
  document.querySelectorAll<HTMLAnchorElement>('[data-toc]').forEach((a) => links.set(a.dataset.toc!, a));
  if (!links.size || !('IntersectionObserver' in window)) return;
  const headings = [...links.keys()]
    .map((id) => document.getElementById(id))
    .filter((h): h is HTMLElement => !!h);

  const setCurrent = (id: string) =>
    links.forEach((a, key) => (key === id ? a.setAttribute('aria-current', 'true') : a.removeAttribute('aria-current')));

  const io = new IntersectionObserver(
    () => {
      // The current section is the last heading that has scrolled above the 30% line.
      const line = window.innerHeight * 0.3;
      let current = headings[0];
      for (const h of headings) if (h.getBoundingClientRect().top <= line) current = h;
      setCurrent(current.id);
    },
    { rootMargin: '0px 0px -70% 0px', threshold: [0, 1] },
  );
  headings.forEach((h) => io.observe(h));
  setCurrent(headings[0].id);
}
