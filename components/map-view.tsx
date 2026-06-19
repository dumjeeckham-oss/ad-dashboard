"use client"

import "leaflet/dist/leaflet.css"
import { useEffect, useMemo } from "react"
import { MapContainer, TileLayer, CircleMarker, Tooltip, useMap } from "react-leaflet"
import { HeatLayer } from "./heat-layer"
import { buildHeatPoints, intensityGrade, REGIONS, type BusStop, type RegionKey } from "@/lib/data"

const HEAT_COLOR: Record<"high" | "mid" | "low", string> = {
  high: "#dc2626",
  mid: "#eab308",
  low: "#16a34a",
}

function MapController({ region }: { region: RegionKey }) {
  const map = useMap()

  // Fix partial tile rendering when the container size is detected late.
  useEffect(() => {
    const fix = () => map.invalidateSize()
    const t1 = setTimeout(fix, 100)
    const t2 = setTimeout(fix, 500)
    window.addEventListener("resize", fix)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      window.removeEventListener("resize", fix)
    }
  }, [map])

  useEffect(() => {
    const { center, zoom } = REGIONS[region]
    map.flyTo(center, zoom, { duration: 0.8 })
  }, [map, region])
  return null
}

type Props = {
  region: RegionKey
  stops: BusStop[]
  heatVisible: boolean
  selectedId: string | null
  onSelect: (stop: BusStop) => void
}

export default function MapView({ region, stops, heatVisible, selectedId, onSelect }: Props) {
  const heatPoints = useMemo(() => buildHeatPoints(stops), [stops])
  const initial = REGIONS[region]

  return (
    <MapContainer
      center={initial.center}
      zoom={initial.zoom}
      scrollWheelZoom
      className="h-full w-full"
      zoomControl={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
      />
      <MapController region={region} />
      <HeatLayer points={heatPoints} visible={heatVisible} />

      {stops.map((stop) => {
        const grade = intensityGrade(stop.intensity)
        const color = HEAT_COLOR[grade.key]
        const isSelected = stop.id === selectedId
        return (
          <CircleMarker
            key={stop.id}
            center={[stop.lat, stop.lng]}
            radius={isSelected ? 13 : 9}
            pathOptions={{
              color: "#ffffff",
              weight: isSelected ? 3 : 2,
              fillColor: color,
              fillOpacity: 0.95,
            }}
            eventHandlers={{ click: () => onSelect(stop) }}
          >
            <Tooltip direction="top" offset={[0, -8]} opacity={1}>
              <span className="text-base font-semibold">{stop.name}</span>
            </Tooltip>
          </CircleMarker>
        )
      })}
    </MapContainer>
  )
}
