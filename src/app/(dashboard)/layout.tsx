import Header from "@/components/layout/Header";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="dashboard-layout">
      <Header />
      <main className="dashboard-content">{children}</main>
    </div>
  );
}
