import DashboardContent from "@/components/admin/DashboardStats";
import { getServerSession } from "@/lib/auth";

export const metadata = { title: "Dashboard" };

export default async function AdminDashboard() {
  const session = await getServerSession();
  return <DashboardContent user={session} />;
}


