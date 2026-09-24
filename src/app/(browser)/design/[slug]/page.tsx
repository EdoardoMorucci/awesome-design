import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getDesign, getDesigns } from "@/lib/designs";
import { toCssVariables, toJson } from "@/lib/export";
import { googleFontsHref } from "@/lib/fonts";
import { CopyMenu } from "@/components/detail/CopyMenu";
import { DesignTabs } from "@/components/detail/DesignTabs";
import { PreviewFrame } from "@/components/detail/PreviewFrame";
import { SpecView } from "@/components/detail/SpecView";
import { TokensView } from "@/components/detail/TokensView";
import s from "@/components/detail/detail.module.css";

export const dynamicParams = false;

export function generateStaticParams() {
  return getDesigns().map((d) => ({ slug: d.slug }));
}

export async function generateMetadata({ params }: PageProps<"/design/[slug]">): Promise<Metadata> {
  const design = getDesign((await params).slug);
  if (!design) return {};
  return {
    title: design.name,
    description: design.tagline || design.description.slice(0, 160),
  };
}

export default async function DesignPage({ params }: PageProps<"/design/[slug]">) {
  const design = getDesign((await params).slug);
  if (!design) notFound();

  const fonts = googleFontsHref(design.theme.fonts.google);

  return (
    <>
      {/* Hoisted into <head> by React; the Tokens tab renders type specimens with it. */}
      {fonts && <link rel="stylesheet" href={fonts} precedence="default" />}
      <DesignTabs
        tokenCount={design.palette.length}
        header={
          <div className={s.headRow}>
            <div className={s.title}>
              <div className={s.crumbs}>
                <Link href="/">All designs</Link>
                <span>/</span>
                <span>{design.category}</span>
              </div>
              <h1>
                <i style={{ background: design.theme.primary }} />
                {design.name}
              </h1>
              {(design.tagline || design.description) && (
                <p title={design.description}>{design.tagline || design.description}</p>
              )}
            </div>
            <CopyMenu
              slug={design.slug}
              markdown={design.markdown}
              spec={design.body}
              css={toCssVariables(design)}
              json={toJson(design)}
            />
          </div>
        }
        preview={<PreviewFrame slug={design.slug} name={design.name} />}
        spec={<SpecView design={design} />}
        tokens={<TokensView design={design} />}
      />
    </>
  );
}
