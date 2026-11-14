// Builds the static site into /public. Run: node build.mjs
// Copy comes from COPY.md (verbatim). Visual rules come from DESIGN.md.
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
// OUT_DIR lets the same script build into the GitHub repo root; locally it builds into /public.
const OUT = process.env.OUT_DIR ? join(process.cwd(), process.env.OUT_DIR) : join(HERE, 'public');
// When a custom domain is connected, change this one line (or set SITE_URL) and rebuild.
const SITE = (process.env.SITE_URL || 'https://murtazamustafa.vercel.app').replace(/\/$/, '');
const MAIL = 'murtazamustafaa02@gmail.com';
const LINKEDIN = 'https://www.linkedin.com/in/murtaza-mustafa2911';
const DEMO = 'https://importdeskpro.vercel.app';
// Cache-busting stamp: changes only when an asset file changes, so repeat visitors keep their cache.
const ASSETS = ['styles.css', 'site.js', 'particles.js', 'import-desk-pro-720.webp', 'import-desk-pro-1440.webp',
  'murtaza-mustafa-340.webp', 'murtaza-mustafa-680.webp', 'og-image.png', 'favicon.svg'];
const V = ASSETS.reduce((h, f) => h.update(readFileSync(join(OUT, 'assets', f))), createHash('sha1')).digest('hex').slice(0, 8);
const TODAY = new Date().toISOString().slice(0, 10);
// Public URL of a page: no trailing slash (matches cleanUrls / trailingSlash:false in vercel.json).
const url = (path) => (path === '/' ? '/' : path.replace(/\/$/, ''));
const esc = (t) => t.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

/* ---------- small helpers ---------- */
const btn = (label, href, primary, ext) =>
  `<a class="btn ${primary ? 'btn-primary' : 'btn-secondary'}" href="${href}"${ext ? ' target="_blank" rel="noopener"' : ''}>${label}</a>`;
const call = (p) => btn('Book a call', `mailto:${MAIL}?subject=Book%20a%20call`, p);
const review = (p) => btn('Request a free process review', '/free-process-review', p);
const btns = (...b) => `<div class="btns">${b.join('')}</div>`;
const arrow = (label, href, ext) =>
  `<a class="link-arrow" href="${href}"${ext ? ' target="_blank" rel="noopener"' : ''}>${label}</a>`;

const stats = (items) =>
  `<ul class="stat-row" style="--n:${items.length}">${items
    .map(([n, l]) => `<li><span class="stat-num">${n}</span><span class="stat-label">${l}</span></li>`)
    .join('')}</ul>`;

// Section with heading on the left and text on the right.
const sec = (label, h2, body) => `
<section class="section"><div class="wrap split reveal">
  <div class="split-head">${h2 ? `<span class="label">${label}</span><h2>${h2}</h2>` : `<h2>${label}</h2>`}</div>
  <div class="prose">${body}</div>
</div></section>`;

// Section with heading on top and full-width content below.
const wide = (label, h2, body, intro = '') => `
<section class="section"><div class="wrap reveal">
  <div class="section-head">${h2 ? `<span class="label">${label}</span><h2>${h2}</h2>` : `<h2>${label}</h2>`}${intro}</div>
  ${body}
</div></section>`;

const cta = (h2, body, buttons) => `
<section class="section"><div class="wrap reveal"><div class="cta">
  <h2>${h2}</h2>${body ? `<p>${body}</p>` : ''}${buttons}
</div></div></section>`;

const quote = (html, who, long) =>
  `<figure class="quote${long ? ' long' : ''}"><blockquote>${html}</blockquote><figcaption>${who}</figcaption></figure>`;

// eager = the image is at the top of the page (loads first); otherwise it loads when scrolled near.
const frame = (alt, eager) => `
<figure class="frame"><div class="frame-bar" aria-hidden="true"><i></i><i></i><i></i></div>
<a href="${DEMO}" target="_blank" rel="noopener"><img src="/assets/import-desk-pro-1440.webp?v=${V}" srcset="/assets/import-desk-pro-720.webp?v=${V} 720w, /assets/import-desk-pro-1440.webp?v=${V} 1440w" sizes="(max-width:1079px) 100vw, 520px" width="1440" height="900" alt="${alt}"${eager ? ' fetchpriority="high"' : ' loading="lazy"'} decoding="async"></a></figure>`;

const pageHero = (eyebrow, h1, lead, extra = '') => `
<section class="page-hero"><div class="wrap">
  ${eyebrow ? `<span class="label">${eyebrow}</span>` : ''}<h1>${h1}</h1>
  <p class="lead">${lead}</p>${extra}
</div></section>`;

