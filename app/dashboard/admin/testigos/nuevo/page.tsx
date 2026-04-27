import TestigoForm from '@/components/testigos/TestigoForm'

export default function NuevoTestigoPage() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Nuevo Participante</h1>
        <p className="text-gray-500 text-sm mt-1">Registra a la persona que participará en la inspección como testigo, representante o firmante</p>
      </div>
      <TestigoForm />
    </div>
  )
}
