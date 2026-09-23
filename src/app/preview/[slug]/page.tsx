import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getDesign, getDesigns } from "@/lib/designs";
import { googleFontsHref } from "@/lib/fonts";
import { PreviewSite } from "@/components/preview/PreviewSite";

export const dynamicParams = false;

export function generateStaticParams() {
  return getDesigns().map((d) => ({ slug: d.slug }));
}

export async function generateMetadata({ params }: PageProps<"/preview/[slug]">): Promise<Metadata> {
  const design = getDesign((await params).slug);
  return design ? { title: `${design.name} preview`, robots: { index: false } } : {};
}

export default async function PreviewPage({ params }: PageProps<"/preview/[slug]">) {
  const design = getDesign((await params).slug);
  if (!design) notFound();

  const fonts = googleFontsHref(design.theme.fonts.google);

  return (
    <>
      {fonts && <link rel="stylesheet" href={fonts} precedence="default" />}
      <PreviewSite design={design} />
    </>
  );
}
