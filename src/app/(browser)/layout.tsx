import { Sidebar } from "@/components/Sidebar";
import { getMeta, getSummaries } from "@/lib/designs";
import s from "./browser.module.css";

export default function BrowserLayout({ children }: LayoutProps<"/">) {
  const meta = getMeta();
  return (
    <div className={s.shell}>
      <Sidebar
        designs={getSummaries()}
        categories={meta.categories}
        repo={meta.repo}
        fetchedAt={meta.fetchedAt}
      />
      <main className={s.main}>{children}</main>
    </div>
  );
}
