import { NextResponse } from "next/server"
import { XMLParser } from "fast-xml-parser"

export const dynamic = "force-dynamic"

type NormalizedRecord = {
  name: string
  volume: number
  lat?: number
  lng?: number
}

type ApiResult = {
  source: "incheon" | "gyeonggi" | "none"
  connected: boolean
  total: number
  count: number
  records: NormalizedRecord[]
  message?: string
}

const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "" })

/** 응답이 JSON이면 그대로, XML이면 파싱해서 객체로 반환 */
function parseBody(text: string, contentType: string | null): any {
  const looksJson =
    (contentType?.includes("json") ?? false) ||
    text.trim().startsWith("{") ||
    text.trim().startsWith("[")
  if (looksJson) {
    try {
      return JSON.parse(text)
    } catch {
      // fallthrough to XML
    }
  }
  return parser.parse(text)
}

/** 중첩 객체에서 배열로 추정되는 레코드 목록을 탐색 */
function findRecords(obj: any): any[] {
  if (!obj || typeof obj !== "object") return []
  if (Array.isArray(obj)) return obj
  // 흔한 공공데이터 구조: response.body.items.item / SERVICE.row 등
  const candidates: any[] = []
  const visit = (node: any) => {
    if (!node || typeof node !== "object") return
    for (const [key, val] of Object.entries(node)) {
      if (Array.isArray(val) && val.length && typeof val[0] === "object") {
        candidates.push(val)
      } else if (val && typeof val === "object") {
        if (/item|row|list|data/i.test(key) && !Array.isArray(val)) {
          candidates.push([val])
        }
        visit(val)
      }
    }
  }
  visit(obj)
  return candidates.sort((a, b) => b.length - a.length)[0] ?? []
}

function pickNumber(rec: any, keys: string[]): number {
  for (const k of Object.keys(rec)) {
    if (keys.some((c) => k.toLowerCase().includes(c))) {
      const n = Number(String(rec[k]).replace(/[^0-9.]/g, ""))
      if (!Number.isNaN(n) && n > 0) return n
    }
  }
  return 0
}

function pickString(rec: any, keys: string[]): string {
  for (const k of Object.keys(rec)) {
    if (keys.some((c) => k.toLowerCase().includes(c))) {
      const v = rec[k]
      if (v != null && String(v).trim()) return String(v).trim()
    }
  }
  return ""
}

function normalize(records: any[]): NormalizedRecord[] {
  return records
    .map((rec, i) => {
      const volume = pickNumber(rec, ["vol", "traffic", "amt", "count", "trfic"])
      const name =
        pickString(rec, ["road", "link", "name", "spot", "nm", "sttn"]) || `구간 ${i + 1}`
      const lat = pickNumber(rec, ["lat", "ycrd", "y_crd", "ycoord"]) || undefined
      const lng = pickNumber(rec, ["lon", "lng", "xcrd", "x_crd", "xcoord"]) || undefined
      return { name, volume, lat, lng }
    })
    .filter((r) => r.volume > 0)
}

async function fetchText(url: string): Promise<{ text: string; contentType: string | null }> {
  const res = await fetch(url, {
    headers: { Accept: "application/json, text/xml;q=0.9, */*;q=0.8" },
    cache: "no-store",
    signal: AbortSignal.timeout(8000),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return { text: await res.text(), contentType: res.headers.get("content-type") }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const region = searchParams.get("region") ?? ""

  const incheonKey = process.env.INCHEON_TRAFFIC_KEY ?? process.env.NEXT_PUBLIC_INCHEON_TRAFFIC_KEY
  const gyeonggiKey = process.env.GYEONGGI_TRAFFIC_KEY ?? process.env.NEXT_PUBLIC_GYEONGGI_TRAFFIC_KEY

  let source: ApiResult["source"] = "none"
  let url = ""

  if (region === "인천" && incheonKey) {
    source = "incheon"
    url = `https://apis.data.go.kr/6280000/ICRoadVolStat?serviceKey=${encodeURIComponent(
      incheonKey,
    )}&numOfRows=200&pageNo=1&_type=json`
  } else if ((region === "부천" || region === "경기") && gyeonggiKey) {
    source = "gyeonggi"
    url = `https://openapigits.gg.go.kr/api/rest/getRoadLinkTrafficInfoList?KEY=${encodeURIComponent(
      gyeonggiKey,
    )}&Type=json`
  }

  if (!url) {
    const result: ApiResult = {
      source: "none",
      connected: false,
      total: 0,
      count: 0,
      records: [],
      message: "해당 지역의 실시간 교통량 API 키가 설정되지 않아 추정 데이터를 표시합니다.",
    }
    return NextResponse.json(result)
  }

  try {
    const { text, contentType } = await fetchText(url)
    const parsed = parseBody(text, contentType)
    const raw = findRecords(parsed)
    const records = normalize(raw)
    const total = records.reduce((sum, r) => sum + r.volume, 0)
    const result: ApiResult = {
      source,
      connected: records.length > 0,
      total,
      count: records.length,
      records: records.slice(0, 300),
      message:
        records.length > 0
          ? "공공데이터 실시간 교통량을 연동했습니다."
          : "API 응답에서 교통량 레코드를 찾지 못해 추정 데이터를 표시합니다.",
    }
    return NextResponse.json(result)
  } catch (err) {
    const result: ApiResult = {
      source,
      connected: false,
      total: 0,
      count: 0,
      records: [],
      message: `실시간 연동 실패(${(err as Error).message}). 추정 데이터를 표시합니다.`,
    }
    return NextResponse.json(result)
  }
}