const card = (n, title, body, links, h = 'h3') => `
<article class="card"><span class="label">${n}</span><${h} class="card-title">${title}</${h}><p>${body}</p><div class="links">${links}</div></article>`;

/* ---------- layout ---------- */
const NAV = [
  ['Case studies', '/case-studies'],
  ['About', '/about'],
  ['Free process review', '/free-process-review'],
  ['Contact', '/contact'],
];

const PERSON = {
  '@type': 'Person', '@id': `${SITE}/#person`, name: 'Murtaza Mustafa', url: `${SITE}/`,
  image: `${SITE}/assets/murtaza-mustafa-680.webp`, jobTitle: 'Business operations and AI automation specialist',
  email: `mailto:${MAIL}`, sameAs: [LINKEDIN],
  address: { '@type': 'PostalAddress', addressLocality: 'Karachi', addressCountry: 'PK' },
};
// Structured data: tells search engines who the site is about and where each page sits.
const jsonLd = (path, title, description) => {
  const graph = [PERSON, { '@type': 'WebSite', '@id': `${SITE}/#website`, url: `${SITE}/`, name: 'Murtaza Mustafa', publisher: { '@id': `${SITE}/#person` } },
    { '@type': path === '/about/' ? 'ProfilePage' : 'WebPage', '@id': `${SITE}${url(path)}#page`, url: `${SITE}${url(path)}`, name: title, description,
      isPartOf: { '@id': `${SITE}/#website` }, about: { '@id': `${SITE}/#person` }, inLanguage: 'en' }];
  const parts = path.split('/').filter(Boolean);
  if (parts.length) graph.push({ '@type': 'BreadcrumbList', itemListElement: [['Home', '/'], ...parts.map((p, i) => [
    i === parts.length - 1 ? title.split(/ \| |: /)[0] : 'Case studies', '/' + parts.slice(0, i + 1).join('/')])]
    .map(([name, item], i) => ({ '@type': 'ListItem', position: i + 1, name, item: `${SITE}${item}` })) });
  return JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }).replace(/</g, '\\u003c');
};

const layout = ({ path, title, description, body, scripts = '', noindex = false }) => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
${noindex ? '<meta name="robots" content="noindex">' : `<link rel="canonical" href="${SITE}${url(path)}">
<meta name="author" content="Murtaza Mustafa">
<meta property="og:type" content="${path === '/about/' ? 'profile' : path.startsWith('/case-studies/') && path !== '/case-studies/' ? 'article' : 'website'}">
<meta property="og:site_name" content="Murtaza Mustafa">
<meta property="og:locale" content="en_US">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${SITE}${url(path)}">
<meta property="og:image" content="${SITE}/assets/og-image.png?v=${V}">
<meta property="og:image:type" content="image/png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="Murtaza Mustafa: business grad who fixes operations with AI.">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(description)}">
<meta name="twitter:image" content="${SITE}/assets/og-image.png?v=${V}">
<script type="application/ld+json">${jsonLd(path, title, description)}</script>`}
<meta name="theme-color" content="#f4f6f8" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#0f151b" media="(prefers-color-scheme: dark)">
<link rel="icon" href="/assets/favicon.svg?v=${V}" type="image/svg+xml">
<link rel="apple-touch-icon" href="/assets/apple-touch-icon.png">
<script>try{var t=localStorage.getItem('theme');if(t)document.documentElement.setAttribute('data-theme',t)}catch(e){}document.documentElement.classList.add('js')</script>
<link rel="preload" href="/assets/fonts/schibsted-grotesk.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/assets/fonts/source-sans-3.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/assets/styles.css?v=${V}">
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
<header class="nav"><div class="wrap">
  <a class="brand" href="/">Murtaza Mustafa</a>
  <nav aria-label="Main"><ul class="nav-links" id="nav-links">
    ${NAV.map(([l, h]) => `<li><a href="${h}"${path.startsWith(h + '/') ? ' aria-current="page"' : ''}>${l}</a></li>`).join('')}
  </ul></nav>
  <button class="icon-btn theme" type="button" aria-label="Switch between light and dark theme">
    <svg class="sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>
    <svg class="moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/></svg>
  </button>
  ${btn('Book a call', `mailto:${MAIL}?subject=Book%20a%20call`, true)}
  <button class="icon-btn menu-btn" type="button" aria-label="Menu" aria-expanded="false" aria-controls="nav-links">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>
  </button>
