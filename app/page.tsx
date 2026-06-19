"use client"

import { useMemo, useState } from "react"
import dynamic from "next/dynamic"
import { Megaphone, MapPinned } from "lucide-react"
import { FilterBar } from "@/components/filter-bar"
import { StopStatCard } from "@/components/stop-stat-card"
import { HeatLegend } from "@/components/heat-legend"
import { BUS_STOPS, REGIONS, type BusStop, type RegionKey } from "@/lib/data"

const MapView = dynamic(() => import("@/components/map-view"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-muted">
      <p className="text-lg font-semibold text-muted-foreground">지도를 불러오는 중...</p>
    </div>
  ),
})

const ALL = "전체"

export default function Page() {
  const [region, setRegion] = useState<RegionKey>("서울")
  const [district, setDistrict] = useState<string>(ALL)
  const [street, setStreet] = useState<string>(ALL)
  const [heatVisible, setHeatVisible] = useState(true)
  const [selected, setSelected] = useState<BusStop | null>(null)

  const districtOptions = useMemo(
    () => Object.keys(REGIONS[region].districts),
    [region],
  )
  const streetOptions = useMemo(() => {
    if (district === ALL) {
      return Array.from(
        new Set(Object.values(REGIONS[region].districts).flat()),
      )
    }
    return REGIONS[region].districts[district] ?? []
  }, [region, district])

  const stops = useMemo(
    () =>
      BUS_STOPS.filter(
        (s) =>
          s.region === region &&
          (district === ALL || s.district === district) &&
          (street === ALL || s.street === street),
      ),
    [region, district, street],
  )

  function handleRegionChange(v: RegionKey) {
    setRegion(v)
    setDistrict(ALL)
    setStreet(ALL)
    setSelected(null)
  }
  function handleDistrictChange(v: string) {
    setDistrict(v)
    setStreet(ALL)
    setSelected(null)
  }
  function handleStreetChange(v: string) {
    setStreet(v)
    setSelected(null)
  }

  return (
    <main className="flex min-h-screen flex-col bg-background">
      <header className="border-b-2 border-border bg-card">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-4 md:px-6">
          <div className="flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Megaphone className="size-7" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold leading-tight tracking-tight md:text-3xl">
              홍보 위치 최적화 대시보드
            </h1>
            <p className="text-base font-medium text-muted-foreground md:text-lg">
              유동인구와 버스 정류장 데이터로 최적의 홍보 위치를 찾으세요
            </p>
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-7xl flex-1 px-4 py-5 md:px-6">
        <FilterBar
          region={region}
          district={district}
          street={street}
          districtOptions={districtOptions}
          streetOptions={streetOptions}
          heatVisible={heatVisible}
          onRegionChange={handleRegionChange}
          onDistrictChange={handleDistrictChange}
          onStreetChange={handleStreetChange}
          onHeatToggle={() => setHeatVisible((v) => !v)}
        />

        <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_minmax(340px,400px)]">
          {/* Map */}
          <div className="relative h-[60vh] min-h-[420px] overflow-hidden rounded-2xl border-2 border-border shadow-sm lg:h-[68vh]">
            <MapView
              region={region}
              stops={stops}
              heatVisible={heatVisible}
              selectedId={selected?.id ?? null}
              onSelect={setSelected}
            />

            <div className="pointer-events-none absolute left-3 top-3 z-[1000] flex items-center gap-2 rounded-xl border-2 border-border bg-card/95 px-3 py-2 shadow-md backdrop-blur">
              <MapPinned className="size-6 text-primary" aria-hidden="true" />
              <span className="text-base font-bold md:text-lg">
                정류장 {stops.length}곳
              </span>
            </div>

            <div className="absolute bottom-3 left-3 z-[1000] w-40 md:w-48">
              <HeatLegend />
            </div>

            {/* Mobile: stat card floats over map */}
            {selected && (
              <div className="absolute inset-x-3 bottom-3 z-[1000] lg:hidden">
                <StopStatCard stop={selected} onClose={() => setSelected(null)} />
              </div>
            )}
          </div>

          {/* Desktop side panel */}
          <aside className="hidden lg:block">
            {selected ? (
              <StopStatCard stop={selected} onClose={() => setSelected(null)} />
            ) : (
              <EmptyPanel count={stops.length} />
            )}
          </aside>
        </div>
      </div>
    </main>
  )
}

function EmptyPanel({ count }: { count: number }) {
  return (
    <div className="flex h-full min-h-[300px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border bg-card p-6 text-center">
      <div className="mb-3 flex size-16 items-center justify-center rounded-full bg-accent">
        <MapPinned className="size-8 text-primary" aria-hidden="true" />
      </div>
      <p className="text-balance text-xl font-bold md:text-2xl">
        정류장을 선택해 주세요
      </p>
      <p className="mt-2 text-pretty text-base font-medium leading-relaxed text-muted-foreground md:text-lg">
        지도 위의 정류장 마커를 누르면 일일 승하차 인원과 시간대별 이용 통계를 볼 수 있어요.
      </p>
      <p className="mt-4 text-base font-semibold text-primary">
        현재 {count}곳의 정류장이 표시되고 있습니다
      </p>
    </div>
  )
}
