import { redirect } from 'next/navigation';
import { routes } from '@/lib/routes';

interface LegacyInterviewPageProps {
  params: Promise<{ id: string }>;
}

export default async function LegacyInterviewPage({ params }: LegacyInterviewPageProps) {
  const { id } = await params;
  redirect(routes.interview(id));
}
