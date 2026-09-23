import type { CSSProperties } from "react";
import type { Design, TypeStyle } from "@/lib/designs";
import s from "./preview.module.css";

type Copy = {
  eyebrow: string;
  headline: string;
  features: [string, string][];
  stats: [string, string][];
  product: string;
};

const COPY: Record<string, Copy> = {
  "AI & LLM Platforms": {
    eyebrow: "Now with multimodal reasoning",
    headline: "Intelligence, built for the way you work.",
    features: [
      ["Frontier models", "State-of-the-art reasoning behind a single, predictable API."],
      ["Private by default", "Your data never trains our models. Enterprise controls included."],
      ["Ship in minutes", "SDKs for every stack, streaming out of the box, generous limits."],
    ],
    stats: [["99.99%", "API uptime"], ["2.4B", "tokens / day"], ["180ms", "median latency"]],
    product: "Playground",
  },
  "Developer Tools & IDEs": {
    eyebrow: "v2.0 is here",
    headline: "The fastest way from idea to production.",
    features: [
      ["Instant previews", "Every branch gets a live URL. Review changes where they matter."],
      ["Keyboard first", "Everything is one shortcut away. Your hands never leave the keys."],
      ["Built to extend", "A plugin API and CLI that fit neatly into your existing workflow."],
    ],
    stats: [["1M+", "developers"], ["40ms", "cold start"], ["12k", "GitHub stars"]],
    product: "Dashboard",
  },
  "Backend, Database & DevOps": {
    eyebrow: "Open source · Self-hostable",
    headline: "Infrastructure that scales with you.",
    features: [
      ["Managed Postgres", "Backups, branching and point-in-time recovery, handled for you."],
      ["Realtime by default", "Subscribe to changes and stream them anywhere, instantly."],
      ["Observability", "Traces, logs and metrics in one place. No extra agents."],
    ],
    stats: [["3.2PB", "stored"], ["<10ms", "p95 reads"], ["24/7", "on-call support"]],
    product: "Console",
  },
  "Productivity & SaaS": {
    eyebrow: "Loved by 50,000 teams",
    headline: "Do your best work, together.",
    features: [
      ["One shared space", "Docs, tasks and decisions live side by side, always in sync."],
      ["Automations", "Let routine work run itself with simple, powerful rules."],
      ["Integrations", "Connect the tools you already use in a couple of clicks."],
    ],
    stats: [["50k", "teams"], ["4.9/5", "average rating"], ["2h", "saved per week"]],
    product: "Workspace",
  },
  "Design & Creative Tools": {
    eyebrow: "Introducing Canvas 3",
    headline: "Where great ideas take shape.",
    features: [
      ["Multiplayer", "Design side by side with your team, in real time, from anywhere."],
      ["Components", "Build once, reuse everywhere. Your system stays consistent."],
      ["Handoff", "Specs, assets and code that developers actually want to use."],
    ],
    stats: [["8M", "creators"], ["120+", "countries"], ["1B", "frames made"]],
    product: "Canvas",
  },
  "Fintech & Crypto": {
    eyebrow: "0% fees on your first transfer",
    headline: "Money that moves at your speed.",
    features: [
      ["Send globally", "Real exchange rates and transparent fees, in over 70 currencies."],
      ["Bank-grade security", "Licensed, audited and protected by default."],
      ["Smart insights", "Understand your spending and grow what matters."],
    ],
    stats: [["$120B", "moved yearly"], ["16M", "customers"], ["160", "countries"]],
    product: "Account",
  },
  "E-commerce & Retail": {
    eyebrow: "New season collection",
    headline: "Made for the moments that matter.",
    features: [
      ["Free delivery", "Fast, free shipping and easy returns on every order."],
      ["Members first", "Early access, exclusive drops and rewards that add up."],
      ["Crafted to last", "Thoughtful materials, tested for everyday life."],
    ],
    stats: [["4.8★", "customer rating"], ["30 days", "free returns"], ["190", "markets"]],
    product: "Shop",
  },
  "Media & Consumer Tech": {
    eyebrow: "Just announced",
    headline: "Designed to move you.",
    features: [
      ["Beautifully simple", "Everything you love, nothing you don't. It just works."],
      ["Endless discovery", "Stories, sounds and ideas picked just for you."],
      ["Everywhere you are", "Start on one device, pick up seamlessly on the next."],
    ],
    stats: [["600M", "people"], ["24/7", "live"], ["#1", "in 40 countries"]],
    product: "Discover",
  },
  Automotive: {
    eyebrow: "The new model year",
    headline: "Engineered for the road ahead.",
    features: [
      ["Performance", "Precision engineering that responds to every input, instantly."],
      ["Craftsmanship", "Materials chosen by hand and finished to the highest standard."],
      ["Intelligent", "Assistance systems that keep you in control, mile after mile."],
    ],
    stats: [["2.9s", "0–100 km/h"], ["620 km", "range"], ["340 km/h", "top speed"]],
    product: "Configurator",
  },
  "Retro Web": {
    eyebrow: "Welcome to the information superhighway",
    headline: "Click here to enter the future!",
    features: [
      ["NEW! Catalog", "Browse our entire product line, now online for the first time."],
      ["Award winning", "Voted a Top 100 web site. Bookmark us today!"],
      ["Free download", "Get the latest drivers and shareware — 56k friendly."],
    ],
    stats: [["1,000,000", "visitors"], ["56k", "optimized"], ["800×600", "best viewed"]],
    product: "Catalog",
  },
};
const DEFAULT_COPY = COPY["Productivity & SaaS"];

