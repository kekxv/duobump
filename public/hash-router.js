/* Static hash routing. No History API or server rewrite is required. */
(() => {
  const script = document.querySelector('script[data-hash-router]');
  const base = new URL('./', script.src).pathname;
  const root = new URL(base, location.origin);
  const parse = () => {
    const raw = location.hash.startsWith('#/') ? location.hash.slice(1) : '/';
    const [path, ...anchor] = raw.split('#');
    // Treat the path as an identifier, never as an arbitrary fetch URL.
    const clean = /^\/(?:[a-z0-9-]+\/)*$/.test(path) || path === '/404.html' ? path : '/404.html';
    return { path: clean, anchor: anchor.join('#') };
  };
  if (location.pathname !== root.pathname) {
    let path = location.pathname.slice(base.length);
    if (path === 'index.content.html' || path === 'index.html') path = '';
    const anchor = location.hash && !location.hash.startsWith('#/') ? location.hash : '';
    location.replace(`${base}#/${path}${anchor}`);
    return;
  }
  const state = parse();
  const scrollAnchor = () => {
    let anchor;
    try {
      anchor = decodeURIComponent(parse().anchor);
    } catch {
      return;
    }
    document
      .querySelectorAll('[data-route-anchor]')
      .forEach((node) => node.removeAttribute('data-route-anchor'));
    if (!anchor) return;
    const target = document.getElementById(anchor);
    if (!target) return;
    target.setAttribute('data-route-anchor', '');
    if (!target.hasAttribute('tabindex')) target.tabIndex = -1;
    target.scrollIntoView({ block: 'start' });
    target.focus({ preventScroll: true });
  };
  if (window.__duobumpRoute !== state.path) {
    const content = new URL(state.path === '/' ? 'index.content.html' : state.path.slice(1), root);
    fetch(content)
      .then(async (response) => {
        if (!response.ok) {
          const fallback = await fetch(new URL('404.html', root));
          if (!fallback.ok) throw new Error('page unavailable');
          return fallback.text();
        }
        return response.text();
      })
      .then((html) => {
        window.__duobumpRoute = state.path;
        const parsed = new DOMParser().parseFromString(html, 'text/html');
        // DOMParser parses noscript with scripting disabled. Remove that fallback
        // before inserting into a scripting-enabled document (its styles must not run).
        parsed.querySelectorAll('noscript').forEach((node) => node.remove());
        const element = document.importNode(parsed.documentElement, true);
        element.style.visibility = 'hidden';
        element.dataset.routeLoading = '';
        const sheets = Array.from(element.querySelectorAll('link[rel="stylesheet"]'));
        const styled = Promise.all(
          sheets.map(
            (link) =>
              new Promise((resolve) => {
                link.addEventListener('load', resolve, { once: true });
                link.addEventListener('error', resolve, { once: true });
              }),
          ),
        );
        document.replaceChild(element, document.documentElement);
        // Scripts parsed as HTML are inert. Activate the trusted, same-origin
        // build output once; a new document on each route isolates module state.
        const scriptsReady = [];
        for (const original of document.querySelectorAll('script')) {
          const active = document.createElement('script');
          for (const attribute of original.attributes)
            active.setAttribute(attribute.name, attribute.value);
          // Inline module scripts do not emit a load event. Astro emits the
          // standalone page modules with src; wait for those before interaction.
          if (active.src) {
            scriptsReady.push(
              new Promise((resolve) => {
                active.addEventListener('load', resolve, { once: true });
                active.addEventListener('error', resolve, { once: true });
              }),
            );
          }
          active.async = false;
          active.textContent = original.textContent;
          original.replaceWith(active);
        }
        Promise.all([styled, ...scriptsReady]).then(() => {
          element.style.visibility = '';
          dispatchEvent(new Event('duobump:ready'));
          requestAnimationFrame(() =>
            requestAnimationFrame(() => {
              delete element.dataset.routeLoading;
            }),
          );
        });
      })
      .catch(() => {
        const main = document.querySelector('main') || document.body;
        main.replaceChildren();
        const heading = document.createElement('h1');
        heading.textContent = '页面暂时无法加载';
        const message = document.createElement('p');
        message.textContent = '请检查网络后刷新重试。如有紧急不适，请拨打 120 或联系产科。';
        const retry = document.createElement('button');
        retry.textContent = '重新加载';
        retry.onclick = () => location.reload();
        const emergency = document.createElement('a');
        emergency.href = 'tel:120';
        emergency.textContent = '拨打 120';
        main.append(heading, message, retry, emergency);
      });
    return;
  }
  document.documentElement.dataset.hashRoute = state.path;
  const convert = (a) => {
    const href = a.getAttribute('href');
    if (!href || a.target === '_blank' || a.hasAttribute('download')) return;
    if (href.startsWith('#/') || href.startsWith(base + '#/')) return;
    if (href.startsWith('#')) {
      a.href = `${base}#${state.path}${href}`;
      return;
    }
    let target;
    try {
      target = new URL(href, location.href);
    } catch {
      return;
    }
    if (target.origin !== location.origin || !target.pathname.startsWith(base)) return;
    let path = target.pathname.slice(base.length);
    if (path === 'index.content.html' || path === 'index.html') path = '';
    if (path && !path.endsWith('/') && path !== '404.html') return;
    a.href = `${base}#/${path}${target.hash}`;
  };
  document.querySelectorAll('a[href]').forEach(convert);
  // Includes links added by local search and personalized pregnancy tasks.
  new MutationObserver((records) => {
    for (const record of records) {
      if (record.type === 'attributes') convert(record.target);
      for (const node of record.addedNodes) {
        if (node.nodeType !== Node.ELEMENT_NODE) continue;
        if (node.matches('a[href]')) convert(node);
        node.querySelectorAll('a[href]').forEach(convert);
      }
    }
  }).observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['href'],
  });
  addEventListener('hashchange', () => {
    if (parse().path !== state.path) location.reload();
    else scrollAnchor();
  });
  scrollAnchor();
  addEventListener('duobump:ready', scrollAnchor, { once: true });
  // Modules and fonts can finish after a deferred classic router script.
  addEventListener('load', scrollAnchor, { once: true });
})();
