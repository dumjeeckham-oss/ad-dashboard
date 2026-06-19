"use client"

import { MapPin, Layers } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { RegionKey } from "@/lib/data"

const ALL = "전체"

type Props = {
  region: RegionKey
  district: string
  street: string
  districtOptions: string[]
  streetOptions: string[]
  heatVisible: boolean
  onRegionChange: (v: RegionKey) => void
  onDistrictChange: (v: string) => void
  onStreetChange: (v: string) => void
  onHeatToggle: () => void
}

const triggerClass =
  "h-14 w-full rounded-xl border-2 bg-card text-lg font-semibold md:text-xl"

export function FilterBar({
  region,
  district,
  street,
  districtOptions,
  streetOptions,
  heatVisible,
  onRegionChange,
  onDistrictChange,
  onStreetChange,
  onHeatToggle,
}: Props) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border-2 border-border bg-card p-4 shadow-sm md:p-5">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 md:gap-4">
        <Field label="지역" htmlFor="region">
          <Select value={region} onValueChange={(v) => onRegionChange(v as RegionKey)}>
            <SelectTrigger id="region" className={triggerClass}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="text-lg">
              {(["서울", "인천", "부천"] as RegionKey[]).map((r) => (
                <SelectItem key={r} value={r} className="py-3 text-lg">
                  {r}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field label="구역" htmlFor="district">
          <Select value={district} onValueChange={(v) => onDistrictChange(v ?? ALL)}>
            <SelectTrigger id="district" className={triggerClass}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="text-lg">
              <SelectItem value={ALL} className="py-3 text-lg">
                {ALL}
              </SelectItem>
              {districtOptions.map((d) => (
                <SelectItem key={d} value={d} className="py-3 text-lg">
                  {d}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field label="거리" htmlFor="street">
          <Select value={street} onValueChange={(v) => onStreetChange(v ?? ALL)}>
            <SelectTrigger id="street" className={triggerClass}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="text-lg">
              <SelectItem value={ALL} className="py-3 text-lg">
                {ALL}
              </SelectItem>
              {streetOptions.map((s) => (
                <SelectItem key={s} value={s} className="py-3 text-lg">
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </div>

      <button
        type="button"
        onClick={onHeatToggle}
        aria-pressed={heatVisible}
        className={`flex h-14 items-center justify-center gap-2 rounded-xl border-2 text-lg font-semibold transition-colors md:text-xl ${
          heatVisible
            ? "border-primary bg-primary text-primary-foreground"
            : "border-border bg-card text-foreground"
        }`}
      >
        <Layers className="size-6" aria-hidden="true" />
        유동인구 히트맵 {heatVisible ? "켜짐" : "꺼짐"}
      </button>
    </div>
  )
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string
  htmlFor: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={htmlFor}
        className="flex items-center gap-1.5 text-base font-bold text-muted-foreground md:text-lg"
      >
        <MapPin className="size-5 text-primary" aria-hidden="true" />
        {label}
      </label>
      {children}
    </div>
  )
}