</div></header>
<main id="main">
${body}
</main>
<footer class="footer band"><div class="wrap">
  <div class="footer-grid">
    <div><a class="brand" href="/">Murtaza Mustafa</a><p class="muted">Business grad who fixes operations with AI.</p></div>
    <ul>${NAV.map(([l, h]) => `<li><a href="${h}">${l}</a></li>`).join('')}</ul>
    <ul>
      <li><a href="mailto:${MAIL}">${MAIL}</a></li>
      <li><a href="${LINKEDIN}" target="_blank" rel="noopener">linkedin.com/in/murtaza-mustafa2911</a></li>
      <li><a href="https://wa.me/923181253085" target="_blank" rel="noopener">+92 318 1253085</a></li>
      <li class="muted">Karachi, Pakistan</li>
    </ul>
  </div>
  <p class="footer-base">© 2026 Murtaza Mustafa</p>
</div></footer>
<script src="/assets/site.js?v=${V}" defer></script>${scripts}
</body>
</html>
`;

/* ---------- shared content ---------- */
const CS = '/case-studies/';
const caseCards = (v, h) => `<div class="cards">
${card('01', 'Import Desk Pro: Huzaifa Enterprises', v[0],
  arrow('Read the case study', CS + 'import-desk-pro') + (v.demo ? arrow('Open the demo', DEMO, true) : ''), h)}
${card('02', 'Tarot Times With Heidi', v[1], arrow('Read the case study', CS + 'tarot-times-with-heidi'), h)}
${card('03', 'GoHighLevel automations for chiropractors', v[2], arrow('Read the case study', CS + 'gohighlevel-chiropractors'), h)}
${card('04', 'Bubble Bath Bars', v[3], arrow('Read the case study', CS + 'bubble-bath-bars'), h)}
${card('05', 'TikTok Shop growth', v[4], arrow('Read the case study', CS + 'tiktok-shop-growth'), h)}
</div>`;

const ericFull = quote(
  `<p>Hello Heidi! Murtaza had worked with me in the past to improve his skill and create on his own. He has grown in his skillset and strives to keep quality work as a top priority was also helping with any other tools they may help you succeed.</p>
<p>He is timely, thoughtful and a good person to work with. If I had a project to work on right now for him I would definitely ask for his help.</p>
<p>I think you will feel well by your choice should you select him for your project.</p>
<p>Let me know if I can help in any way</p>
<p>Thank you,<br>Eric</p>`,
  'A written reference Eric sent to another client of mine, shown word for word.', true);

/* ---------- pages ---------- */
const pages = [];

/* 1. Home */
pages.push({
  path: '/',
  scripts: `<script src="/assets/particles.js?v=${V}" defer></script>`,
  title: 'Murtaza Mustafa | AI Automation Consultant for Importers',
  description: 'Murtaza Mustafa fixes operations with AI for importers, distributors and service businesses. 20+ hours a week saved, over $10K in unpaid balances found.',
  body: `
<canvas class="particles" aria-hidden="true"></canvas>
<section class="hero"><div class="wrap hero-grid">
  <div>
    <h1>Business grad who fixes operations with <span class="hl">AI</span>.</h1>
    <p class="lead">I'm Murtaza Mustafa. I work as an AI automation consultant for importers, distributors and service businesses with 5 to 50 staff, in the US, Canada and Europe. If your business runs on manual operations or repetitive tasks, I find where the money and hours leak and build the system that stops it.</p>
    ${btns(call(true), review(false))}
    <blockquote class="hero-quote">"He is timely, thoughtful and a good person to work with."<cite>Eric Smith, chiropractor, US</cite></blockquote>
  </div>
  ${frame('Import Desk Pro demo, the entry screen', true)}
</div></section>

<section class="strip band" aria-label="Results"><div class="wrap">
  <ul class="strip-grid">
    <li><span class="stat-num">Over $10K</span><span class="stat-label">in long-unpaid customer balances found at a timber importer</span></li>
    <li><span class="stat-num">20+ hours</span><span class="stat-label">a week saved</span></li>
    <li><span class="stat-num">15+</span><span class="stat-label">automation workflows built</span></li>
    <li><span class="stat-num">1 hour to 5 minutes</span><span class="stat-label">client onboarding time</span></li>
    <li><span class="stat-num">10x</span><span class="stat-label">TikTok Shop revenue in 6 months (RM 50K to RM 500K)</span></li>
  </ul>
</div></section>

${sec('The problem', 'Everything lives in spreadsheets, WhatsApp and a diary. So money and hours quietly leak.', `
<p>Nobody decides to run a business this way. It just builds up. Invoices get written by hand. Who owes what sits in someone's notebook. The same details get typed three times. And nobody can say, today, how much cash is stuck with customers.</p>
<p>I studied business, so I start with the numbers: margins, payment days, hours spent. Then I build the tool that fixes the process, and your team uses it the same week.</p>`).replace('class="section"', 'class="section" style="border-top:0"')}

