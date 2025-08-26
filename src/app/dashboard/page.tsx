import { SectionCards } from "@/components/section-cards"

export default function DashboardPage() {
  return (
    <>
      <div className="flex items-center justify-between px-4 lg:px-6">
        <div>
          <h1 className="text-2xl font-semibold">Hola Míster!</h1>
          <p className="text-muted-foreground">
            Bienvenido a la plataforma del CD San Agustín
          </p>
        </div>
      </div>

      <SectionCards />
    </>
  )
}
