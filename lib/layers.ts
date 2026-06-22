import { REGIONS, BUS_STOPS, type RegionKey } from "./data"

export type LayerKey = "foot" | "traffic" | "bus" | "tower"

export type TrafficPoint = {
  id: string
  name: string
  lat: number
  lng: number
  /** 시간당 평균 통행량(대) */
  volume: number
  /** 0~1 정규화 강도 */
  intensity: number
}

export type CellTower = {
  id: string
  name: string
  lat: number
  lng: number
  /** 추정 유동인구(명) */
  population: number
  /** 통신 3사 기준 신호 등급 */
  signal: "강" | "보통" | "약"
}

/** 지역별 휴대폰 기지국(목업) — 유동인구 추정 프록시 */
export const CELL_TOWERS: CellTower[] = [
  // 서울
  { id: "t-s1", name: "강남대로 기지국", lat: 37.4995, lng: 127.0286, population: 42000, signal: "강" },
  { id: "t-s2", name: "테헤란로 기지국", lat: 37.5028, lng: 127.0395, population: 31500, signal: "강" },
  { id: "t-s3", name: "광화문 기지국", lat: 37.5715, lng: 126.9785, population: 36800, signal: "강" },
  { id: "t-s4", name: "합정 기지국", lat: 37.5489, lng: 126.9145, population: 22400, signal: "보통" },
  // 인천
  { id: "t-i1", name: "부평역 기지국", lat: 37.4889, lng: 126.7251, population: 29800, signal: "강" },
  { id: "t-i2", name: "송도국제도시 기지국", lat: 37.389, lng: 126.6412, population: 18200, signal: "보통" },
  { id: "t-i3", name: "인하대 기지국", lat: 37.4503, lng: 126.6578, population: 16500, signal: "보통" },
  // 부천
  { id: "t-b1", name: "부천시청 기지국", lat: 37.5048, lng: 126.7662, population: 25600, signal: "강" },
  { id: "t-b2", name: "부천역 기지국", lat: 37.4849, lng: 126.7825, population: 27300, signal: "강" },
  { id: "t-b3", name: "소사역 기지국", lat: 37.4821, lng: 126.7958, population: 14900, signal: "약" },
]

export function towersByRegion(region: RegionKey): CellTower[] {
  const prefix = region === "서울" ? "t-s" : region === "인천" ? "t-i" : "t-b"
  return CELL_TOWERS.filter((t) => t.id.startsWith(prefix))
}

/**
 * 교통량 목업 생성 — 공공데이터 API 응답이 없을 때 사용하는 폴백.
 * 해당 지역 정류장 주변 도로에 통행량을 분산 배치한다.
 */
export function buildTrafficMock(region: RegionKey): TrafficPoint[] {
  const stops = BUS_STOPS.filter((s) => s.region === region)
  const points: TrafficPoint[] = []
  stops.forEach((s, idx) => {
    const base = Math.round(900 + s.intensity * 2600)
    // 정류장 인근 도로 2~3개 지점에 통행량 분산
    const spots = 3
    for (let i = 0; i < spots; i++) {
      const angle = (i / spots) * Math.PI * 2 + idx
      const r = 0.0026 + (i % 2) * 0.0016
      const volume = Math.round(base * (0.7 + (i % 3) * 0.18))
      points.push({
        id: `tr-${region}-${idx}-${i}`,
        name: `${s.street} 구간`,
        lat: s.lat + Math.sin(angle) * r,
        lng: s.lng + Math.cos(angle) * r,
        volume,
        intensity: Math.min(1, volume / 3500),
      })
    }
  })
  return points
}

/** 교통량 포인트를 leaflet.heat 형식으로 변환 */
export function trafficHeatPoints(points: TrafficPoint[]): [number, number, number][] {
  return points.map((p) => [p.lat, p.lng, p.intensity])
}

/** 지역 중심 좌표(현위치 폴백/지도 이동용) */
export function regionCenter(region: RegionKey): [number, number] {
  return REGIONS[region].center
}
