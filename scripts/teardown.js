// Reference-site teardown probe.
// Paste into DevTools console (or run via a browser tool's JS executor) on the
// site you are studying. Returns stack, tokens, typography, sections, motion,
// a11y and SEO signals as one JSON object. Read-only.
(() => {
  const cs = (el) => (el ? getComputedStyle(el) : null);
  const type = (sel) => {
    const e = document.querySelector(sel); if (!e) return null; const s = cs(e);
    return { font: s.fontFamily, size: s.fontSize, weight: s.fontWeight, lh: s.lineHeight, ls: s.letterSpacing, color: s.color };
  };
  const colors = {};
  document.querySelectorAll('*').forEach((e) => {
    const s = getComputedStyle(e);
    [s.color, s.backgroundColor, s.borderTopColor].forEach((c) => { if (c && c !== 'rgba(0, 0, 0, 0)') colors[c] = (colors[c] || 0) + 1; });
  });
  const rules = (fn) => [...document.styleSheets].flatMap((sh) => { try { return [...sh.cssRules].filter(fn); } catch { return []; } });
  const cssVars = {};
  rules((r) => r.selectorText === ':root' || r.selectorText === 'html').forEach((r) => { for (const p of r.style) if (p.startsWith('--')) cssVars[p] = r.style.getPropertyValue(p).trim(); });
  const classes = new Set(); document.querySelectorAll('[class]').forEach((e) => String(e.className.baseVal ?? e.className).split(/\s+/).forEach((c) => c && classes.add(c)));
  const cl = [...classes];
  const scripts = [...document.scripts].map((s) => s.src).filter(Boolean);
  return {
    url: location.href,
    title: document.title,
    stack: {
      nextjs: !!window.next || !!self.__next_f || !!window.__NEXT_DATA__,
      nextAppRouter: !!self.__next_f,
      generator: document.querySelector('meta[name=generator]')?.content ?? null,
      astro: !!document.querySelector('astro-island') || [...document.querySelectorAll('*')].some((e) => [...e.attributes].some((a) => a.name.startsWith('data-astro-cid'))) || cl.some((c) => c.startsWith('astro-')),
      nuxt: !!window.__NUXT__, gatsby: !!window.___gatsby, wordpress: scripts.some((s) => s.includes('wp-content')),
      webflow: !!document.documentElement.dataset.wfPage, framer: !!document.querySelector('[data-framer-name]'), squarespace: scripts.some((s) => s.includes('squarespace')),
      tailwind: cl.filter((c) => /^(sm:|md:|lg:|xl:)?(px|py|mx|my|text|bg|flex|grid|gap|rounded)-/.test(c)).length,
      tailwindV4Layers: rules((r) => r.constructor.name === 'CSSLayerStatementRule').map((r) => r.nameList?.join(',')),
      cssModules: cl.filter((c) => /module__/.test(c) || /_[a-zA-Z0-9]{5}$/.test(c)).length,
      cloudflare: !!document.querySelector('a[href*="/cdn-cgi/"]') || scripts.some((s) => s.includes('cloudflareinsights')),
      thirdParty: [...new Set(scripts.map((s) => { try { return new URL(s).host; } catch { return s; } }))],
    },
    tokens: { cssVars, topColors: Object.entries(colors).sort((a, b) => b[1] - a[1]).slice(0, 16) },
    type: { body: type('body'), h1: type('h1'), h2: type('h2'), h3: type('h3'), p: type('p'), fonts: [...new Set([...document.fonts].map((f) => f.family))] },
    sections: [...document.querySelectorAll('section, [id]')].filter((s) => s.tagName === 'SECTION').map((s) => ({ id: s.id, h: (s.querySelector('h1,h2')?.textContent || '').trim().slice(0, 90), height: s.offsetHeight })),
    ctas: [...document.querySelectorAll('a,button')].filter((a) => /call|book|contact|start|quote|get|request|demo|try/i.test(a.textContent)).map((a) => `${a.textContent.trim().slice(0, 40)} → ${a.getAttribute('href') || '(button)'}`).slice(0, 20),
    forms: [...document.forms].map((f) => ({ action: f.action, fields: [...f.elements].map((e) => e.name).filter(Boolean) })),
    motion: {
      keyframes: rules((r) => r.type === 7).map((r) => r.name),
      runningAnimations: document.getAnimations().length,
      reducedMotionRules: rules((r) => r.conditionText?.includes('reduced-motion')).length,
      scrollTimeline: rules((r) => r.cssText?.includes('animation-timeline')).length,
      libs: { gsap: !!window.gsap, lenis: !!window.Lenis || !!document.querySelector('.lenis'), framerMotion: cl.some((c) => c.includes('framer')), lottie: !!window.lottie },
    },
    a11y: {
      skipLink: !!document.querySelector('a[href^="#"][class*="skip"], a[href="#main"], a[href="#content"]'),
      lang: document.documentElement.lang,
      imgsMissingAlt: [...document.images].filter((i) => !i.hasAttribute('alt')).length,
      ariaExpanded: document.querySelectorAll('[aria-expanded]').length,
      h1Count: document.querySelectorAll('h1').length,
    },
    seo: {
      description: document.querySelector('meta[name=description]')?.content,
      canonical: document.querySelector('link[rel=canonical]')?.href,
      og: [...document.querySelectorAll('meta[property^="og:"]')].map((m) => m.getAttribute('property')),
      jsonLd: [...document.querySelectorAll('script[type="application/ld+json"]')].map((s) => { try { return JSON.parse(s.textContent)['@type']; } catch { return 'invalid'; } }),
      robots: document.querySelector('meta[name=robots]')?.content,
    },
    weight: { htmlKB: Math.round(document.documentElement.outerHTML.length / 1024), images: document.images.length, svgs: document.querySelectorAll('svg').length, scripts: scripts.length },
  };
})();