${wide('Case studies', "Operations automation for small business: what I've built", caseCards(Object.assign([
  'A timber importer ran on handwritten invoices and a diary. I built one app for invoices, ledgers and payments in 4 days. <strong>It saves 20+ hours a week and showed over $10K in unpaid balances nobody was chasing.</strong>',
  'A 27-course training program in Vancouver. Instead of re-recording a course Heidi was unhappy with, I edited it with AI into something they were proud of. <strong>A 7K+ project, in progress.</strong>',
  '15+ workflows for US chiropractic clinics. <strong>Setting up a new client went from 1 hour to 5 minutes.</strong>',
  'The handmade bath products business I co-founded in Karachi. <strong>20+ products and 500+ orders in a month.</strong>',
  'Took a Malaysian kitchenware brand from <strong>RM 50K to RM 500K in 6 months</strong> with a 20,000+ creator network.',
], { demo: true })))}

${sec('Proof', "What people I've worked with say", `
${quote('"He is timely, thoughtful and a good person to work with. If I had a project to work on right now for him I would definitely ask for his help."', 'Eric Smith, chiropractor, US')}
<p>You can also try my work yourself. The Import Desk Pro demo is live with sample data.</p>
${btns(btn('Open the demo', DEMO, false, true))}`)}

${cta("Pick one process. I'll map it for free.",
  "Give me 20 minutes on Google Meet and one process you want fixed. You'll get a one-page map showing where time and money leak, and what I'd fix first. It's yours to keep, whether we work together or not.",
  btns(review(true), call(false)))}
`,
});

/* 2. Case studies index */
pages.push({
  path: '/case-studies/',
  title: 'AI Automation Case Studies | Murtaza Mustafa',
  description: "Business process automation examples with real numbers: an importer's ledger app, clinic automations, a 27-course program and more.",
  body: `
${pageHero('Case studies', 'AI automation case studies, with the numbers',
  'These are business process automation examples from my own work. Each one follows the same order: the problem, what I built, and what changed.')}
<section class="section" style="border-top:0;padding-top:0"><div class="wrap reveal">
${caseCards([
  'Handwritten invoices and a diary, replaced by one app in 4 days. <strong>20+ hours a week saved. Over $10K in unpaid balances found.</strong>',
  'A 27-course program edited with AI instead of being re-recorded. <strong>A 7K+ project, in progress.</strong>',
  '15+ workflows for US clinics. <strong>Client onboarding from 1 hour to 5 minutes.</strong>',
  'My own business: <strong>20+ products, 500+ orders in a month, sales up 20%.</strong>',
  '<strong>RM 50K to RM 500K in 6 months</strong> for a Malaysian kitchenware brand.',
], 'h2')}
</div></section>

${wide('Also worked with', null, `<div class="pair">
  <div class="panel"><h3>Trent Rhodes</h3><p>Research on the infrastructure for apps he is building and about to launch: AWS (CloudFront, App Runner, S3, Bedrock), Cloudflare performance and security, TiDB, BullMQ and FAL. Research only; no build.</p></div>
  <div class="panel"><h3>Tarletta, Marketing Mechanix</h3><p>Marketing support.</p></div>
</div>`)}

${cta('Is your process the next one?', '', btns(review(true), call(false)))}
`,
});

/* 3. Import Desk Pro */
pages.push({
  path: '/case-studies/import-desk-pro/',
  title: 'Import Desk Pro: Import Business Management Software, Built in 4 Days',
  description: 'How an invoicing and ledger app for a timber importer replaced handwritten invoices and a diary, saved 20+ hours a week and found over $10K in unpaid balances.',
  body: `
${pageHero('Case study', 'Import Desk Pro: import business management software for a timber importer',
  'Huzaifa Enterprises imports softwood timber into Karachi from sawmills in Finland and Sweden. I built them an invoicing and ledger app that replaced handwritten invoices and a diary. It took 4 days to go from the first line of code to daily use.',
  btns(btn('Open the demo', DEMO, true, true)) + stats([
    ['20+ hours', 'a week saved'],
    ['Over $10K', 'in long-unpaid balances found'],
    ['4 days', 'from start to daily use'],
  ]))}

${sec('The problem', '100+ customers, 3 staff, and a diary', `
<p>Every invoice was written by hand. Who had paid, who hadn't, and who was overdue lived in a diary. Three people kept the records for more than 100 customers.</p>
<p>To answer a simple question like "when did this customer last pay?", someone had to dig through pages. Hours went on writing invoices, chasing payments, recording ledgers and reconciling them. And nobody could see the full picture of what the business was owed.</p>`)}

