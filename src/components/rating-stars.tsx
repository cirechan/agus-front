import { Star } from "lucide-react"
import { cn } from "@/lib/utils"

export function RatingStars({ value }: { value: number }) {
  const rounded = Math.round(value)
  return (
    <div className="flex gap-0.5" aria-label={`${value} de 5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={cn(
            "h-4 w-4",
            i < rounded ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"
          )}
        />
      ))}
    </div>
  )
}
