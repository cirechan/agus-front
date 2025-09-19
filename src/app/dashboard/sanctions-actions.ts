"use server"

import { sancionesService } from "@/lib/api/services"
import { revalidatePath } from "next/cache"

export async function setSanctionStatus(formData: FormData) {
  const playerId = Number(formData.get("playerId"))
  const reference = (formData.get("reference") as string | null)?.trim()
  const type = (formData.get("type") as string | null)?.trim() === "red" ? "red" : "yellow"
  const completedValue = (formData.get("completed") as string | null) ?? "false"
  const completed = completedValue === "true"

  if (!playerId || !reference) {
    return
  }

  await sancionesService.setStatus({ playerId, reference, type, completed })
  revalidatePath("/dashboard")
}