${sec('What I built', 'One app for invoices, ledgers, payments and documents', `
<p>Import Desk Pro covers the daily work of an import business:</p>
<ul>
  <li>Invoices and receipts</li>
  <li>A ledger for every customer: what they owe, what's due, when they last paid</li>
  <li>Payments to sawmills</li>
  <li>Shipping documents</li>
</ul>
<p>It also reports three numbers the owners had never seen in one place: monthly profitability, the cash conversion cycle, and the average number of days customers take to pay.</p>
<p>I built it with Supabase, GitHub, Claude and Vercel.</p>`)}

${sec('The result', 'Over $10K found, and 20+ hours a week back', `
<p>When all the ledgers were opened up in one place, the company found over $10K in long-unpaid customer balances. They had been noted in the diary and forgotten.</p>
<p>The team now saves 20+ hours a week on writing invoices, chasing payments, recording ledgers, reconciling, and checking who has paid and who hasn't.</p>`)}

${sec('See it yourself', null, `
<p>The demo runs on sample data, so you can click through everything.</p>
${frame('Import Desk Pro demo, the entry screen')}
${btns(btn('Open the demo', DEMO, false, true))}`)}

${cta('Running on handwritten invoices or a diary of your own?',
  "Show me one process on a 20-minute call. I'll map where time and money leak.",
  btns(review(true), call(false)))}
`,
});

/* 4. Tarot Times With Heidi */
pages.push({
  path: '/case-studies/tarot-times-with-heidi/',
  title: 'AI Video Editing for Online Courses: Tarot Times With Heidi',
  description: 'Online course production for a 27-course training program: AI video editing, workbooks, YouTube and Wix online course setup. A 7K+ project, in progress.',
  body: `
${pageHero('Case study', 'AI video editing for online courses: a 27-course program for Tarot Times With Heidi',
  "Heidi runs Tarot Times With Heidi in Vancouver, Canada. Their Psychic Training School is a program of 27 courses. I'm handling the online course production from end to end: editing, transcripts, workbooks, YouTube and the Wix course pages.",
  btns(btn('Visit tarottimeswithheidi.ca', 'https://tarottimeswithheidi.ca', true, true),
    btn('Open the app I built', 'https://tarottimeswithheidi.vercel.app', false, true)) + stats([
    ['7K+', 'project'],
    ['27', 'courses: 25 recorded and being updated, 2 new'],
    ['In progress', 'Status'],
  ]))}

${sec('The problem', "A finished course Heidi didn't want to publish", `
<p>Heidi had recorded a course and wasn't happy with it. On camera they looked distracted in places, as if reading from notes. Their plan was to record the whole course again.</p>`)}

${sec('What I did', "Edit it, don't re-record it", `
<p>I edited the recording with AI tools and gave it consistent branding. The result looked more premium than the original, and Heidi didn't have to record it again.</p>
<p>Heidi liked it enough to ask for the same across the entire program. The work now covers:</p>
<ul>
  <li>AI video editing for every course</li>
  <li>Transcripts</li>
  <li>Workbooks</li>
  <li>YouTube uploads</li>
  <li>Wix online course setup and splash pages</li>
</ul>
<p>I also built Heidi a private client portal with the agreement, payment timeline, progress tracker and weekly updates, plus an app for their site.</p>`)}

${sec('The result so far', 'Hours of re-recording saved, and a stronger brand', `
<p>The project is still in progress, so there are no final numbers yet. What has changed already:</p>
<ul>
  <li>Heidi kept the original recordings and skipped re-recording a full course</li>
  <li>The courses and the brand around them look more premium and consistent</li>
</ul>`)}

${cta("Sitting on recordings you're not proud of?", '', btns(review(true), call(false)))}
`,
});

/* 5. GoHighLevel chiropractors */
pages.push({
  path: '/case-studies/gohighlevel-chiropractors/',
  title: 'GoHighLevel Automation for Chiropractors: 15+ Workflows',
  description: '15+ GoHighLevel workflows for US chiropractic clinics, from patient reactivation automation to reviews. Client onboarding went from 1 hour to 5 minutes.',
  body: `
${pageHero('Case study', 'GoHighLevel automation for chiropractors: 15+ workflows for US clinics',
  'I worked under Eric Smith, a US chiropractor, on GoHighLevel automation for chiropractic clinics. Across 5 clinics I built more than 15 workflows using GoHighLevel, n8n, Make and Zapier.',
  stats([
    ['15+', 'workflows built'],
    ['5', 'US chiropractic clinics'],
    ['1 hour to 5 minutes', 'client onboarding'],
  ]))}

${sec('The problem', 'Old patients never contacted, appointments missed, every client set up by hand', `
<p>The clinics were losing patients in quiet ways. People who had visited once were never contacted again. Appointments were missed with no follow-up. And each new client had to be set up by hand, which took about an hour every time.</p>`)}

