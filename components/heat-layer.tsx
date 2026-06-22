"use client"

import { useEffect } from "react"
import { useMap } from "react-leaflet"
import L from "leaflet"
import "leaflet.heat"

type Props = {
  points: [number, number, number][]
  visible: boolean
  gradient?: Record<number, string>
  radius?: number
  blur?: number
}

const FOOT_GRADIENT: Record<number, string> = {
  0.0: "#16a34a", // green - 여유
  0.4: "#84cc16",
  0.6: "#eab308", // yellow - 보통
  0.8: "#f97316",
  1.0: "#dc2626", // red - 매우 혼잡
}

export function HeatLayer({ points, visible, gradient, radius = 32, blur = 22 }: Props) {
  const map = useMap()

  useEffect(() => {
    if (!visible) return
    const layer = (L as any).heatLayer(points, {
      radius,
      blur,
      maxZoom: 17,
      max: 1,
      minOpacity: 0.35,
      gradient: gradient ?? FOOT_GRADIENT,
    })
    layer.addTo(map)
    return () => {
      map.removeLayer(layer)
    }
  }, [map, points, visible, gradient, radius, blur])

  return null
}
