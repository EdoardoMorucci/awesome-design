import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { splitSections, type Design } from "@/lib/designs";
import { CopyButton } from "./CopyButton";
import s from "./detail.module.css";

const anchor = (t: string) =>
  t
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

export function SpecView({ design }: { design: Design }) {
  const { preamble, sections } = splitSections(design.body);

  return (
    <div className={s.specLayout}>
      <nav className={s.toc} aria-label="Sections">
        <p>On this page</p>
        {sections.map((sec) => (
          <a key={sec.title} href={`#sec-${anchor(sec.title)}`}>
            {sec.title.replace(/^\d+\.\s*/, "")}
          </a>
        ))}
      </nav>
      <article className={s.prose}>
        {preamble && <ReactMarkdown remarkPlugins={[remarkGfm]}>{preamble}</ReactMarkdown>}
        {sections.map((sec) => (
          <section key={sec.title} id={`sec-${anchor(sec.title)}`} className={s.specSection}>
            <div className={s.sectionCopy}>
              <CopyButton text={sec.markdown.trim()} variant="ghost" title="Copy this section as markdown">
                Copy section
              </CopyButton>
            </div>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{sec.markdown}</ReactMarkdown>
          </section>
        ))}
      </article>
    </div>
  );
}