${sec('What I built', "Workflows that follow up so staff don't have to", `
<ul>
  <li><strong>Patient reactivation automation:</strong> messages to past patients who had gone quiet</li>
  <li><strong>Nurturing sequences:</strong> follow-ups for new leads until they book</li>
  <li><strong>Appointment booking and reminders</strong></li>
  <li><strong>No-show follow-ups</strong></li>
  <li><strong>Review requests</strong> after a visit</li>
  <li><strong>Automated intake and setup</strong> for each new client</li>
</ul>`)}

${sec('The result', 'Onboarding in 5 minutes, with a weekly report', `
<p>Setting up a new client used to take an hour of manual work. It now takes about 5 minutes, and a weekly report goes out without anyone preparing it.</p>`)}

${sec('What Eric says', null, ericFull)}

${cta('Need a GoHighLevel expert for your clinic?', '', btns(review(true), call(false)))}
`,
});

/* 6. Bubble Bath Bars */
pages.push({
  path: '/case-studies/bubble-bath-bars/',
  title: 'Bubble Bath Bars: Handmade Bath Products in Karachi',
  description: 'Bubble Bath Bars is the handmade bath products business Murtaza Mustafa co-founded in Karachi in 2022: 20+ products and 500+ orders in a month.',
  body: `
${pageHero('Case study', 'Bubble Bath Bars: the handmade bath products business I co-founded in Karachi',
  'Before I fixed operations for other people, I had to fix my own. I co-founded Bubble Bath Bars in Karachi in March 2022, and I still run it.',
  btns(btn('See it on Instagram', 'https://www.instagram.com/bubble.bath.bars/', true, true)) + stats([
    ['20+', 'products'],
    ['500+', 'orders in a month'],
    ['3+', 'event stalls'],
    ['20%', 'lift in online engagement and sales'],
  ]))}

${sec('What I do there', 'Every job a small business has', `
<p>I own the branding, marketing, pricing, inventory and bookkeeping. I built the website, and I run the marketing and the event stalls.</p>`)}

${sec('The result', 'Sales and engagement up 20%', `
<p>Targeted digital marketing lifted online engagement and sales by 20%.</p>`)}

${sec("Why it's on this site", 'I price, stock and keep books with my own money on the line', `
<p>When I look at your operations, I'm not guessing what it's like to run a business. I know what a wrong price or a missed stock count costs, because I've paid for both.</p>
${btns(review(true), call(false))}`)}
`,
});

/* 7. TikTok Shop growth */
pages.push({
  path: '/case-studies/tiktok-shop-growth/',
  title: 'TikTok Shop Growth: RM 50K to RM 500K in 6 Months',
  description: 'TikTok Shop affiliate marketing in Malaysia: a 20,000+ creator network that took a kitchenware brand from RM 50K to RM 500K in 6 months.',
  body: `
${pageHero('Case study', 'TikTok Shop growth: from RM 50K to RM 500K in 6 months',
  "Alongside my operations work, I grow TikTok Shop sales. I've done it for two Malaysian brands and for my own stores in the US.",
  stats([
    ['10x', 'revenue in 6 months (RM 50K to RM 500K)'],
    ['20,000+', 'creators in the affiliate network'],
    ['20 to 30%', 'sales lift from livestream contracts'],
    ['$50K+', 'in revenue from my own US stores'],
  ]))}

${sec('Masaki Malaysia', 'A TikTok Shop creator network of 20,000+', `
<p>Masaki Malaysia is a kitchenware brand. As Business Manager from November 2023 to August 2024, I grew its TikTok Shop revenue 10x in 6 months.</p>
<p>The growth came from TikTok Shop affiliate marketing. I built the creator network with three things:</p>
<ul>
  <li><strong>Free samples,</strong> so creators could show the product for real</li>
  <li><strong>Commission</strong> on every sale</li>
  <li><strong>Awards</strong> for creators who reached set milestones</li>
</ul>
<p>I also directed the campaigns and launched customer loyalty programs.</p>`)}

${sec('Alzo Home', 'Livestream contracts that lifted sales 20 to 30%', `
<p>Alzo Home is a Malaysian bedsheet brand. As Account Manager since December 2025, I own the monthly profit and loss and the cost of goods reporting, and I make pricing and sales decisions from those numbers.</p>
<p>I negotiated weekly, commission-based livestream contracts with influencers. Sales went up 20 to 30%.</p>`)}

${sec('TikTok Shop USA', 'My own stores, to $50K+ in revenue', `
<p>From March 2023 to February 2025 I built and scaled dropshipping stores on TikTok Shop USA to more than $50K in revenue, using paid influencer collaborations and seasonal discounts. I also managed product listings and content planning for other e-commerce businesses.</p>`)}

