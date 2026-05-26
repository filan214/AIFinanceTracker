import { Sidebar } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { MobileHeader } from "@/components/layout/mobile-header";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex min-h-screen flex-1 flex-col">
        <MobileHeader />
        <main className="flex-1 px-4 pb-24 pt-6 sm:px-8 lg:pb-10 lg:pt-8" style={{ padding: "24px 32px 40px" }}>
          {children}
        </main>
        <MobileNav />
      </div>
    </div>
  );
}
