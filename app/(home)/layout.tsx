import Footer from "@/components/layout/Footer";
import { HeaderWrapper } from "@/components/layout/HeaderWrapper";
import { MaintenanceBanner } from "@/components/layout/MaintenanceBanner";
import { MobileBottomNavWrapper } from "@/components/layout/MobileBottomNavWrapper";
import { AgeGateProvider } from "@/components/shared/AgeGateProvider";

export const dynamic = "force-dynamic";

export default function HomeLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen flex flex-col">
      <MaintenanceBanner />
      <AgeGateProvider />
      <HeaderWrapper />
      <main className="flex-1 pb-16 md:pb-0">{children}</main>
      <Footer />
      <MobileBottomNavWrapper />
    </div>
  );
}