${cta('Looking for a TikTok Shop growth consultant?', '', btns(call(true)))}
`,
});

/* 8. About */
const job = (when, role, org, body) =>
  `<li><span class="when">${when}</span><div><h3>${role} <span class="org">${org}</span></h3><p>${body}</p></div></li>`;
pages.push({
  path: '/about/',
  title: 'About Murtaza Mustafa | Operations and AI Automation',
  description: 'Business Management graduate in Karachi with 3+ years in operations, procurement, e-commerce and AI automation. Open to clients and remote roles.',
  body: `
<section class="page-hero"><div class="wrap about-grid">
  <div><span class="label">About</span><h1>About Murtaza Mustafa</h1>
  <p class="lead">I'm a business operations and AI automation specialist based in Karachi, Pakistan. I have a Business Management degree and more than 3 years of hands-on work in operations, procurement, e-commerce and process automation, all of it built alongside full-time study.</p></div>
  <figure class="portrait"><img src="/assets/murtaza-mustafa-680.webp?v=${V}" srcset="/assets/murtaza-mustafa-340.webp?v=${V} 340w, /assets/murtaza-mustafa-680.webp?v=${V} 680w" sizes="(max-width:767px) 240px, 340px" width="680" height="680" alt="Murtaza Mustafa, business operations and AI automation specialist" fetchpriority="high" decoding="async"></figure>
</div></section>

${sec('My story', 'It started because I was lazy', `
<p>I was studying for a business degree when AI tools took off. Honestly, I was too lazy to do my assignments the slow way, so I started using AI to get them done.</p>
<p>Then I used it for my projects. Then for real work. Assignments turned into automations, automations turned into full apps, and the apps turned into paying clients, including a 7K+ project.</p>
<p>The lazy part never left. I still look at every task and ask why a person is doing it by hand. That question is most of my job.</p>`)}

${sec('What I bring', 'Business judgement first, then the build', `
<p>I understand pricing, suppliers and margins because I've worked with them: buying timber from sawmills in Finland and Sweden, owning a monthly profit and loss, running my own business. So I automate where it saves real time and money, and leave alone what works.</p>`)}

${wide('Experience', null, `<ul class="timeline">
${job('Jul 2026 to present', 'Procurement &amp; Operations Executive, Huzaifa Enterprises', '(softwood timber importer, Karachi)', 'I source softwood from sawmills in Finland and Sweden and onboarded 2 new sawmill suppliers. I handle import documentation and customs clearance. I built Import Desk Pro and introduced reporting on monthly profitability, cash conversion cycle and average customer payment days.')}
${job('May to Jul 2026', 'AI Automation Specialist', '(contract, US clients)', 'Built 15+ GoHighLevel, n8n, Make and Zapier workflows for US chiropractic clinics, working under Eric Smith. Client onboarding went from 1 hour to 5 minutes.')}
${job('Dec 2025 to present', 'Account Manager, Alzo Home', '(Malaysia, part-time)', 'I own monthly profit and loss and cost of goods reporting. Influencer livestream contracts lifted sales 20 to 30%.')}
${job('Nov 2023 to Aug 2024', 'Business Manager, Masaki', '(Malaysia, part-time)', 'Scaled TikTok Shop revenue 10x, from RM 50K to RM 500K, in 6 months, with a 20,000+ creator affiliate network.')}
${job('Mar 2023 to Feb 2025', 'E-commerce Strategist', '(freelance, TikTok Shop USA)', 'Built dropshipping stores to $50K+ in revenue.')}
${job('Mar 2022 to present', 'Co-Founder, Bubble Bath Bars', '(Karachi)', 'Handmade bath products. I own branding, marketing, pricing, inventory and bookkeeping.')}
</ul>`)}

${wide('Education', null, `<ul class="timeline">
${job('Jul 2026', 'BA (Hons) Business Management', '', 'Buckinghamshire New University, UK. 74%.')}
${job('2025', 'Higher National Diploma, Business Management', '', 'Pearson. Merit.')}
${job('2023', 'Intermediate in Commerce', '', 'Aga Khan Higher Secondary School. 82.4%.')}
${job('2021', 'Matriculation, Science', '', 'MSB Educational Institute. 84.2%.')}
</ul>`)}

${sec('Tools', null, `<ul class="tags">${['GoHighLevel', 'n8n', 'Make', 'Zapier', 'Lovable', 'Claude Code', 'Supabase', 'Vercel', 'GitHub'].map((t) => `<li>${t}</li>`).join('')}</ul>`).replace('class="prose"', 'class="prose plain"')}

${sec('Languages', null, '<p>Urdu (native), English (fluent).</p>')}

${sec('Hiring?', 'Open to remote internships and junior roles', `
<p>If you're an employer, treat this site as my resume. I'm open to remote internships and junior-level roles in operations, procurement, e-commerce or automation.</p>
${btns(btn('Email me', `mailto:${MAIL}`, true), btn('View my LinkedIn', LINKEDIN, false, true))}`)}

