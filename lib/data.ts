export type BusStop = {
  id: string
  name: string
  region: string
  district: string
  street: string
  lat: number
  lng: number
  /** 일일 평균 승차 인원 */
  boarding: number
  /** 일일 평균 하차 인원 */
  alighting: number
  /** 유동인구 등급: 0(낮음) ~ 1(높음) */
  intensity: number
  /** 혼잡 시간대 */
  peakHour: string
  /** 시간대별 승하차 합계 (06시~22시, 2시간 간격) */
  hourly: { time: string; count: number }[]
}

export type RegionKey = '서울' | '인천' | '부천'

export const REGIONS: Record<
  RegionKey,
  { center: [number, number]; zoom: number; districts: Record<string, string[]> }
> = {
  서울: {
    center: [37.5012, 127.0396],
    zoom: 14,
    districts: {
      강남구: ['강남대로', '테헤란로', '봉은사로'],
      마포구: ['양화로', '월드컵북로'],
      종로구: ['종로', '세종대로'],
    },
  },
  인천: {
    center: [37.4845, 126.7286],
    zoom: 14,
    districts: {
      부평구: ['부평대로', '경원대로'],
      연수구: ['컨벤시아대로', '청능대로'],
      미추홀구: ['인하로', '독배로'],
    },
  },
  부천: {
    center: [37.5035, 126.766],
    zoom: 14,
    districts: {
      원미구: ['길주로', '부천로'],
      소사구: ['경인로', '소사로'],
      오정구: ['오정로', '여월로'],
    },
  },
}

function makeHourly(base: number): { time: string; count: number }[] {
  // 출퇴근 시간대(08시, 18시) 피크를 반영한 분포
  const weights = [0.45, 0.95, 0.6, 0.55, 0.7, 1, 0.8, 0.4]
  const times = ['06시', '08시', '10시', '12시', '14시', '16시', '18시', '20시']
  return times.map((time, i) => ({
    time,
    count: Math.round(base * weights[i]),
  }))
}

