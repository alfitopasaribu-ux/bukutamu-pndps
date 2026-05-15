import VisitorDetailClient from "@/components/admin/VisitorDetailClient";

type ParamsPromise = Promise<{ id: string }>;

type PageProps = {
  params: ParamsPromise;
};

export default async function VisitorDetailPage({ params }: PageProps) {
  const { id } = await params;
  return <VisitorDetailClient id={id} />;
}