${cta('Have a process that needs fixing?', '', btns(review(true), call(false)))}
`,
});

/* 9. Free process review */
pages.push({
  path: '/free-process-review/',
  title: 'Free Business Process Review: 20 Minutes, One Process',
  description: 'A free operations audit for small business, one process at a time. 20 minutes on Google Meet, and you keep a one-page map of where time and money leak.',
  body: `
${pageHero('Free process review', 'Free business process review: 20 minutes, one process, a one-page map',
  "Pick the one process in your business you most want fixed. On a 20-minute Google Meet call, I'll map it with you. Think of it as a free operations audit for a small business, kept to one process so it gets finished.")}

${sec('What you get', 'A one-page map you keep', `
<p>After the call I send you one page showing:</p>
<ul>
  <li>How the process runs today, step by step</li>
  <li>Where time and money leak</li>
  <li>What I'd fix first</li>
</ul>
<p>It's yours whether we work together or not.</p>`)}

${wide('How it works', null, `<ol class="steps">
  <li><h3>Email me</h3><p>the process you want fixed, in a line or two.</p></li>
  <li><h3>We meet</h3><p>for 20 minutes on Google Meet. You walk me through it; I ask questions.</p></li>
  <li><h3>You get the map,</h3><p>on one page.</p></li>
</ol>`)}

${sec('What to bring', null, '<p>Just one process you want fixed. For example: invoicing, chasing payments, onboarding a new client, or following up with leads.</p>')}

${sec("Who it's for", null, '<p>Owners and operations heads at importers, distributors and service businesses with 5 to 50 staff.</p>')}

${sec("Why it's worth 20 minutes", null, "<p>At Huzaifa Enterprises, putting the ledgers in one place showed over $10K in unpaid balances that had been written in a diary and forgotten. You often can't see a leak until the process is drawn out.</p>")}

<section class="section"><div class="wrap reveal"><div class="cta">
  ${btn('Request a free process review', `mailto:${MAIL}?subject=Free%20process%20review`, true).replace('class="btn', 'style="margin:0" class="btn')}
  <p>I reply within 24 hours.</p>
</div></div></section>
`,
});

/* 10. Contact */
pages.push({
  path: '/contact/',
  title: 'Contact Murtaza Mustafa | Book a Call',
  description: 'Contact or hire Murtaza Mustafa for operations and AI automation work. Email, LinkedIn or WhatsApp. Replies within 24 hours.',
  body: `
${pageHero('Contact', 'Contact Murtaza Mustafa',
  'Want to hire me, or just ask a question? Email is the fastest way to reach me. I reply within 24 hours.',
  btns(call(true)))}

<section class="section" style="border-top:0;padding-top:0"><div class="wrap reveal">
<ul class="contact">
  <li><span class="label">Email</span><a href="mailto:${MAIL}">${MAIL}</a></li>
  <li><span class="label">LinkedIn</span><a href="${LINKEDIN}" target="_blank" rel="noopener">linkedin.com/in/murtaza-mustafa2911</a></li>
  <li><span class="label">Phone / WhatsApp</span><a href="https://wa.me/923181253085" target="_blank" rel="noopener">+92 318 1253085</a></li>
  <li><span class="label">Location</span><span>Karachi, Pakistan</span></li>
</ul>
</div></section>

${sec('Call hours', null, '<p>I take calls from 7am to 2pm US Central Time, Monday to Friday.</p>')}

${cta('Not sure what to ask for?',
  'Start with the free process review: 20 minutes, one process, and a one-page map you keep.',
  btns(review(true)))}
`,
});

/* 404 (not in the sitemap, hidden from search) */
const notFound = {
  path: '/404/', noindex: true,
  title: 'Page not found | Murtaza Mustafa',
  description: 'This page does not exist.',
  body: `
${pageHero('404', 'Page not found', 'That link is broken or the page has moved.', btns(btn('Go to the home page', '/', true), btn('See the case studies', '/case-studies', false)))}
`,
};

/* ---------- write files ---------- */
for (const page of pages) {
  const file = join(OUT, page.path, 'index.html');
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, layout(page));
}
writeFileSync(join(OUT, '404.html'), layout(notFound));
writeFileSync(join(OUT, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${pages
    .map((p) => `  <url><loc>${SITE}${url(p.path)}</loc><lastmod>${TODAY}</lastmod></url>`).join('\n')}\n</urlset>\n`);
writeFileSync(join(OUT, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${SITE}/sitemap.xml\n`);
console.log(`Built ${pages.length} pages + 404 into ${OUT} for ${SITE}`);
