import BottomNav from "../../components/BottomNav";
import SideNav from "../../components/SideNav";
import Footer from "../../components/Footer";

export default function TabsLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <SideNav />
      {/* content: full-bleed on mobile, offset by sidebar + centered on desktop */}
      <div className="min-h-screen pb-[96px] md:pb-12 md:pl-60">
        <div className="mx-auto w-full max-w-[1180px]">{children}</div>
        <Footer />
      </div>
      <BottomNav />
    </>
  );
}
