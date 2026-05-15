import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth";
import AdminSidebar from "@/components/admin/Sidebar";
import AdminHeader from "@/components/admin/Header";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession();
  if (!session) redirect("/login");

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-[#070d1a] overflow-hidden">
      <AdminSidebar user={session} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <AdminHeader user={session} />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}