"use client"

import { X, ArrowDownToLine, ArrowUpFromLine, Clock, Users } from "lucide-react"
import { intensityGrade, type BusStop } from "@/lib/data"
import { Badge } from "@/components/ui/badge"

const GRADE_STYLE: Record<"high" | "mid" | "low", string> = {
  high: "bg-heat-high text-white",
  mid: "bg-heat-mid text-black",
  low: "bg-heat-low text-black",
}

export function StopStatCard({ stop, onClose }: { stop: BusStop; onClose: () => void }) {
  const grade = intensityGrade(stop.intensity)
  const total = stop.boarding + stop.alighting
  const maxHourly = Math.max(...stop.hourly.map((h) => h.count))

  return (
    <div className="w-full overflow-hidden rounded-2xl border-2 border-border bg-card shadow-xl">
      <div className="flex items-start justify-between gap-3 bg-primary px-4 py-3 text-primary-foreground">
        <div>
          <p className="text-sm font-semibold opacity-90 md:text-base">
            {stop.region} · {stop.district} · {stop.street}
          </p>
          <h3 className="text-balance text-xl font-bold leading-tight md:text-2xl">
            {stop.name}
          </h3>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="닫기"
          className="rounded-lg p-1.5 transition-colors hover:bg-white/20"
        >
          <X className="size-6" aria-hidden="true" />
        </button>
      </div>

      <div className="space-y-4 p-4 md:p-5">
        <div className="flex items-center gap-2">
          <Badge className={`${GRADE_STYLE[grade.key]} px-3 py-1 text-base font-bold`}>
            유동인구 {grade.label}
          </Badge>
          <span className="flex items-center gap-1 text-base font-semibold text-muted-foreground">
            <Clock className="size-5" aria-hidden="true" /> 혼잡 {stop.peakHour}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Stat
            icon={<ArrowUpFromLine className="size-6 text-primary" aria-hidden="true" />}
            label="일일 승차"
            value={stop.boarding}
          />
          <Stat
            icon={<ArrowDownToLine className="size-6 text-primary" aria-hidden="true" />}
            label="일일 하차"
            value={stop.alighting}
          />
        </div>

        <div className="flex items-center justify-between rounded-xl bg-muted px-4 py-3">
          <span className="flex items-center gap-2 text-lg font-bold">
            <Users className="size-6 text-primary" aria-hidden="true" /> 총 이용객
          </span>
          <span className="text-2xl font-extrabold tabular-nums text-primary">
            {total.toLocaleString("ko-KR")}명
          </span>
        </div>

        <div>
          <p className="mb-2 text-base font-bold text-muted-foreground">시간대별 이용 추이</p>
          <div className="flex h-28 items-end justify-between gap-1.5">
            {stop.hourly.map((h) => (
              <div key={h.time} className="flex flex-1 flex-col items-center gap-1">
                <div className="flex w-full flex-1 items-end">
                  <div
                    className="w-full rounded-t-md bg-primary/80"
                    style={{ height: `${Math.max(8, (h.count / maxHourly) * 100)}%` }}
                    title={`${h.time} ${h.count.toLocaleString("ko-KR")}명`}
                  />
                </div>
                <span className="text-xs font-medium text-muted-foreground md:text-sm">
                  {h.time}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function Stat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: number
}) {
  return (
    <div className="rounded-xl border-2 border-border bg-card px-3 py-3">
      <div className="flex items-center gap-2 text-base font-bold text-muted-foreground">
        {icon}
        {label}
      </div>
      <p className="mt-1 text-2xl font-extrabold tabular-nums md:text-3xl">
        {value.toLocaleString("ko-KR")}
        <span className="ml-1 text-lg font-bold text-muted-foreground">명</span>
      </p>
    </div>
  )
}
