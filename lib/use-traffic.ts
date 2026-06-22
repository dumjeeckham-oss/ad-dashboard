"use client"

import useSWR from "swr"
import { useMemo } from "react"
import { buildTrafficMock, trafficHeatPoints, type TrafficPoint } from "./layers"
import type { RegionKey } from "./data"

type ApiResponse = {
  source: "incheon" | "gyeonggi" | "none"
  connected: boolean
  total: number
  count: number
  records: { name: string; volume: number; lat?: number; lng?: number }[]
  message?: string
}

const fetcher = (url: string) => fetch(url).then((r) => r.json() as Promise<ApiResponse>)

export type TrafficState = {
  points: TrafficPoint[]
  heatPoints: [number, number, number][]
  connected: boolean
  message: string
  loading: boolean
}

export function useTraffic(region: RegionKey): TrafficState {
  const { data, isLoading } = useSWR<ApiResponse>(
    `/api/traffic?region=${encodeURIComponent(region)}`,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 60_000 },
  )

  return useMemo(() => {
    const mock = buildTrafficMock(region)

    // 실시간 API가 좌표를 포함한 레코드를 반환한 경우 우선 사용
    const geoRecords =
      data?.records?.filter((r) => typeof r.lat === "number" && typeof r.lng === "number") ?? []

    if (geoRecords.length > 0) {
      const maxVol = Math.max(...geoRecords.map((r) => r.volume))
      const points: TrafficPoint[] = geoRecords.map((r, i) => ({
        id: `api-${region}-${i}`,
        name: r.name,
        lat: r.lat as number,
        lng: r.lng as number,
        volume: r.volume,
        intensity: Math.min(1, r.volume / (maxVol || 1)),
      }))
      return {
        points,
        heatPoints: trafficHeatPoints(points),
        connected: true,
        message: data?.message ?? "실시간 교통량 연동됨",
        loading: isLoading,
      }
    }

    return {
      points: mock,
      heatPoints: trafficHeatPoints(mock),
      connected: Boolean(data?.connected),
      message:
        data?.message ?? "추정 교통량 데이터를 표시합니다. (실시간 API 미연동)",
      loading: isLoading,
    }
  }, [region, data, isLoading])
}
