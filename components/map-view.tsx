"use client"

import "leaflet/dist/leaflet.css"
import { useEffect, useMemo, useState } from "react"
import { MapContainer, TileLayer, CircleMarker, Tooltip, Popup, useMap } from "react-leaflet"
import type { Map as LeafletMap } from "leaflet"
import { LocateFixed, Loader2 } from "lucide-react"
import { HeatLayer } from "./heat-layer"
import { buildHeatPoints, intensityGrade, REGIONS, type BusStop, type RegionKey } from "@/lib/data"
import type { CellTower, LayerKey } from "@/lib/layers"

const HEAT_COLOR: Record<"high" | "mid" | "low", string> = {
  high: "#dc2626",
  mid: "#eab308",
  low: "#16a34a",
}

const TRAFFIC_GRADIENT: Record<number, string> = {
  0.0: "#16a34a",
  0.5: "#eab308",
  0.75: "#f97316",
  1.0: "#dc2626",
}

function MapController({
  region,
  onReady,
}: {
  region: RegionKey
  onReady: (map: LeafletMap) => void
}) {
  const map = useMap()

  useEffect(() => {
    onReady(map)
  }, [map, onReady])

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
  layers: Record<LayerKey, boolean>
  trafficPoints: [number, number, number][]
  towers: CellTower[]
  selectedId: string | null
  onSelect: (stop: BusStop) => void
}

export default function MapView({
  region,
  stops,
  layers,
  trafficPoints,
  towers,
  selectedId,
  onSelect,
}: Props) {
  const footPoints = useMemo(() => buildHeatPoints(stops), [stops])
  const initial = REGIONS[region]
  const [map, setMap] = useState<LeafletMap | null>(null)
  const [userPos, setUserPos] = useState<[number, number] | null>(null)
  const [locating, setLocating] = useState(false)
  const [locError, setLocError] = useState<string | null>(null)

  function handleLocate() {
    setLocError(null)
    if (typeof window === "undefined" || !("geolocation" in navigator)) {
      setLocError("이 브라우저는 위치 기능을 지원하지 않습니다.")
      return
    }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const p: [number, number] = [pos.coords.latitude, pos.coords.longitude]
        setUserPos(p)
        setLocating(false)
        map?.flyTo(p, 16, { duration: 1 })
      },
      () => {
        setLocating(false)
        setLocError("위치 정보를 가져올 수 없습니다. 권한을 확인해 주세요.")
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 },
    )
  }

  return (
    <>
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
        <MapController region={region} onReady={setMap} />

        {/* 유동인구 히트맵 */}
        <HeatLayer points={footPoints} visible={layers.foot} />

        {/* 교통량 히트맵 */}
        <HeatLayer
          points={trafficPoints}
          visible={layers.traffic}
          gradient={TRAFFIC_GRADIENT}
          radius={26}
          blur={18}
        />

        {/* 버스 정류장 마커 */}
        {layers.bus &&
          stops.map((stop) => {
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
                <Popup>
                  <div style={{ minWidth: 180 }}>
                    <p style={{ fontSize: 17, fontWeight: 800, margin: "0 0 8px" }}>{stop.name}</p>
                    <div style={{ display: "flex", gap: 10 }}>
                      <div style={{ flex: 1, background: "#eff6ff", borderRadius: 10, padding: "8px 10px" }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#1d4ed8" }}>승차</div>
                        <div style={{ fontSize: 22, fontWeight: 900, color: "#1e3a8a" }}>
                          {stop.boarding.toLocaleString("ko-KR")}
                          <span style={{ fontSize: 13, fontWeight: 700 }}> 명</span>
                        </div>
                      </div>
                      <div style={{ flex: 1, background: "#eff6ff", borderRadius: 10, padding: "8px 10px" }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#1d4ed8" }}>하차</div>
                        <div style={{ fontSize: 22, fontWeight: 900, color: "#1e3a8a" }}>
                          {stop.alighting.toLocaleString("ko-KR")}
                          <span style={{ fontSize: 13, fontWeight: 700 }}> 명</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Popup>
              </CircleMarker>
            )
          })}

        {/* 휴대폰 기지국 마커 */}
        {layers.tower &&
          towers.map((t) => (
            <CircleMarker
              key={t.id}
              center={[t.lat, t.lng]}
              radius={10}
              pathOptions={{
                color: "#ffffff",
                weight: 2,
                fillColor: "#2563eb",
                fillOpacity: 0.95,
                dashArray: "2 3",
              }}
            >
              <Tooltip direction="top" offset={[0, -8]} opacity={1}>
                <span className="text-base font-semibold">{t.name}</span>
              </Tooltip>
              <Popup>
                <div style={{ minWidth: 170 }}>
                  <p style={{ fontSize: 16, fontWeight: 800, margin: "0 0 6px" }}>{t.name}</p>
                  <p style={{ fontSize: 14, fontWeight: 600, margin: "0 0 4px", color: "#475569" }}>
                    신호 등급: <b style={{ color: "#1e3a8a" }}>{t.signal}</b>
                  </p>
                  <p style={{ fontSize: 14, fontWeight: 600, margin: 0, color: "#475569" }}>
                    추정 유동인구:{" "}
                    <b style={{ fontSize: 18, color: "#1e3a8a" }}>
                      {t.population.toLocaleString("ko-KR")}명
                    </b>
                  </p>
                </div>
              </Popup>
            </CircleMarker>
          ))}

        {/* 현위치 마커 */}
        {userPos && (
          <CircleMarker
            center={userPos}
            radius={11}
            pathOptions={{ color: "#ffffff", weight: 3, fillColor: "#2563eb", fillOpacity: 1 }}
          >
            <Tooltip direction="top" offset={[0, -8]} opacity={1} permanent>
              <span className="text-base font-bold">현위치</span>
            </Tooltip>
          </CircleMarker>
        )}
      </MapContainer>

      {/* 현위치 버튼 (우측 상단) */}
      <div className="absolute right-3 top-3 z-[1000] flex flex-col items-end gap-2">
        <button
          type="button"
          onClick={handleLocate}
          disabled={locating}
          className="flex items-center gap-2 rounded-xl border-2 border-border bg-card px-4 py-3 text-base font-bold text-foreground shadow-md transition-colors hover:bg-accent disabled:opacity-70 md:text-lg"
        >
          {locating ? (
            <Loader2 className="size-6 animate-spin text-primary" aria-hidden="true" />
          ) : (
            <LocateFixed className="size-6 text-primary" aria-hidden="true" />
          )}
          현위치
        </button>
        {locError && (
          <p
            role="alert"
            className="max-w-[220px] rounded-lg border-2 border-heat-high/40 bg-card px-3 py-2 text-sm font-semibold text-heat-high shadow"
          >
            {locError}
          </p>
        )}
      </div>
    </>
  )
}
