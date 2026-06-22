"use client"

import { useState } from "react"
import { Layers, Activity, Car, BusFront, RadioTower, ChevronDown } from "lucide-react"
import type { LayerKey } from "@/lib/layers"

type Props = {
  layers: Record<LayerKey, boolean>
  onToggle: (key: LayerKey) => void
}

const LAYER_META: { key: LayerKey; label: string; icon: typeof Activity; color: string }[] = [
  { key: "foot", label: "유동인구", icon: Activity, color: "text-heat-high" },
  { key: "traffic", label: "교통량", icon: Car, color: "text-primary" },
  { key: "bus", label: "버스 정류장", icon: BusFront, color: "text-primary" },
  { key: "tower", label: "휴대폰 기지국", icon: RadioTower, color: "text-heat-mid" },
]

export function LayerPanel({ layers, onToggle }: Props) {
  const [open, setOpen] = useState(true)
  const activeCount = Object.values(layers).filter(Boolean).length

  return (
    <div className="w-52 overflow-hidden rounded-xl border-2 border-border bg-card/95 shadow-lg backdrop-blur md:w-60">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-2 bg-primary px-3 py-2.5 text-primary-foreground"
      >
        <span className="flex items-center gap-2 text-base font-bold md:text-lg">
          <Layers className="size-5" aria-hidden="true" />
          데이터 레이어
        </span>
        <span className="flex items-center gap-1">
          <span className="rounded-full bg-white/25 px-2 py-0.5 text-sm font-bold tabular-nums">
            {activeCount}
          </span>
          <ChevronDown
            className={`size-5 transition-transform ${open ? "rotate-180" : ""}`}
            aria-hidden="true"
          />
        </span>
      </button>

      {open && (
        <ul className="flex flex-col gap-1.5 p-2.5">
          {LAYER_META.map(({ key, label, icon: Icon, color }) => {
            const on = layers[key]
            return (
              <li key={key}>
                <button
                  type="button"
                  role="switch"
                  aria-checked={on}
                  onClick={() => onToggle(key)}
                  className={`flex w-full items-center gap-2.5 rounded-lg border-2 px-2.5 py-2.5 text-left transition-colors ${
                    on ? "border-primary bg-accent" : "border-transparent bg-muted/60"
                  }`}
                >
                  <Icon className={`size-6 shrink-0 ${on ? color : "text-muted-foreground"}`} aria-hidden="true" />
                  <span className={`flex-1 text-base font-bold md:text-lg ${on ? "text-foreground" : "text-muted-foreground"}`}>
                    {label}
                  </span>
                  <span
                    className={`flex h-7 w-12 shrink-0 items-center rounded-full px-1 transition-colors ${
                      on ? "justify-end bg-primary" : "justify-start bg-border"
                    }`}
                  >
                    <span className="size-5 rounded-full bg-card shadow" />
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