const typeVars = (prefix: string, t: TypeStyle) => ({
  [`--${prefix}-size`]: t.size,
  [`--${prefix}-weight`]: t.weight,
  [`--${prefix}-lh`]: t.lineHeight,
  [`--${prefix}-ls`]: t.letterSpacing,
  [`--${prefix}-tt`]: t.transform,
});

export function previewVars(design: Design): CSSProperties {
  const t = design.theme;
  const accents = [...t.accents, t.primary, t.ink];
  return {
    "--canvas": t.canvas,
    "--surface": t.surface,
    "--ink": t.ink,
    "--body": t.body,
    "--muted": t.muted,
    "--hairline": t.hairline,
    "--primary": t.primary,
    "--on-primary": t.onPrimary,
    "--secondary-bg": t.secondaryBg,
    "--secondary-text": t.secondaryText,
    "--secondary-border": t.secondaryBorder,
    "--dark": t.surfaceDark,
    "--on-dark": t.onDark,
    "--footer-bg": t.footerBg,
    "--footer-text": t.footerText,
    "--input-bg": t.inputBg,
    "--input-text": t.inputText,
    "--input-border": t.inputBorder ?? `1px solid ${t.hairline}`,
    "--accent-1": accents[0],
    "--accent-2": accents[1],
    "--accent-3": accents[2],
    "--font-display": t.fonts.display,
    "--font-body": t.fonts.body,
    "--font-mono": t.fonts.mono,
    "--r-button": t.radius.button,
    "--r-card": t.radius.card,
    "--r-input": t.radius.input,
    "--r-pill": t.radius.pill,
    "--btn-padding": t.button.padding,
    "--btn-height": t.button.height,
    "--card-shadow": t.shadow,
    ...typeVars("display", t.type.display),
    ...typeVars("h2", t.type.h2),
    ...typeVars("h3", t.type.h3),
    ...typeVars("text", t.type.body),
    ...typeVars("eyebrow", t.type.eyebrow),
    ...typeVars("button", t.type.button),
  } as CSSProperties;
}

function Wordmark({ name }: { name: string }) {
  const clean = name.replace(/\s*\(.*\)$/, "");
  return (
    <span className={s.wordmark}>
      <span className={s.logoMark} aria-hidden />
      {clean}
    </span>
  );
}

