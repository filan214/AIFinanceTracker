import { Sidebar } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { MobileHeader } from "@/components/layout/mobile-header";
import { AccentInit } from "@/components/accent-init";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <AccentInit />
      <Sidebar />
      <div className="flex min-h-screen flex-1 flex-col">
        <MobileHeader />
        <main className="flex-1 px-4 pb-24 pt-6 sm:px-8 lg:pb-10">
          {children}
        </main>
        <MobileNav />
      </div>
    </div>
  );
}
