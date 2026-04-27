import { redirect } from 'next/navigation'

// The expediente detail page lives at /dashboard/inspector/expedientes/[id]
// and already handles admin/responsable roles (bypasses RLS with service client).
// This page simply redirects so any link pointing to /admin/expedientes/[id] works.

export default async function AdminExpedienteRedirect({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  redirect(`/dashboard/inspector/expedientes/${id}`)
}