function ProductWindow({ design, copy }: { design: Design; copy: Copy }) {
  return (
    <div className={s.window}>
      <div className={s.windowBar}>
        <span />
        <span />
        <span />
        <em>{design.name.toLowerCase().replace(/\s+/g, "")}.com/{copy.product.toLowerCase()}</em>
      </div>
      <div className={s.windowBody}>
        <aside className={s.windowSide}>
          {["Overview", "Activity", "Reports", "Settings"].map((l, i) => (
            <div key={l} className={i === 0 ? s.sideActive : undefined}>
              <i />
              {l}
            </div>
          ))}
        </aside>
        <div className={s.windowMain}>
          <div className={s.windowHead}>
            <strong>{copy.product}</strong>
            <span className={s.badge}>Live</span>
          </div>
          <div className={s.kpis}>
            {copy.stats.map(([v, l]) => (
              <div key={l}>
                <small>{l}</small>
                <b>{v}</b>
              </div>
            ))}
          </div>
          <div className={s.chart} aria-hidden>
            {[38, 52, 44, 66, 58, 74, 62, 86, 70, 92, 80, 96].map((h, i) => (
              <span key={i} style={{ height: `${h}%` }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function PreviewSite({ design }: { design: Design }) {
  const copy = COPY[design.category] ?? DEFAULT_COPY;
  const sub = design.tagline || design.description.split(". ")[0];
  const year = new Date().getFullYear();

  return (
    <div className={s.site} style={previewVars(design)}>
      <div className={s.announce}>
        <span className={s.badgeSolid}>New</span> {copy.eyebrow}
        <a href="#pricing">Learn more →</a>
      </div>

      <header className={s.nav}>
        <Wordmark name={design.name} />
        <nav className={s.navLinks}>
          {["Product", "Solutions", "Pricing", "Docs", "Company"].map((l) => (
            <a key={l} href="#">
              {l}
            </a>
          ))}
        </nav>
        <div className={s.navActions}>
          <a href="#" className={s.textLink}>
            Log in
          </a>
          <a href="#" className={s.btnPrimary}>
            Get started
          </a>
        </div>
      </header>

      <section className={s.hero}>
        <div className={s.heroCopy}>
          <p className={s.eyebrow}>{copy.eyebrow}</p>
          <h1 className={s.display}>{copy.headline}</h1>
          <p className={s.lead}>{sub}</p>
          <div className={s.actions}>
            <a href="#" className={s.btnPrimary}>
              Get started — it&apos;s free
            </a>
            <a href="#" className={s.btnSecondary}>
              Talk to sales
            </a>
          </div>
        </div>
        <ProductWindow design={design} copy={copy} />
      </section>

      <section className={s.logos}>
        <p>Trusted by teams at</p>
        <div>
          {["Northwind", "Globex", "Initech", "Umbrella", "Hooli", "Stark"].map((l) => (
            <span key={l}>{l}</span>
          ))}
        </div>
      </section>

      <section className={s.section}>
        <p className={s.eyebrow}>Why {design.name}</p>
        <h2 className={s.h2}>Everything you need, nothing you don&apos;t.</h2>
        <div className={s.features}>
          {copy.features.map(([title, text], i) => (
            <article key={title} className={s.card}>
              <span className={s.icon} data-i={i} aria-hidden />
              <h3 className={s.h3}>{title}</h3>
              <p>{text}</p>
              <a href="#" className={s.inlineLink}>
                Learn more →
              </a>
            </article>
          ))}
        </div>
      </section>

      <section className={s.band}>
        <div className={s.bandInner}>
          <blockquote>
            <p className={s.quote}>
              “{design.name} changed how our whole team works. It&apos;s the first tool everyone
              actually enjoys using.”
            </p>
            <footer>
              <span className={s.avatar} aria-hidden /> Alex Rivera · Head of Product, Northwind
            </footer>
          </blockquote>
          <div className={s.stats}>
            {copy.stats.map(([v, l]) => (
              <div key={l}>
                <b>{v}</b>
                <span>{l}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={s.section} id="pricing">
        <p className={s.eyebrow}>Pricing</p>
        <h2 className={s.h2}>Simple plans that grow with you.</h2>
        <div className={s.pricing}>
          {[
            ["Starter", "$0", "For individuals getting started.", ["1 project", "Community support", "Basic analytics"]],
            ["Pro", "$24", "For growing teams that ship fast.", ["Unlimited projects", "Priority support", "Advanced analytics", "SSO"]],
            ["Enterprise", "Custom", "For organisations at scale.", ["Dedicated manager", "99.99% SLA", "Audit logs"]],
          ].map(([name, price, desc, items], i) => (
            <article key={name as string} className={`${s.card} ${i === 1 ? s.featured : ""}`}>
              <div className={s.tierHead}>
                <h3 className={s.h3}>{name}</h3>
                {i === 1 && <span className={s.badgeSolid}>Popular</span>}
              </div>
              <p className={s.price}>
                {price}
                {price !== "Custom" && <small>/mo</small>}
              </p>
              <p>{desc}</p>
              <ul>
                {(items as string[]).map((it) => (
                  <li key={it}>{it}</li>
                ))}
              </ul>
              <a href="#" className={i === 1 ? s.btnPrimary : s.btnSecondary}>
                {i === 2 ? "Contact sales" : "Choose plan"}
              </a>
            </article>
          ))}
        </div>
      </section>

      <section className={s.cta}>
        <h2 className={s.h2}>Start building with {design.name} today.</h2>
        <p className={s.lead}>Join thousands of teams already shipping faster.</p>
        <form className={s.form} action="#">
          <input type="email" placeholder="you@company.com" aria-label="Email" />
          <button type="button" className={s.btnPrimary}>
            Get early access
          </button>
        </form>
        <div className={s.chips}>
          {["Free 14-day trial", "No credit card", "Cancel anytime"].map((c) => (
            <span key={c} className={s.chip}>
              {c}
            </span>
          ))}
        </div>
      </section>

      <footer className={s.footer}>
        <div className={s.footerCols}>
          <div>
            <Wordmark name={design.name} />
            <p>{design.tagline.split(". ")[0]}</p>
          </div>
          {[
            ["Product", ["Features", "Pricing", "Changelog", "Roadmap"]],
            ["Company", ["About", "Careers", "Blog", "Press"]],
            ["Resources", ["Docs", "Guides", "Support", "Status"]],
          ].map(([title, links]) => (
            <div key={title as string}>
              <h4>{title}</h4>
              {(links as string[]).map((l) => (
                <a key={l} href="#">
                  {l}
                </a>
              ))}
            </div>
          ))}
        </div>
        <div className={s.legal}>
          <span>
            © {year} {design.name} (inspired preview)
          </span>
          <span>Privacy · Terms · Cookies</span>
        </div>
      </footer>
    </div>
  );
}
