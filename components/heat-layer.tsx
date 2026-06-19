"use client"

import { useEffect } from "react"
import { useMap } from "react-leaflet"
import L from "leaflet"
import "leaflet.heat"

type Props = {
  points: [number, number, number][]
  visible: boolean
}

export function HeatLayer({ points, visible }: Props) {
  const map = useMap()

  useEffect(() => {
    if (!visible) return
    // red-yellow-green gradient (low -> high reads green -> yellow -> red)
    const layer = (L as any).heatLayer(points, {
      radius: 32,
      blur: 22,
      maxZoom: 17,
      max: 1,
      minOpacity: 0.35,
      gradient: {
        0.0: "#16a34a", // green - 여유
        0.4: "#84cc16",
        0.6: "#eab308", // yellow - 보통
        0.8: "#f97316",
        1.0: "#dc2626", // red - 매우 혼잡
      },
    })
    layer.addTo(map)
    return () => {
      map.removeLayer(layer)
    }
  }, [map, points, visible])

  return null
}
