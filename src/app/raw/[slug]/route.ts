import { getDesign, getDesigns } from "@/lib/designs";

export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return getDesigns().map((d) => ({ slug: d.slug }));
}

export async function GET(_req: Request, { params }: RouteContext<"/raw/[slug]">) {
  const design = getDesign((await params).slug);
  if (!design) return new Response("Not found", { status: 404 });

  return new Response(design.markdown, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": `inline; filename="${design.slug}-DESIGN.md"`,
    },
  });
}