const raw: Omit<BusStop, 'hourly'>[] = [
  // 서울 - 강남구
  { id: 's1', name: '강남역.강남대로', region: '서울', district: '강남구', street: '강남대로', lat: 37.498, lng: 127.0276, boarding: 18400, alighting: 19250, intensity: 0.98, peakHour: '18시~19시' },
  { id: 's2', name: '역삼역.국기원입구', region: '서울', district: '강남구', street: '테헤란로', lat: 37.5006, lng: 127.0364, boarding: 11200, alighting: 10800, intensity: 0.82, peakHour: '08시~09시' },
  { id: 's3', name: '선릉역.삼성생명', region: '서울', district: '강남구', street: '테헤란로', lat: 37.5045, lng: 127.0489, boarding: 9400, alighting: 9700, intensity: 0.74, peakHour: '18시~19시' },
  { id: 's4', name: '코엑스.봉은사', region: '서울', district: '강남구', street: '봉은사로', lat: 37.5132, lng: 127.0588, boarding: 7600, alighting: 8200, intensity: 0.66, peakHour: '13시~14시' },
  // 서울 - 마포구
  { id: 's5', name: '합정역.양화로', region: '서울', district: '마포구', street: '양화로', lat: 37.5497, lng: 126.9136, boarding: 8800, alighting: 8600, intensity: 0.71, peakHour: '20시~21시' },
  { id: 's6', name: '월드컵경기장', region: '서울', district: '마포구', street: '월드컵북로', lat: 37.5683, lng: 126.8974, boarding: 4200, alighting: 4500, intensity: 0.38, peakHour: '17시~18시' },
  // 서울 - 종로구
  { id: 's7', name: '광화문.세종대로', region: '서울', district: '종로구', street: '세종대로', lat: 37.5721, lng: 126.9769, boarding: 13600, alighting: 13100, intensity: 0.88, peakHour: '08시~09시' },
  { id: 's8', name: '종각역.종로', region: '서울', district: '종로구', street: '종로', lat: 37.5701, lng: 126.9831, boarding: 10300, alighting: 10500, intensity: 0.79, peakHour: '18시~19시' },

  // 인천 - 부평구
  { id: 'i1', name: '부평역.부평대로', region: '인천', district: '부평구', street: '부평대로', lat: 37.4894, lng: 126.7244, boarding: 14200, alighting: 14600, intensity: 0.9, peakHour: '18시~19시' },
  { id: 'i2', name: '부평시장.경원대로', region: '인천', district: '부평구', street: '경원대로', lat: 37.4965, lng: 126.7253, boarding: 7300, alighting: 7100, intensity: 0.62, peakHour: '11시~12시' },
  // 인천 - 연수구
  { id: 'i3', name: '송도컨벤시아', region: '인천', district: '연수구', street: '컨벤시아대로', lat: 37.3894, lng: 126.6404, boarding: 5600, alighting: 6000, intensity: 0.5, peakHour: '09시~10시' },
  { id: 'i4', name: '연수역.청능대로', region: '인천', district: '연수구', street: '청능대로', lat: 37.4112, lng: 126.6781, boarding: 6800, alighting: 6500, intensity: 0.58, peakHour: '18시~19시' },
  // 인천 - 미추홀구
  { id: 'i5', name: '인하대후문.인하로', region: '인천', district: '미추홀구', street: '인하로', lat: 37.4498, lng: 126.6571, boarding: 9100, alighting: 8900, intensity: 0.72, peakHour: '17시~18시' },
  { id: 'i6', name: '용현시장.독배로', region: '인천', district: '미추홀구', street: '독배로', lat: 37.4561, lng: 126.6443, boarding: 4400, alighting: 4200, intensity: 0.4, peakHour: '10시~11시' },

  // 부천 - 원미구
  { id: 'b1', name: '부천시청.길주로', region: '부천', district: '원미구', street: '길주로', lat: 37.5043, lng: 126.7669, boarding: 12400, alighting: 12800, intensity: 0.86, peakHour: '18시~19시' },
  { id: 'b2', name: '부천역.부천로', region: '부천', district: '원미구', street: '부천로', lat: 37.4843, lng: 126.7831, boarding: 13900, alighting: 13500, intensity: 0.89, peakHour: '08시~09시' },
  // 부천 - 소사구
  { id: 'b3', name: '소사역.경인로', region: '부천', district: '소사구', street: '경인로', lat: 37.4817, lng: 126.7951, boarding: 7800, alighting: 7600, intensity: 0.64, peakHour: '18시~19시' },
  { id: 'b4', name: '소사본동.소사로', region: '부천', district: '소사구', street: '소사로', lat: 37.4762, lng: 126.7944, boarding: 4900, alighting: 4700, intensity: 0.43, peakHour: '12시~13시' },
  // 부천 - 오정구
  { id: 'b5', name: '오정동.오정로', region: '부천', district: '오정구', street: '오정로', lat: 37.5278, lng: 126.7906, boarding: 5300, alighting: 5100, intensity: 0.46, peakHour: '17시~18시' },
  { id: 'b6', name: '여월휴먼시아.여월로', region: '부천', district: '오정구', street: '여월로', lat: 37.5189, lng: 126.7724, boarding: 3800, alighting: 3600, intensity: 0.34, peakHour: '09시~10시' },
]

export const BUS_STOPS: BusStop[] = raw.map((s) => ({
  ...s,
  hourly: makeHourly(Math.round((s.boarding + s.alighting) / 2)),
}))

export function intensityGrade(v: number): { label: string; key: 'high' | 'mid' | 'low' } {
  if (v >= 0.7) return { label: '매우 혼잡', key: 'high' }
  if (v >= 0.45) return { label: '보통', key: 'mid' }
  return { label: '여유', key: 'low' }
}

/** 히트맵용 포인트 생성: 정류장 주변에 가중치를 분산 */
export function buildHeatPoints(stops: BusStop[]): [number, number, number][] {
  const points: [number, number, number][] = []
  for (const s of stops) {
    // 중심 포인트
    points.push([s.lat, s.lng, s.intensity])
    // 주변 분산 포인트
    const spread = 0.0016 + s.intensity * 0.0022
    const count = Math.round(6 + s.intensity * 14)
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + s.intensity
      const r = spread * ((i % 3) + 1) * 0.5
      points.push([
        s.lat + Math.sin(angle) * r,
        s.lng + Math.cos(angle) * r,
        s.intensity * (0.4 + (i % 3) * 0.2),
      ])
    }
  }
  return points
}
