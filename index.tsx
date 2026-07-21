import { useState, useCallback, useEffect } from 'react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  BarChart, Bar, ResponsiveContainer, LineChart, Line, ReferenceLine,
} from 'recharts'

/* ============================================================================
   DATA — mockData.ts
   ============================================================================ */

type AQILevel = 'good' | 'moderate' | 'sensitive' | 'unhealthy' | 'very-unhealthy' | 'hazardous'

interface Station {
  id: string
  name: string
  lat: number
  lng: number
  aqi: number
  level: AQILevel
  pm25: number
  pm10: number
  temp: number
  humidity: number
  windSpeed: number
  online: boolean
  cameraOnline: boolean
  battery: number
  solar: boolean
  firmware: string
  lastSync: string
  signal: number
  confidence: number
  district: string
  x: number
  y: number
}

interface Alert {
  id: string
  title: string
  level: 'critical' | 'high' | 'medium' | 'low'
  type: string
  reason: string
  action: string
  duration: string
  time: string
  station: string
  read: boolean
}

const stations: Station[] = [
  {
    id: 'ST-001', name: 'Almaty Central', lat: 43.2551, lng: 76.9126, aqi: 42, level: 'good',
    pm25: 8.2, pm10: 18.4, temp: 22, humidity: 48, windSpeed: 3.2, online: true, cameraOnline: true,
    battery: 87, solar: true, firmware: 'v2.4.1', lastSync: '2 min ago', signal: 94, confidence: 96,
    district: 'Medeu', x: 50, y: 45,
  },
  {
    id: 'ST-002', name: 'Dostyk Avenue', lat: 43.2403, lng: 76.9453, aqi: 78, level: 'moderate',
    pm25: 22.1, pm10: 41.3, temp: 24, humidity: 42, windSpeed: 1.8, online: true, cameraOnline: true,
    battery: 71, solar: true, firmware: 'v2.4.1', lastSync: '1 min ago', signal: 88, confidence: 91,
    district: 'Bostandyk', x: 62, y: 58,
  },
  {
    id: 'ST-003', name: 'Seifullin Junction', lat: 43.2671, lng: 76.8912, aqi: 115, level: 'sensitive',
    pm25: 41.7, pm10: 68.2, temp: 23, humidity: 39, windSpeed: 0.9, online: true, cameraOnline: false,
    battery: 52, solar: false, firmware: 'v2.3.8', lastSync: '5 min ago', signal: 76, confidence: 83,
    district: 'Alatau', x: 38, y: 35,
  },
  {
    id: 'ST-004', name: 'Industrial District', lat: 43.2189, lng: 76.8701, aqi: 162, level: 'unhealthy',
    pm25: 68.4, pm10: 112.6, temp: 25, humidity: 35, windSpeed: 2.1, online: true, cameraOnline: true,
    battery: 95, solar: true, firmware: 'v2.4.1', lastSync: 'just now', signal: 91, confidence: 88,
    district: 'Turksib', x: 28, y: 70,
  },
  {
    id: 'ST-005', name: 'Kok-Tobe Ridge', lat: 43.2481, lng: 76.9621, aqi: 18, level: 'good',
    pm25: 3.1, pm10: 7.8, temp: 19, humidity: 62, windSpeed: 5.4, online: true, cameraOnline: true,
    battery: 100, solar: true, firmware: 'v2.4.1', lastSync: '3 min ago', signal: 97, confidence: 98,
    district: 'Medeu', x: 74, y: 30,
  },
  {
    id: 'ST-006', name: 'Barakholka Market', lat: 43.2831, lng: 76.8445, aqi: 94, level: 'moderate',
    pm25: 31.2, pm10: 54.1, temp: 26, humidity: 33, windSpeed: 1.2, online: false, cameraOnline: false,
    battery: 14, solar: false, firmware: 'v2.3.5', lastSync: '2 hours ago', signal: 0, confidence: 0,
    district: 'Alatau', x: 20, y: 24,
  },
  {
    id: 'ST-007', name: 'Esentai Park', lat: 43.2234, lng: 76.9388, aqi: 55, level: 'moderate',
    pm25: 14.8, pm10: 28.3, temp: 23, humidity: 45, windSpeed: 2.7, online: true, cameraOnline: true,
    battery: 78, solar: true, firmware: 'v2.4.1', lastSync: '1 min ago', signal: 93, confidence: 94,
    district: 'Bostandyk', x: 58, y: 75,
  },
]

const alerts: Alert[] = [
  {
    id: 'A-001', title: 'High PM2.5 Detected', level: 'high', type: 'PM2.5 Spike',
    reason: 'AI cameras detected heavy traffic congestion combined with weak easterly wind (0.9 km/h). Sensor fusion confirms elevated particulate matter at 68.4 μg/m³ — 2.7× above daily average.',
    action: 'Avoid outdoor exercise. If commuting, choose routes via Dostyk Ave. Sensitive groups should stay indoors.',
    duration: 'Estimated 2–3 hours', time: '14 min ago', station: 'Seifullin Junction (ST-003)', read: false,
  },
  {
    id: 'A-002', title: 'Industrial Emission Detected', level: 'critical', type: 'Industrial Emission',
    reason: 'Camera AI identified elevated smoke plume from industrial zone. NO₂ and SO₂ sensors confirm emission event. Wind direction carrying pollutants toward residential area at 2.1 km/h.',
    action: 'Close windows in Turksib district. Avoid outdoor activity. Monitor updates every 30 minutes.',
    duration: 'Ongoing — wind shift expected in 4 hours', time: '38 min ago', station: 'Industrial District (ST-004)', read: false,
  },
  {
    id: 'A-003', title: 'Air Quality Improved', level: 'low', type: 'Improvement',
    reason: 'Mountain breeze strengthened to 5.4 km/h from northwest, dispersing accumulated pollutants. PM2.5 dropped from 24.3 to 3.1 μg/m³ over 90 minutes.',
    action: 'Good conditions for outdoor activity at Kok-Tobe and surrounding areas.',
    duration: 'Expected to continue 6+ hours', time: '1 hour ago', station: 'Kok-Tobe Ridge (ST-005)', read: true,
  },
  {
    id: 'A-004', title: 'Station Offline', level: 'medium', type: 'Device Alert',
    reason: 'ST-006 (Barakholka) has not synchronized for 2 hours. Battery critically low at 14%. Solar panel may be obstructed or malfunctioning.',
    action: 'Maintenance team notified. Using interpolated data from adjacent stations.',
    duration: 'Until maintenance (scheduled tomorrow)', time: '2 hours ago', station: 'Barakholka Market (ST-006)', read: true,
  },
  {
    id: 'A-005', title: 'Dust Risk: High Winds Forecast', level: 'medium', type: 'Weather Risk',
    reason: 'Meteorological models predict wind speed increase to 28 km/h from the south by 18:00. Historical data shows elevated PM10 during similar wind events in this corridor.',
    action: 'Prepare for PM10 increase in southern districts. Cyclists advised to check conditions before evening commute.',
    duration: 'Risk window: 18:00 – 22:00 today', time: '3 hours ago', station: 'City-wide Prediction', read: true,
  },
]

const hourlyData = Array.from({ length: 24 }, (_, i) => ({
  time: `${i.toString().padStart(2, '0')}:00`,
  aqi: Math.round(30 + Math.sin(i / 4) * 25 + Math.random() * 20),
  pm25: parseFloat((8 + Math.sin(i / 4) * 12 + Math.random() * 8).toFixed(1)),
  pm10: parseFloat((15 + Math.sin(i / 4) * 22 + Math.random() * 12).toFixed(1)),
}))

const weeklyData = [
  { day: 'Mon', aqi: 52, pm25: 14.2 },
  { day: 'Tue', aqi: 78, pm25: 22.8 },
  { day: 'Wed', aqi: 115, pm25: 41.3 },
  { day: 'Thu', aqi: 89, pm25: 28.7 },
  { day: 'Fri', aqi: 61, pm25: 17.4 },
  { day: 'Sat', aqi: 44, pm25: 11.2 },
  { day: 'Sun', aqi: 38, pm25: 8.9 },
]

const predictionData = Array.from({ length: 24 }, (_, i) => ({
  time: `+${i}h`,
  predicted: Math.round(45 + Math.sin((i + 6) / 4) * 20 + Math.random() * 10),
  confidence: Math.max(50, 95 - i * 2),
}))

function getAQIColor(level: AQILevel): string {
  const colors: Record<AQILevel, string> = {
    'good': '#3DBE62', 'moderate': '#FFD700', 'sensitive': '#FFB340',
    'unhealthy': '#FF7A35', 'very-unhealthy': '#A855F7', 'hazardous': '#9B1C1C',
  }
  return colors[level]
}

function getAQILabel(level: AQILevel): string {
  const labels: Record<AQILevel, string> = {
    'good': 'Good', 'moderate': 'Moderate', 'sensitive': 'Sensitive Groups',
    'unhealthy': 'Unhealthy', 'very-unhealthy': 'Very Unhealthy', 'hazardous': 'Hazardous',
  }
  return labels[level]
}

function getAQISummary(level: AQILevel): string {
  const summaries: Record<AQILevel, string> = {
    'good': 'Air quality is excellent. No restrictions recommended for any group.',
    'moderate': 'Air quality is acceptable. Unusually sensitive people should limit prolonged outdoor exertion.',
    'sensitive': 'Sensitive groups should reduce prolonged outdoor activity. Others are fine.',
    'unhealthy': 'Everyone may begin to experience health effects. Sensitive groups should stay indoors.',
    'very-unhealthy': 'Health warnings issued. Avoid all outdoor exertion.',
    'hazardous': 'Health emergency. Everyone should remain indoors with windows closed.',
  }
  return summaries[level]
}

/* ============================================================================
   COMPONENT — BottomNav
   ============================================================================ */

interface BottomNavProps {
  active: string
  onNav: (screen: string) => void
}

const navTabs = [
  { id: 'home', label: 'Home', icon: NavHomeIcon },
  { id: 'map', label: 'Map', icon: NavMapIcon },
  { id: 'analytics', label: 'Analytics', icon: NavChartIcon },
  { id: 'alerts', label: 'Alerts', icon: NavBellIcon },
  { id: 'profile', label: 'Profile', icon: NavProfileIcon },
]

function NavHomeIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M3 12L12 3L21 12V20C21 20.55 20.55 21 20 21H15V16H9V21H4C3.45 21 3 20.55 3 20V12Z"
        stroke={active ? '#3DBE62' : '#6B7FA3'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
        fill={active ? 'rgba(61,190,98,0.12)' : 'none'} />
    </svg>
  )
}

function NavMapIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M12 2C8.13 2 5 5.13 5 9C5 14.25 12 22 12 22C12 22 19 14.25 19 9C19 5.13 15.87 2 12 2Z"
        stroke={active ? '#3DBE62' : '#6B7FA3'} strokeWidth="1.8" fill={active ? 'rgba(61,190,98,0.12)' : 'none'} />
      <circle cx="12" cy="9" r="2.5" stroke={active ? '#3DBE62' : '#6B7FA3'} strokeWidth="1.8" />
    </svg>
  )
}

function NavChartIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="12" width="4" height="9" rx="1" fill={active ? 'rgba(61,190,98,0.12)' : 'none'} stroke={active ? '#3DBE62' : '#6B7FA3'} strokeWidth="1.8" />
      <rect x="10" y="7" width="4" height="14" rx="1" fill={active ? 'rgba(61,190,98,0.12)' : 'none'} stroke={active ? '#3DBE62' : '#6B7FA3'} strokeWidth="1.8" />
      <rect x="17" y="3" width="4" height="18" rx="1" fill={active ? 'rgba(61,190,98,0.12)' : 'none'} stroke={active ? '#3DBE62' : '#6B7FA3'} strokeWidth="1.8" />
    </svg>
  )
}

function NavBellIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M18 8C18 6.4 17.4 4.9 16.2 3.8C15.1 2.6 13.6 2 12 2C10.4 2 8.9 2.6 7.8 3.8C6.6 4.9 6 6.4 6 8C6 15 3 17 3 17H21C21 17 18 15 18 8Z"
        stroke={active ? '#3DBE62' : '#6B7FA3'} strokeWidth="1.8" fill={active ? 'rgba(61,190,98,0.12)' : 'none'} />
      <path d="M13.73 21C13.55 21.3 13.3 21.55 13 21.73C12.7 21.9 12.36 22 12 22C11.64 22 11.3 21.9 11 21.73C10.7 21.55 10.45 21.3 10.27 21"
        stroke={active ? '#3DBE62' : '#6B7FA3'} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

function NavProfileIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="8" r="4" stroke={active ? '#3DBE62' : '#6B7FA3'} strokeWidth="1.8" fill={active ? 'rgba(61,190,98,0.12)' : 'none'} />
      <path d="M4 20C4 17.8 7.6 16 12 16C16.4 16 20 17.8 20 20"
        stroke={active ? '#3DBE62' : '#6B7FA3'} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

function BottomNav({ active, onNav }: BottomNavProps) {
  return (
    <div style={{ background: 'rgba(6,14,30,0.96)', backdropFilter: 'blur(20px)', borderTop: '1px solid rgba(255,255,255,0.07)' }}
      className="flex items-center justify-around px-2 pt-3 pb-6 safe-bottom">
      {navTabs.map(({ id, label, icon: Icon }) => (
        <button key={id} onClick={() => onNav(id)}
          className="flex flex-col items-center gap-1 min-w-[52px] relative"
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px' }}>
          <Icon active={active === id} />
          <span style={{
            fontSize: '10px',
            fontWeight: active === id ? 600 : 400,
            color: active === id ? '#3DBE62' : '#6B7FA3',
            letterSpacing: '0.03em',
            fontFamily: 'Inter, sans-serif',
          }}>
            {label}
          </span>
          {active === id && (
            <span style={{
              position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)',
              width: 20, height: 2, background: '#3DBE62', borderRadius: 1,
            }} />
          )}
        </button>
      ))}
    </div>
  )
}

/* ============================================================================
   SCREEN — SplashScreen
   ============================================================================ */

function SplashScreen({ onDone }: { onDone: () => void }) {
  const [phase, setPhase] = useState(0)

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 300)
    const t2 = setTimeout(() => setPhase(2), 900)
    const t3 = setTimeout(() => setPhase(3), 1600)
    const t4 = setTimeout(() => onDone(), 3000)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4) }
  }, [onDone])

  return (
    <div style={{
      width: '100%', height: '100%',
      background: 'radial-gradient(ellipse at 50% 30%, #0D2B18 0%, #060E1E 60%, #030812 100%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      position: 'relative', overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', width: 320, height: 320, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(61,190,98,0.12) 0%, transparent 70%)',
        top: '50%', left: '50%', transform: 'translate(-50%, -55%)',
        transition: 'opacity 0.8s ease', opacity: phase >= 1 ? 1 : 0,
      }} />

      <div style={{
        position: 'absolute', width: 220, height: 220, borderRadius: '50%',
        border: '1px solid rgba(61,190,98,0.18)', top: '50%', left: '50%',
        transform: 'translate(-50%, -60%)', opacity: phase >= 1 ? 1 : 0, transition: 'opacity 0.6s ease',
      }} className="animate-spin-slow" />

      <div style={{
        transition: 'all 0.7s cubic-bezier(0.34, 1.56, 0.64, 1)',
        opacity: phase >= 1 ? 1 : 0,
        transform: phase >= 1 ? 'scale(1) translateY(0)' : 'scale(0.6) translateY(20px)',
        marginBottom: 28,
      }}>
        <svg width="80" height="88" viewBox="0 0 80 88" fill="none">
          <path d="M40 2L76 22V66L40 86L4 66V22L40 2Z"
            stroke="rgba(61,190,98,0.3)" strokeWidth="1.5" fill="rgba(61,190,98,0.06)" />
          <path d="M40 12L68 27V58L40 73L12 58V27L40 12Z"
            stroke="rgba(61,190,98,0.5)" strokeWidth="1" fill="rgba(61,190,98,0.08)" />
          <path d="M20 44 Q26 36 32 44 Q38 52 44 44 Q50 36 56 44 Q62 52 68 44"
            stroke="#3DBE62" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <circle cx="26" cy="30" r="3" fill="#56B8FF" opacity="0.8" />
          <circle cx="54" cy="30" r="3" fill="#56B8FF" opacity="0.8" />
          <circle cx="40" cy="60" r="3" fill="#3DBE62" opacity="0.9" />
          <rect x="33" y="22" width="14" height="10" rx="2" stroke="#56B8FF" strokeWidth="1.5" fill="none" opacity="0.7" />
          <circle cx="40" cy="27" r="2.5" stroke="#56B8FF" strokeWidth="1.2" fill="none" opacity="0.7" />
        </svg>
      </div>

      <div style={{
        transition: 'all 0.6s ease', opacity: phase >= 2 ? 1 : 0,
        transform: phase >= 2 ? 'translateY(0)' : 'translateY(12px)',
        textAlign: 'center', marginBottom: 12,
      }}>
        <div style={{
          fontSize: 36, fontWeight: 800, letterSpacing: '-0.03em', fontFamily: 'Inter, sans-serif',
          background: 'linear-gradient(135deg, #F0F4FF 0%, #A8C4FF 100%)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', lineHeight: 1, marginBottom: 4,
        }}>TynysAlu</div>
        <div style={{
          fontSize: 11, fontWeight: 500, letterSpacing: '0.22em', color: '#3DBE62',
          textTransform: 'uppercase', fontFamily: 'DM Mono, monospace',
        }}>People's Air Network</div>
      </div>

      <div style={{
        transition: 'all 0.6s ease 0.15s', opacity: phase >= 3 ? 1 : 0,
        transform: phase >= 3 ? 'translateY(0)' : 'translateY(8px)', textAlign: 'center', marginTop: 8,
      }}>
        <div style={{
          fontSize: 14, fontWeight: 400, color: '#6B7FA3', fontFamily: 'Inter, sans-serif',
          letterSpacing: '0.02em', fontStyle: 'italic',
        }}>"Know the air before you breathe."</div>
      </div>

      <div style={{
        position: 'absolute', bottom: 80, left: '50%', transform: 'translateX(-50%)',
        width: 120, height: 2, background: 'rgba(255,255,255,0.07)', borderRadius: 1, overflow: 'hidden',
        opacity: phase >= 2 ? 1 : 0, transition: 'opacity 0.4s ease',
      }}>
        <div style={{
          height: '100%', background: 'linear-gradient(90deg, #3DBE62, #56B8FF)', borderRadius: 1,
          transition: 'width 1.8s ease', width: phase >= 3 ? '100%' : phase >= 2 ? '40%' : '0%',
        }} />
      </div>

      <div style={{
        position: 'absolute', bottom: 40, display: 'flex', alignItems: 'center', gap: 6,
        opacity: phase >= 3 ? 0.5 : 0, transition: 'opacity 0.4s ease',
      }}>
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#3DBE62' }} className="animate-glow-pulse" />
        <span style={{ fontSize: 10, fontFamily: 'DM Mono, monospace', color: '#6B7FA3', letterSpacing: '0.1em' }}>
          47 STATIONS ONLINE
        </span>
      </div>
    </div>
  )
}

/* ============================================================================
   SCREEN — HomeScreen
   ============================================================================ */

interface HomeScreenProps {
  onNav: (screen: string) => void
  onStation: (id: string) => void
}

const nearbyStation = stations[0]

function MetricCard({ label, value, unit, color, icon }: {
  label: string; value: string | number; unit: string; color?: string; icon: string
}) {
  return (
    <div style={{
      background: 'rgba(17,30,53,0.7)', border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 12, padding: '12px 14px', flex: 1, minWidth: 0,
    }}>
      <div style={{ fontSize: 10, color: '#6B7FA3', fontFamily: 'DM Mono, monospace', letterSpacing: '0.08em', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
        <span>{icon}</span> {label}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 3 }}>
        <span style={{ fontSize: 22, fontWeight: 700, color: color || '#F0F4FF', fontFamily: 'Inter, sans-serif', letterSpacing: '-0.02em' }}>{value}</span>
        <span style={{ fontSize: 10, color: '#6B7FA3', fontFamily: 'DM Mono, monospace' }}>{unit}</span>
      </div>
    </div>
  )
}

function AQIGauge({ value, level }: { value: number; level: string }) {
  const color = getAQIColor(level as AQILevel)
  const pct = Math.min(value / 500, 1)
  const r = 72
  const cx = 90
  const cy = 90

  const arcPath = (startAngle: number, endAngle: number, radius: number) => {
    const toRad = (d: number) => (d - 90) * (Math.PI / 180)
    const x1 = cx + radius * Math.cos(toRad(startAngle))
    const y1 = cy + radius * Math.sin(toRad(startAngle))
    const x2 = cx + radius * Math.cos(toRad(endAngle))
    const y2 = cy + radius * Math.sin(toRad(endAngle))
    const large = Math.abs(endAngle - startAngle) > 180 ? 1 : 0
    return `M ${x1} ${y1} A ${radius} ${radius} 0 ${large} 1 ${x2} ${y2}`
  }

  const needleAngle = (pct * 180 - 90) * (Math.PI / 180)
  const nx = cx + 58 * Math.cos(needleAngle - Math.PI / 2)
  const ny = cy + 58 * Math.sin(needleAngle - Math.PI / 2)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      <svg width="180" height="100" viewBox="0 0 180 100">
        <path d={arcPath(-90, 90, r)} stroke="rgba(255,255,255,0.07)" strokeWidth="10" fill="none" strokeLinecap="round" />
        <path d={arcPath(-90, -54, r)} stroke="#3DBE62" strokeWidth="10" fill="none" strokeLinecap="round" opacity="0.9" />
        <path d={arcPath(-54, -18, r)} stroke="#FFD700" strokeWidth="10" fill="none" opacity="0.9" />
        <path d={arcPath(-18, 18, r)} stroke="#FFB340" strokeWidth="10" fill="none" opacity="0.9" />
        <path d={arcPath(18, 54, r)} stroke="#FF7A35" strokeWidth="10" fill="none" opacity="0.9" />
        <path d={arcPath(54, 72, r)} stroke="#A855F7" strokeWidth="10" fill="none" opacity="0.9" />
        <path d={arcPath(72, 90, r)} stroke="#9B1C1C" strokeWidth="10" fill="none" strokeLinecap="round" opacity="0.9" />
        <path d={arcPath(-90, -90 + pct * 180, r)} stroke={color} strokeWidth="12" fill="none" strokeLinecap="round" opacity="0.25" />
        <line x1={cx} y1={cy} x2={nx} y2={ny} stroke={color} strokeWidth="2.5" strokeLinecap="round" />
        <circle cx={cx} cy={cy} r="5" fill={color} />
        <circle cx={cx} cy={cy} r="3" fill="#060E1E" />
      </svg>
      <div style={{ marginTop: -8, textAlign: 'center' }}>
        <div style={{ fontSize: 52, fontWeight: 800, color, fontFamily: 'Inter, sans-serif', letterSpacing: '-0.04em', lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: 11, fontWeight: 600, color, fontFamily: 'DM Mono, monospace', letterSpacing: '0.12em', marginTop: 4, textTransform: 'uppercase' }}>
          {getAQILabel(level as AQILevel)}
        </div>
      </div>
    </div>
  )
}

function HomeScreen({ onNav, onStation }: HomeScreenProps) {
  const s = nearbyStation
  const now = new Date()
  const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <div style={{ padding: '16px 20px 12px', background: 'rgba(6,14,30,0.8)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 10, fontFamily: 'DM Mono, monospace', color: '#6B7FA3', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 2 }}>TynysAlu</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#F0F4FF', fontFamily: 'Inter, sans-serif', letterSpacing: '-0.02em' }}>Air Quality Monitor</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(61,190,98,0.1)', border: '1px solid rgba(61,190,98,0.2)', borderRadius: 20, padding: '4px 10px' }}>
              <div className="online-dot" />
              <span style={{ fontSize: 10, fontFamily: 'DM Mono, monospace', color: '#3DBE62', letterSpacing: '0.06em' }}>LIVE</span>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 8 }}>
          <svg width="11" height="14" viewBox="0 0 12 16" fill="none">
            <path d="M6 0C3.24 0 1 2.24 1 5C1 8.75 6 14 6 14C6 14 11 8.75 11 5C11 2.24 8.76 0 6 0ZM6 6.5C5.17 6.5 4.5 5.83 4.5 5C4.5 4.17 5.17 3.5 6 3.5C6.83 3.5 7.5 4.17 7.5 5C7.5 5.83 6.83 6.5 6 6.5Z" fill="#56B8FF" />
          </svg>
          <span style={{ fontSize: 12, color: '#56B8FF', fontFamily: 'Inter, sans-serif' }}>Almaty, Kazakhstan</span>
          <span style={{ fontSize: 11, color: '#6B7FA3', fontFamily: 'DM Mono, monospace', marginLeft: 'auto' }}>Updated {timeStr}</span>
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '0 16px 16px' }}>
        <div style={{
          background: 'linear-gradient(135deg, #0D2820 0%, #0A1E30 50%, #0D1828 100%)',
          border: `1px solid rgba(${s.level === 'good' ? '61,190,98' : s.level === 'moderate' ? '255,215,0' : '255,122,53'},0.25)`,
          borderRadius: 20, padding: '20px 20px 16px', marginTop: 16,
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 16, background: 'rgba(0,0,0,0.2)', borderRadius: 10, padding: '10px 12px' }}>
            <div style={{
              width: 24, height: 24, borderRadius: '50%', background: 'linear-gradient(135deg, #3DBE62, #56B8FF)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <span style={{ fontSize: 11 }}>🤖</span>
            </div>
            <div>
              <div style={{ fontSize: 10, fontFamily: 'DM Mono, monospace', color: '#3DBE62', letterSpacing: '0.08em', marginBottom: 3 }}>AI ANALYSIS</div>
              <div style={{ fontSize: 13, color: '#C8D8F0', fontFamily: 'Inter, sans-serif', lineHeight: 1.5 }}>{getAQISummary(s.level)}</div>
            </div>
          </div>

          <AQIGauge value={s.aqi} level={s.level} />

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, padding: '0 4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                <path d="M8 1L10 6H15L11 9.5L12.5 15L8 11.5L3.5 15L5 9.5L1 6H6L8 1Z" fill="#56B8FF" opacity="0.8" />
              </svg>
              <span style={{ fontSize: 11, fontFamily: 'DM Mono, monospace', color: '#56B8FF' }}>AI Confidence {s.confidence}%</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#3DBE62' }} className="animate-glow-pulse" />
              <span style={{ fontSize: 10, fontFamily: 'DM Mono, monospace', color: '#6B7FA3' }}>
                📷 Camera · 🔬 Sensor
              </span>
            </div>
          </div>
        </div>

        <div style={{ marginTop: 14 }}>
          <div style={{ fontSize: 11, fontFamily: 'DM Mono, monospace', color: '#6B7FA3', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>Pollutants & Conditions</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            <MetricCard label="PM2.5" value={s.pm25} unit="μg/m³" color={s.pm25 > 35 ? '#FF7A35' : s.pm25 > 12 ? '#FFD700' : '#3DBE62'} icon="🌫" />
            <MetricCard label="PM10" value={s.pm10} unit="μg/m³" color={s.pm10 > 50 ? '#FF7A35' : s.pm10 > 20 ? '#FFD700' : '#3DBE62'} icon="💨" />
            <MetricCard label="AQI" value={s.aqi} unit="US" color={getAQIColor(s.level)} icon="📊" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginTop: 8 }}>
            <MetricCard label="Temp" value={s.temp} unit="°C" icon="🌡" />
            <MetricCard label="Humidity" value={s.humidity} unit="%" icon="💧" />
            <MetricCard label="Wind" value={s.windSpeed} unit="m/s" icon="🌬" />
          </div>
        </div>

        <div style={{ marginTop: 14 }}>
          <div style={{ fontSize: 11, fontFamily: 'DM Mono, monospace', color: '#6B7FA3', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>Nearest Station</div>
          <button onClick={() => onStation(s.id)} style={{
            width: '100%', background: 'rgba(17,30,53,0.8)', border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 14, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 14,
            cursor: 'pointer', textAlign: 'left',
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: '50%',
              background: `radial-gradient(circle, ${getAQIColor(s.level)}33 0%, ${getAQIColor(s.level)}11 70%)`,
              border: `2px solid ${getAQIColor(s.level)}66`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <span style={{ fontSize: 18, fontWeight: 800, color: getAQIColor(s.level), fontFamily: 'Inter, sans-serif' }}>{s.aqi}</span>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#F0F4FF', fontFamily: 'Inter, sans-serif' }}>{s.name}</div>
              <div style={{ fontSize: 11, color: '#6B7FA3', fontFamily: 'DM Mono, monospace', marginTop: 2 }}>{s.id} · {s.district} · {s.lastSync}</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ fontSize: 9, fontFamily: 'DM Mono, monospace', color: '#3DBE62' }}>📷</span>
                <span style={{ fontSize: 9, fontFamily: 'DM Mono, monospace', color: s.cameraOnline ? '#3DBE62' : '#FF4D4D' }}>CAM</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ fontSize: 9, fontFamily: 'DM Mono, monospace', color: '#56B8FF' }}>🔬</span>
                <span style={{ fontSize: 9, fontFamily: 'DM Mono, monospace', color: '#56B8FF' }}>SENSOR</span>
              </div>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M9 18L15 12L9 6" stroke="#6B7FA3" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
          </button>
        </div>

        <div style={{ marginTop: 14 }}>
          <div style={{ fontSize: 11, fontFamily: 'DM Mono, monospace', color: '#6B7FA3', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>Quick Actions</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[
              { label: 'Safe Route', icon: '🛤', desc: 'Plan your commute', screen: 'route', gradient: 'linear-gradient(135deg, #0D2820, #0A2040)' },
              { label: 'AI Insights', icon: '🧠', desc: 'Environmental analysis', screen: 'insights', gradient: 'linear-gradient(135deg, #1a0d28, #0D1828)' },
              { label: 'Forecast', icon: '📈', desc: 'Next 24 hours', screen: 'analytics', gradient: 'linear-gradient(135deg, #0A1E30, #0A1828)' },
              { label: 'All Stations', icon: '📡', desc: '47 devices online', screen: 'stations', gradient: 'linear-gradient(135deg, #1a2008, #0D1828)' },
            ].map(({ label, icon, desc, screen, gradient }) => (
              <button key={label} onClick={() => onNav(screen)} style={{
                background: gradient, border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14,
                padding: '14px', display: 'flex', flexDirection: 'column', gap: 8, cursor: 'pointer', textAlign: 'left',
              }}>
                <span style={{ fontSize: 22 }}>{icon}</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#F0F4FF', fontFamily: 'Inter, sans-serif' }}>{label}</div>
                  <div style={{ fontSize: 11, color: '#6B7FA3', fontFamily: 'Inter, sans-serif', marginTop: 2 }}>{desc}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

/* ============================================================================
   SCREEN — MapScreen
   ============================================================================ */

function MapScreen({ onStation }: { onStation: (id: string) => void }) {
  const [selected, setSelected] = useState<Station | null>(null)
  const [filter, setFilter] = useState<'all' | 'online' | 'camera'>('all')

  const filtered = stations.filter(s => {
    if (filter === 'online') return s.online
    if (filter === 'camera') return s.cameraOnline
    return true
  })

  const handleMarkerClick = (s: Station) => {
    setSelected(s === selected ? null : s)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <div style={{ padding: '16px 20px 12px', background: 'rgba(6,14,30,0.9)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(255,255,255,0.05)', zIndex: 10 }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: '#F0F4FF', fontFamily: 'Inter, sans-serif', letterSpacing: '-0.02em', marginBottom: 10 }}>Pollution Map</div>
        <div style={{ display: 'flex', gap: 6 }}>
          {(['all', 'online', 'camera'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: '5px 12px', borderRadius: 20,
              border: `1px solid ${filter === f ? '#3DBE62' : 'rgba(255,255,255,0.1)'}`,
              background: filter === f ? 'rgba(61,190,98,0.12)' : 'transparent',
              color: filter === f ? '#3DBE62' : '#6B7FA3', fontSize: 11, fontFamily: 'DM Mono, monospace',
              letterSpacing: '0.06em', cursor: 'pointer', textTransform: 'uppercase',
            }}>
              {f === 'all' ? 'All' : f === 'online' ? 'Online' : 'Camera'}
            </button>
          ))}
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4 }}>
            <div className="online-dot" />
            <span style={{ fontSize: 10, fontFamily: 'DM Mono, monospace', color: '#3DBE62' }}>{stations.filter(s => s.online).length} online</span>
          </div>
        </div>
      </div>

      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, #081428 0%, #060E1E 100%)' }}>
          <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0, opacity: 0.25 }}>
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(86,184,255,0.3)" strokeWidth="0.5" />
              </pattern>
              <pattern id="bigGrid" width="120" height="120" patternUnits="userSpaceOnUse">
                <rect width="120" height="120" fill="url(#grid)" />
                <path d="M 120 0 L 0 0 0 120" fill="none" stroke="rgba(86,184,255,0.5)" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#bigGrid)" />
          </svg>

          <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0, opacity: 0.12 }}>
            <rect x="0" y="35%" width="100%" height="2" fill="#56B8FF" />
            <rect x="0" y="55%" width="100%" height="2" fill="#56B8FF" />
            <rect x="0" y="72%" width="100%" height="1.5" fill="#56B8FF" />
            <rect x="30%" y="0" width="2" height="100%" fill="#56B8FF" />
            <rect x="52%" y="0" width="2" height="100%" fill="#56B8FF" />
            <rect x="72%" y="0" width="1.5" height="100%" fill="#56B8FF" />
          </svg>

          {filtered.map(s => (
            <div key={s.id} style={{
              position: 'absolute', left: `${s.x}%`, top: `${s.y}%`, transform: 'translate(-50%, -50%)',
              width: s.aqi > 100 ? 90 : s.aqi > 50 ? 70 : 50,
              height: s.aqi > 100 ? 90 : s.aqi > 50 ? 70 : 50,
              borderRadius: '50%',
              background: `radial-gradient(circle, ${getAQIColor(s.level)}44 0%, ${getAQIColor(s.level)}11 60%, transparent 100%)`,
              pointerEvents: 'none',
            }} />
          ))}

          {filtered.map(s => (
            <button key={s.id} onClick={() => handleMarkerClick(s)} style={{
              position: 'absolute', left: `${s.x}%`, top: `${s.y}%`, transform: 'translate(-50%, -50%)',
              background: 'none', border: 'none', cursor: 'pointer', padding: 0,
              zIndex: selected?.id === s.id ? 20 : 10,
            }}>
              <div className="map-marker" style={{ position: 'relative' }}>
                <div style={{
                  position: 'absolute', inset: -8, borderRadius: '50%',
                  border: `1.5px solid ${getAQIColor(s.level)}55`, animation: 'pulse-marker 2s ease-in-out infinite',
                }} />
                <div style={{
                  width: 36, height: 36, borderRadius: '50%',
                  background: s.online
                    ? `radial-gradient(circle at 40% 35%, ${getAQIColor(s.level)}, ${getAQIColor(s.level)}99)`
                    : '#3a4a5a',
                  border: `2px solid ${s.online ? getAQIColor(s.level) : '#4a5a6a'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: s.online
                    ? `0 0 16px ${getAQIColor(s.level)}60, 0 4px 12px rgba(0,0,0,0.4)`
                    : '0 2px 8px rgba(0,0,0,0.4)',
                  transform: selected?.id === s.id ? 'scale(1.2)' : 'scale(1)', transition: 'transform 0.2s ease',
                }}>
                  <span style={{ fontSize: 11, fontWeight: 800, color: s.online ? '#fff' : '#6B7FA3', fontFamily: 'Inter, sans-serif' }}>
                    {s.online ? s.aqi : '—'}
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>

        {selected && (
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            background: 'linear-gradient(180deg, rgba(6,14,30,0) 0%, rgba(6,14,30,0.97) 15%)',
            padding: '60px 16px 16px', animation: 'fade-up 0.25s ease',
          }}>
            <div style={{
              background: 'rgba(13,24,40,0.95)', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 18, padding: '16px', backdropFilter: 'blur(20px)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#F0F4FF', fontFamily: 'Inter, sans-serif' }}>{selected.name}</div>
                  <div style={{ fontSize: 11, color: '#6B7FA3', fontFamily: 'DM Mono, monospace', marginTop: 2 }}>{selected.id} · {selected.district}</div>
                </div>
                <button onClick={() => setSelected(null)} style={{ background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: 20, padding: '4px 8px', color: '#6B7FA3', cursor: 'pointer', fontSize: 12 }}>✕</button>
              </div>

              <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: selected.online ? 'rgba(61,190,98,0.12)' : 'rgba(255,77,77,0.12)', borderRadius: 20, padding: '3px 8px' }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: selected.online ? '#3DBE62' : '#FF4D4D' }} />
                  <span style={{ fontSize: 10, fontFamily: 'DM Mono, monospace', color: selected.online ? '#3DBE62' : '#FF4D4D' }}>{selected.online ? 'ONLINE' : 'OFFLINE'}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(86,184,255,0.1)', borderRadius: 20, padding: '3px 8px' }}>
                  <span style={{ fontSize: 10, fontFamily: 'DM Mono, monospace', color: selected.cameraOnline ? '#56B8FF' : '#6B7FA3' }}>📷 CAM {selected.cameraOnline ? 'ON' : 'OFF'}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(86,184,255,0.1)', borderRadius: 20, padding: '3px 8px' }}>
                  <span style={{ fontSize: 10, fontFamily: 'DM Mono, monospace', color: '#56B8FF' }}>🔬 SENSOR</span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 14 }}>
                {[
                  { label: 'AQI', value: selected.aqi, color: getAQIColor(selected.level) },
                  { label: 'PM2.5', value: `${selected.pm25}` },
                  { label: 'PM10', value: `${selected.pm10}` },
                  { label: 'Signal', value: `${selected.signal}%` },
                ].map(m => (
                  <div key={m.label} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '8px 10px', textAlign: 'center' }}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: (m as any).color || '#F0F4FF', fontFamily: 'Inter, sans-serif' }}>{m.value}</div>
                    <div style={{ fontSize: 9, color: '#6B7FA3', fontFamily: 'DM Mono, monospace', marginTop: 2 }}>{m.label}</div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <div style={{ flex: 1, background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '8px 12px' }}>
                  <div style={{ fontSize: 10, color: '#6B7FA3', fontFamily: 'DM Mono, monospace' }}>LAST SYNC</div>
                  <div style={{ fontSize: 12, color: '#F0F4FF', fontFamily: 'Inter, sans-serif', marginTop: 2 }}>{selected.lastSync}</div>
                </div>
                <div style={{ flex: 1, background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '8px 12px' }}>
                  <div style={{ fontSize: 10, color: '#6B7FA3', fontFamily: 'DM Mono, monospace' }}>AI CONFIDENCE</div>
                  <div style={{ fontSize: 12, color: '#56B8FF', fontFamily: 'Inter, sans-serif', marginTop: 2 }}>{selected.confidence}%</div>
                </div>
                <button onClick={() => onStation(selected.id)} style={{
                  background: 'rgba(61,190,98,0.15)', border: '1px solid rgba(61,190,98,0.3)', borderRadius: 10,
                  padding: '8px 14px', color: '#3DBE62', fontSize: 11, fontFamily: 'DM Mono, monospace',
                  cursor: 'pointer', letterSpacing: '0.06em',
                }}>DETAILS →</button>
              </div>
            </div>
          </div>
        )}

        {!selected && (
          <div style={{
            position: 'absolute', bottom: 16, left: 16, background: 'rgba(13,24,40,0.9)',
            border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '10px 14px', backdropFilter: 'blur(10px)',
          }}>
            <div style={{ fontSize: 9, fontFamily: 'DM Mono, monospace', color: '#6B7FA3', marginBottom: 8, letterSpacing: '0.1em' }}>AQI SCALE</div>
            {[
              { label: 'Good', color: '#3DBE62', range: '0–50' },
              { label: 'Moderate', color: '#FFD700', range: '51–100' },
              { label: 'Sensitive', color: '#FFB340', range: '101–150' },
              { label: 'Unhealthy', color: '#FF7A35', range: '151–200' },
            ].map(l => (
              <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: l.color }} />
                <span style={{ fontSize: 10, color: '#A8B8C8', fontFamily: 'Inter, sans-serif' }}>{l.label}</span>
                <span style={{ fontSize: 9, color: '#6B7FA3', fontFamily: 'DM Mono, monospace', marginLeft: 2 }}>{l.range}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

/* ============================================================================
   SCREEN — AnalyticsScreen
   ============================================================================ */

type AnalyticsTab = '24h' | '7d' | 'forecast'

const AnalyticsCustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: 'rgba(13,24,40,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '8px 12px', fontSize: 11, fontFamily: 'DM Mono, monospace' }}>
      <div style={{ color: '#6B7FA3', marginBottom: 4 }}>{label}</div>
      {payload.map((p: any) => (
        <div key={p.name} style={{ color: p.color, marginBottom: 2 }}>
          {p.name.toUpperCase()}: <span style={{ color: '#F0F4FF' }}>{p.value}</span>
        </div>
      ))}
    </div>
  )
}

function StatCard({ label, value, unit, delta, color }: { label: string; value: string | number; unit?: string; delta?: string; color?: string }) {
  return (
    <div style={{ background: 'rgba(17,30,53,0.7)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '12px 14px', flex: 1 }}>
      <div style={{ fontSize: 10, color: '#6B7FA3', fontFamily: 'DM Mono, monospace', letterSpacing: '0.08em', marginBottom: 6 }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 3 }}>
        <span style={{ fontSize: 20, fontWeight: 700, color: color || '#F0F4FF', fontFamily: 'Inter, sans-serif', letterSpacing: '-0.02em' }}>{value}</span>
        {unit && <span style={{ fontSize: 9, color: '#6B7FA3', fontFamily: 'DM Mono, monospace' }}>{unit}</span>}
      </div>
      {delta && <div style={{ fontSize: 10, color: delta.startsWith('+') ? '#FF7A35' : '#3DBE62', fontFamily: 'DM Mono, monospace', marginTop: 4 }}>{delta} vs yesterday</div>}
    </div>
  )
}

function AnalyticsScreen() {
  const [tab, setTab] = useState<AnalyticsTab>('24h')

  const currentHour = new Date().getHours()
  const nowIndex = hourlyData.findIndex(d => d.time === `${currentHour.toString().padStart(2, '0')}:00`)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <div style={{ padding: '16px 20px 12px', background: 'rgba(6,14,30,0.9)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: '#F0F4FF', fontFamily: 'Inter, sans-serif', letterSpacing: '-0.02em', marginBottom: 12 }}>Analytics</div>
        <div style={{ display: 'flex', gap: 4, background: 'rgba(17,30,53,0.6)', borderRadius: 12, padding: 4 }}>
          {([['24h', '24 Hours'], ['7d', '7 Days'], ['forecast', 'Forecast']] as [AnalyticsTab, string][]).map(([id, label]) => (
            <button key={id} onClick={() => setTab(id)} style={{
              flex: 1, padding: '7px 4px', borderRadius: 9, border: 'none', cursor: 'pointer',
              background: tab === id ? 'rgba(61,190,98,0.15)' : 'transparent',
              color: tab === id ? '#3DBE62' : '#6B7FA3',
              fontSize: 12, fontWeight: tab === id ? 600 : 400, fontFamily: 'Inter, sans-serif',
              transition: 'all 0.15s ease',
            }}>{label}</button>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '14px 16px 16px' }} className="scroll-visible">
        {tab === '24h' && (
          <>
            <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
              <StatCard label="AVG AQI" value={52} delta="-8" color="#FFD700" />
              <StatCard label="PEAK AQI" value={118} unit="@14:00" delta="+22" color="#FF7A35" />
              <StatCard label="AVG PM2.5" value={14.2} unit="μg/m³" delta="-3.1" color="#56B8FF" />
            </div>

            <div style={{ background: 'rgba(17,30,53,0.7)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '14px 0 8px', marginBottom: 12 }}>
              <div style={{ padding: '0 14px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#F0F4FF', fontFamily: 'Inter, sans-serif' }}>AQI — 24 Hours</span>
                <span style={{ fontSize: 10, fontFamily: 'DM Mono, monospace', color: '#6B7FA3' }}>Almaty Central ST-001</span>
              </div>
              <ResponsiveContainer width="100%" height={140}>
                <AreaChart data={hourlyData} margin={{ left: -20, right: 10 }}>
                  <defs>
                    <linearGradient id="aqiGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3DBE62" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3DBE62" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="rgba(255,255,255,0.04)" strokeDasharray="3 3" />
                  <XAxis dataKey="time" tick={{ fill: '#6B7FA3', fontSize: 9, fontFamily: 'DM Mono, monospace' }} interval={5} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fill: '#6B7FA3', fontSize: 9, fontFamily: 'DM Mono, monospace' }} tickLine={false} axisLine={false} />
                  <Tooltip content={<AnalyticsCustomTooltip />} />
                  <ReferenceLine y={100} stroke="rgba(255,179,64,0.4)" strokeDasharray="3 3" />
                  <ReferenceLine y={50} stroke="rgba(61,190,98,0.3)" strokeDasharray="3 3" />
                  {nowIndex >= 0 && <ReferenceLine x={hourlyData[nowIndex]?.time} stroke="rgba(86,184,255,0.5)" strokeDasharray="2 2" />}
                  <Area type="monotone" dataKey="aqi" stroke="#3DBE62" strokeWidth={2} fill="url(#aqiGrad)" name="aqi" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div style={{ background: 'rgba(17,30,53,0.7)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '14px 0 8px', marginBottom: 12 }}>
              <div style={{ padding: '0 14px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#F0F4FF', fontFamily: 'Inter, sans-serif' }}>Particulates</span>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}><div style={{ width: 8, height: 2, background: '#56B8FF', borderRadius: 1 }} /><span style={{ fontSize: 9, fontFamily: 'DM Mono, monospace', color: '#6B7FA3' }}>PM2.5</span></div>
                  <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}><div style={{ width: 8, height: 2, background: '#FFB340', borderRadius: 1 }} /><span style={{ fontSize: 9, fontFamily: 'DM Mono, monospace', color: '#6B7FA3' }}>PM10</span></div>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={130}>
                <LineChart data={hourlyData} margin={{ left: -20, right: 10 }}>
                  <defs>
                    <linearGradient id="pm25Grad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#56B8FF" stopOpacity={0.2} />
                      <stop offset="100%" stopColor="#56B8FF" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="rgba(255,255,255,0.04)" strokeDasharray="3 3" />
                  <XAxis dataKey="time" tick={{ fill: '#6B7FA3', fontSize: 9, fontFamily: 'DM Mono, monospace' }} interval={5} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fill: '#6B7FA3', fontSize: 9, fontFamily: 'DM Mono, monospace' }} tickLine={false} axisLine={false} />
                  <Tooltip content={<AnalyticsCustomTooltip />} />
                  <ReferenceLine y={35} stroke="rgba(255,122,53,0.3)" strokeDasharray="3 3" label={{ value: 'WHO', fill: '#FF7A35', fontSize: 8 }} />
                  <Line type="monotone" dataKey="pm25" stroke="#56B8FF" strokeWidth={2} dot={false} name="pm25" />
                  <Line type="monotone" dataKey="pm10" stroke="#FFB340" strokeWidth={1.5} dot={false} name="pm10" strokeDasharray="4 2" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div style={{ background: 'rgba(17,30,53,0.7)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '14px 14px' }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#F0F4FF', fontFamily: 'Inter, sans-serif', marginBottom: 10 }}>Detected Anomalies</div>
              {[
                { time: '08:20', event: 'Morning traffic peak — PM2.5 +42%', severity: 'medium' },
                { time: '13:45', event: 'Industrial emission detected at ST-004', severity: 'high' },
                { time: '17:10', event: 'Dust event — PM10 above WHO threshold', severity: 'medium' },
              ].map(a => (
                <div key={a.time} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 10 }}>
                  <div style={{ fontSize: 9, fontFamily: 'DM Mono, monospace', color: '#6B7FA3', width: 36, flexShrink: 0, paddingTop: 2 }}>{a.time}</div>
                  <div style={{ flex: 1, fontSize: 12, color: '#C8D8F0', fontFamily: 'Inter, sans-serif', lineHeight: 1.5 }}>{a.event}</div>
                  <div style={{
                    fontSize: 8, fontFamily: 'DM Mono, monospace', letterSpacing: '0.06em',
                    color: a.severity === 'high' ? '#FF7A35' : '#FFB340',
                    background: a.severity === 'high' ? 'rgba(255,122,53,0.12)' : 'rgba(255,179,64,0.12)',
                    border: `1px solid ${a.severity === 'high' ? 'rgba(255,122,53,0.3)' : 'rgba(255,179,64,0.3)'}`,
                    borderRadius: 20, padding: '2px 6px', flexShrink: 0, alignSelf: 'flex-start',
                  }}>{a.severity.toUpperCase()}</div>
                </div>
              ))}
            </div>
          </>
        )}

        {tab === '7d' && (
          <>
            <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
              <StatCard label="WEEKLY AVG" value={68} color="#FFD700" />
              <StatCard label="WORST DAY" value="Wed" delta="+55 AQI" color="#FF7A35" />
              <StatCard label="BEST DAY" value="Sun" delta="-30 AQI" color="#3DBE62" />
            </div>
            <div style={{ background: 'rgba(17,30,53,0.7)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '14px 0 8px', marginBottom: 12 }}>
              <div style={{ padding: '0 14px 10px' }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#F0F4FF', fontFamily: 'Inter, sans-serif' }}>AQI — Last 7 Days</span>
              </div>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={weeklyData} margin={{ left: -20, right: 10 }}>
                  <defs>
                    <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3DBE62" />
                      <stop offset="100%" stopColor="#1a7040" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="rgba(255,255,255,0.04)" strokeDasharray="3 3" />
                  <XAxis dataKey="day" tick={{ fill: '#6B7FA3', fontSize: 10, fontFamily: 'DM Mono, monospace' }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fill: '#6B7FA3', fontSize: 9, fontFamily: 'DM Mono, monospace' }} tickLine={false} axisLine={false} />
                  <Tooltip content={<AnalyticsCustomTooltip />} />
                  <ReferenceLine y={100} stroke="rgba(255,179,64,0.4)" strokeDasharray="3 3" />
                  <Bar dataKey="aqi" radius={[4, 4, 0, 0]} name="aqi" fillOpacity={0.85} fill="url(#barGrad)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ background: 'rgba(17,30,53,0.7)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '14px 0 8px' }}>
              <div style={{ padding: '0 14px 10px' }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#F0F4FF', fontFamily: 'Inter, sans-serif' }}>PM2.5 Trend</span>
              </div>
              <ResponsiveContainer width="100%" height={130}>
                <AreaChart data={weeklyData} margin={{ left: -20, right: 10 }}>
                  <defs>
                    <linearGradient id="pm7Grad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#56B8FF" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#56B8FF" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="rgba(255,255,255,0.04)" strokeDasharray="3 3" />
                  <XAxis dataKey="day" tick={{ fill: '#6B7FA3', fontSize: 10, fontFamily: 'DM Mono, monospace' }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fill: '#6B7FA3', fontSize: 9, fontFamily: 'DM Mono, monospace' }} tickLine={false} axisLine={false} />
                  <Tooltip content={<AnalyticsCustomTooltip />} />
                  <ReferenceLine y={35} stroke="rgba(255,122,53,0.3)" strokeDasharray="3 3" />
                  <Area type="monotone" dataKey="pm25" stroke="#56B8FF" strokeWidth={2} fill="url(#pm7Grad)" name="pm25" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </>
        )}

        {tab === 'forecast' && (
          <>
            <div style={{ background: 'linear-gradient(135deg, #0A1E30, #0D2820)', border: '1px solid rgba(86,184,255,0.15)', borderRadius: 14, padding: '14px', marginBottom: 14 }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <div style={{ fontSize: 28 }}>🔮</div>
                <div>
                  <div style={{ fontSize: 10, fontFamily: 'DM Mono, monospace', color: '#56B8FF', letterSpacing: '0.08em', marginBottom: 4 }}>AI PREDICTION MODEL · v3.2</div>
                  <p style={{ fontSize: 13, color: '#C8D8F0', fontFamily: 'Inter, sans-serif', lineHeight: 1.6, margin: 0 }}>
                    Air quality expected to remain moderate through 18:00. A south wind increase predicted at 18:00 may elevate PM10 in southern districts. Confidence decreases beyond 12 hours.
                  </p>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
              <StatCard label="NOW" value={42} color="#3DBE62" />
              <StatCard label="+6H" value={58} color="#FFD700" />
              <StatCard label="+12H" value={74} delta="+32" color="#FFB340" />
            </div>

            <div style={{ background: 'rgba(17,30,53,0.7)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '14px 0 8px', marginBottom: 12 }}>
              <div style={{ padding: '0 14px 10px', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#F0F4FF', fontFamily: 'Inter, sans-serif' }}>Predicted AQI — Next 24h</span>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}><div style={{ width: 8, height: 2, background: '#56B8FF', borderRadius: 1 }} /><span style={{ fontSize: 9, fontFamily: 'DM Mono, monospace', color: '#6B7FA3' }}>Predicted</span></div>
                  <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}><div style={{ width: 8, height: 2, background: '#6B7FA3', borderRadius: 1, borderStyle: 'dashed' }} /><span style={{ fontSize: 9, fontFamily: 'DM Mono, monospace', color: '#6B7FA3' }}>Conf%</span></div>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={150}>
                <AreaChart data={predictionData} margin={{ left: -20, right: 10 }}>
                  <defs>
                    <linearGradient id="predGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#56B8FF" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#56B8FF" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="rgba(255,255,255,0.04)" strokeDasharray="3 3" />
                  <XAxis dataKey="time" tick={{ fill: '#6B7FA3', fontSize: 9, fontFamily: 'DM Mono, monospace' }} interval={3} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fill: '#6B7FA3', fontSize: 9, fontFamily: 'DM Mono, monospace' }} tickLine={false} axisLine={false} />
                  <Tooltip content={<AnalyticsCustomTooltip />} />
                  <ReferenceLine y={100} stroke="rgba(255,179,64,0.3)" strokeDasharray="3 3" />
                  <Area type="monotone" dataKey="predicted" stroke="#56B8FF" strokeWidth={2} fill="url(#predGrad)" name="AQI" strokeDasharray="6 3" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div style={{ background: 'rgba(17,30,53,0.7)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '14px 14px' }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#F0F4FF', fontFamily: 'Inter, sans-serif', marginBottom: 12 }}>Forecast Confidence</div>
              {[
                { range: '0–6 hours', confidence: 95, note: 'High confidence — recent sensor calibration' },
                { range: '6–12 hours', confidence: 78, note: 'Moderate — weather model uncertainty increasing' },
                { range: '12–18 hours', confidence: 61, note: 'Low — wind shift unpredictability' },
                { range: '18–24 hours', confidence: 44, note: 'Speculative — use as directional only' },
              ].map(c => (
                <div key={c.range} style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 11, fontFamily: 'DM Mono, monospace', color: '#A8B8C8' }}>{c.range}</span>
                    <span style={{ fontSize: 11, fontWeight: 600, fontFamily: 'DM Mono, monospace', color: c.confidence > 80 ? '#3DBE62' : c.confidence > 60 ? '#FFD700' : '#FF7A35' }}>{c.confidence}%</span>
                  </div>
                  <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${c.confidence}%`, borderRadius: 2, background: c.confidence > 80 ? '#3DBE62' : c.confidence > 60 ? '#FFD700' : '#FF7A35', transition: 'width 0.8s ease' }} />
                  </div>
                  <div style={{ fontSize: 10, color: '#6B7FA3', fontFamily: 'Inter, sans-serif', marginTop: 3 }}>{c.note}</div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

/* ============================================================================
   SCREEN — AlertsScreen
   ============================================================================ */

const alertLevelConfig = {
  critical: { color: '#FF4D4D', bg: 'rgba(255,77,77,0.1)', border: 'rgba(255,77,77,0.25)', icon: '🚨', label: 'CRITICAL' },
  high: { color: '#FF7A35', bg: 'rgba(255,122,53,0.1)', border: 'rgba(255,122,53,0.25)', icon: '⚠️', label: 'HIGH' },
  medium: { color: '#FFB340', bg: 'rgba(255,179,64,0.1)', border: 'rgba(255,179,64,0.25)', icon: '⚡', label: 'MEDIUM' },
  low: { color: '#3DBE62', bg: 'rgba(61,190,98,0.08)', border: 'rgba(61,190,98,0.2)', icon: 'ℹ️', label: 'INFO' },
}

function AlertsScreen() {
  const [expanded, setExpanded] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'unread'>('all')

  const shown = filter === 'unread' ? alerts.filter(a => !a.read) : alerts
  const unreadCount = alerts.filter(a => !a.read).length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <div style={{ padding: '16px 20px 12px', background: 'rgba(6,14,30,0.9)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#F0F4FF', fontFamily: 'Inter, sans-serif', letterSpacing: '-0.02em' }}>Alerts</div>
          {unreadCount > 0 && (
            <div style={{ background: '#FF4D4D', borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 700, color: '#fff', fontFamily: 'DM Mono, monospace' }}>
              {unreadCount} NEW
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {(['all', 'unread'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: '5px 14px', borderRadius: 20, border: `1px solid ${filter === f ? '#3DBE62' : 'rgba(255,255,255,0.1)'}`,
              background: filter === f ? 'rgba(61,190,98,0.12)' : 'transparent',
              color: filter === f ? '#3DBE62' : '#6B7FA3',
              fontSize: 11, fontFamily: 'DM Mono, monospace', cursor: 'pointer', letterSpacing: '0.06em', textTransform: 'uppercase',
            }}>{f === 'all' ? `All (${alerts.length})` : `Unread (${unreadCount})`}</button>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '12px 16px 16px' }}>
        {shown.map(alert => {
          const cfg = alertLevelConfig[alert.level]
          const isExpanded = expanded === alert.id
          return (
            <button key={alert.id} onClick={() => setExpanded(isExpanded ? null : alert.id)} style={{
              width: '100%',
              background: alert.read ? 'rgba(17,30,53,0.5)' : cfg.bg,
              border: `1px solid ${alert.read ? 'rgba(255,255,255,0.06)' : cfg.border}`,
              borderRadius: 14, padding: '14px 14px', marginBottom: 10, cursor: 'pointer',
              textAlign: 'left', position: 'relative', transition: 'all 0.2s ease',
            }}>
              {!alert.read && (
                <div style={{
                  position: 'absolute', top: 14, right: 14, width: 7, height: 7, borderRadius: '50%',
                  background: cfg.color, boxShadow: `0 0 8px ${cfg.color}`,
                }} />
              )}

              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: isExpanded ? 12 : 0 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                  background: cfg.bg, border: `1.5px solid ${cfg.border}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17,
                }}>
                  {cfg.icon}
                </div>
                <div style={{ flex: 1, paddingRight: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                    <span style={{
                      fontSize: 9, fontFamily: 'DM Mono, monospace', letterSpacing: '0.08em',
                      color: cfg.color, background: cfg.bg,
                      border: `1px solid ${cfg.border}`, borderRadius: 20, padding: '2px 6px',
                    }}>{cfg.label}</span>
                    <span style={{ fontSize: 9, fontFamily: 'DM Mono, monospace', color: '#6B7FA3' }}>{alert.type}</span>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: alert.read ? '#A8B8C8' : '#F0F4FF', fontFamily: 'Inter, sans-serif', marginBottom: 2 }}>
                    {alert.title}
                  </div>
                  <div style={{ fontSize: 10, color: '#6B7FA3', fontFamily: 'DM Mono, monospace' }}>
                    {alert.station} · {alert.time}
                  </div>
                </div>
              </div>

              {isExpanded && (
                <div style={{ animation: 'fade-up 0.2s ease' }}>
                  <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 10, padding: '10px 12px', marginBottom: 8 }}>
                    <div style={{ fontSize: 10, fontFamily: 'DM Mono, monospace', color: '#6B7FA3', letterSpacing: '0.08em', marginBottom: 6 }}>WHY THIS ALERT</div>
                    <p style={{ fontSize: 12, color: '#C8D8F0', fontFamily: 'Inter, sans-serif', lineHeight: 1.6, margin: 0 }}>{alert.reason}</p>
                  </div>

                  <div style={{ background: `${cfg.bg}`, border: `1px solid ${cfg.border}`, borderRadius: 10, padding: '10px 12px', marginBottom: 8 }}>
                    <div style={{ fontSize: 10, fontFamily: 'DM Mono, monospace', color: cfg.color, letterSpacing: '0.08em', marginBottom: 6 }}>RECOMMENDED ACTION</div>
                    <p style={{ fontSize: 12, color: '#F0F4FF', fontFamily: 'Inter, sans-serif', lineHeight: 1.6, margin: 0 }}>{alert.action}</p>
                  </div>

                  <div style={{ display: 'flex', gap: 8 }}>
                    <div style={{ flex: 1, background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: '8px 10px' }}>
                      <div style={{ fontSize: 9, fontFamily: 'DM Mono, monospace', color: '#6B7FA3', marginBottom: 3 }}>ESTIMATED DURATION</div>
                      <div style={{ fontSize: 11, color: '#A8B8C8', fontFamily: 'Inter, sans-serif' }}>{alert.duration}</div>
                    </div>
                  </div>
                </div>
              )}
            </button>
          )
        })}

        {shown.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
            <div style={{ fontSize: 16, fontWeight: 600, color: '#F0F4FF', fontFamily: 'Inter, sans-serif', marginBottom: 6 }}>All caught up</div>
            <div style={{ fontSize: 13, color: '#6B7FA3', fontFamily: 'Inter, sans-serif' }}>No unread alerts at this time</div>
          </div>
        )}

        <div style={{ background: 'rgba(17,30,53,0.5)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: '12px 14px', marginTop: 4 }}>
          <div style={{ fontSize: 11, color: '#6B7FA3', fontFamily: 'Inter, sans-serif' }}>
            🔔 You receive alerts for: PM2.5 spikes, industrial emissions, wildfire risk, and your saved locations.
            <span style={{ color: '#56B8FF', cursor: 'pointer' }}> Manage in Profile →</span>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ============================================================================
   SCREEN — InsightsScreen
   ============================================================================ */

const insights = [
  {
    id: 'I-001', time: '14:30 today', district: 'City-wide', title: 'Afternoon Particulate Rise Explained',
    summary: 'The increase in PM2.5 across central Almaty is likely associated with increased traffic density during lunch hours and a significant weakening of the northerly mountain breeze from 12 km/h to under 2 km/h.',
    detail: 'Camera stations ST-001 through ST-004 observed above-average vehicle density between 12:00 and 14:30. Concurrently, anemometer readings across 12 stations dropped below 2 m/s — a meteorological condition historically correlated with a 34% increase in particulate accumulation in this urban corridor. No industrial events were detected by camera AI during this window.',
    dataPoints: ['12 camera stations', '4 sensor arrays', 'Traffic model v2.1', 'ECMWF wind data'],
    confidence: 89, category: 'Traffic', icon: '🚗', trend: 'up',
  },
  {
    id: 'I-002', time: '11:00 today', district: 'Western District', title: 'Western District Improvement Forecast',
    summary: 'The western district is expected to improve within two hours. A strengthening mountain breeze, currently observed at Kok-Tobe (ST-005) at 5.4 m/s, is predicted to reach the Alatau residential zone by 13:00.',
    detail: 'Kok-Tobe ridge station consistently acts as a leading indicator for wind propagation toward the city center — with an average lag of 85–110 minutes based on 180-day historical correlation. Current PM2.5 at ST-005 is 3.1 μg/m³, the cleanest reading in the network. If wind continues at this intensity, the western corridor (ST-003, ST-006) should see 30–45% particulate reduction.',
    dataPoints: ['ST-005 wind sensor', '180-day historical model', 'ASOS meteorological feed', 'Camera visibility index'],
    confidence: 82, category: 'Weather', icon: '🌬', trend: 'down',
  },
  {
    id: 'I-003', time: '09:15 today', district: 'Industrial Zone', title: 'Industrial Emission Pattern Identified',
    summary: 'Camera AI detected a recurring smoke plume signature at ST-004 matching a known industrial boiler startup pattern. This is the third occurrence this week at approximately the same time window (08:45–10:30).',
    detail: 'The AI camera model identified opacity and plume geometry consistent with coal combustion startup, not diesel engine exhaust. The pattern was flagged automatically and cross-referenced against the city industrial calendar — no permitted event was logged for this time slot. Data has been forwarded to the municipal environmental inspector portal.',
    dataPoints: ['ST-004 camera AI', 'Emission pattern library', 'Industrial calendar API', 'NO₂/SO₂ sensor fusion'],
    confidence: 94, category: 'Industrial', icon: '🏭', trend: 'up',
  },
  {
    id: 'I-004', time: 'Yesterday 22:40', district: 'Medeu & Bostandyk', title: 'Nighttime Air Quality Excellent',
    summary: 'Between 22:00 and 06:00, all Medeu and Bostandyk stations recorded AQI below 25 — among the best readings in 30 days. Ideal conditions for ventilating indoor spaces overnight.',
    detail: 'Post-rainfall humidity (62%) combined with sustained mountain drainage flow produced exceptional air clarity. PM2.5 averaged 2.8 μg/m³ across the 5-station cluster — 65% below the 30-day nightly average. Camera visibility index reached maximum (>15 km equivalent). This window was flagged by the AI system as a high-value ventilation opportunity.',
    dataPoints: ['5 Medeu stations', 'Post-rain humidity model', 'Camera visibility index', '30-day baseline'],
    confidence: 97, category: 'Clean Air', icon: '✨', trend: 'good',
  },
]

function InsightsScreen() {
  const [expanded, setExpanded] = useState<string | null>('I-001')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <div style={{ padding: '16px 20px 14px', background: 'rgba(6,14,30,0.9)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: '#F0F4FF', fontFamily: 'Inter, sans-serif', letterSpacing: '-0.02em', marginBottom: 4 }}>AI Insights</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'linear-gradient(135deg, #3DBE62, #56B8FF)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>🤖</div>
          <span style={{ fontSize: 12, color: '#6B7FA3', fontFamily: 'Inter, sans-serif' }}>Environmental analyst · Updated continuously</span>
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '12px 16px 16px' }}>
        <div style={{ background: 'rgba(86,184,255,0.06)', border: '1px solid rgba(86,184,255,0.15)', borderRadius: 12, padding: '10px 14px', marginBottom: 14 }}>
          <div style={{ fontSize: 11, color: '#56B8FF', fontFamily: 'Inter, sans-serif', lineHeight: 1.6 }}>
            <strong>AI Environmental Analysis</strong> — Insights are generated by fusing camera observations, sensor readings, and meteorological data. Confidence scores reflect data completeness and model certainty.
          </div>
        </div>

        {insights.map(ins => {
          const isExpanded = expanded === ins.id
          return (
            <button key={ins.id} onClick={() => setExpanded(isExpanded ? null : ins.id)} style={{
              width: '100%', background: 'rgba(17,30,53,0.7)', border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 16, padding: '16px', marginBottom: 10, cursor: 'pointer', textAlign: 'left',
              transition: 'all 0.2s ease',
            }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
                }}>
                  {ins.icon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <span style={{
                      fontSize: 9, fontFamily: 'DM Mono, monospace', letterSpacing: '0.08em',
                      color: '#6B7FA3', background: 'rgba(255,255,255,0.05)', borderRadius: 20, padding: '2px 7px',
                    }}>{ins.category.toUpperCase()}</span>
                    <span style={{ fontSize: 9, fontFamily: 'DM Mono, monospace', color: '#6B7FA3' }}>{ins.district}</span>
                    <span style={{ fontSize: 9, fontFamily: 'DM Mono, monospace', color: '#6B7FA3', marginLeft: 'auto' }}>{ins.time}</span>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#F0F4FF', fontFamily: 'Inter, sans-serif', lineHeight: 1.3, marginBottom: 6 }}>
                    {ins.title}
                  </div>
                  <p style={{ fontSize: 12, color: '#8BA3C0', fontFamily: 'Inter, sans-serif', lineHeight: 1.6, margin: 0 }}>
                    {ins.summary}
                  </p>
                </div>
              </div>

              <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 9, fontFamily: 'DM Mono, monospace', color: '#6B7FA3', width: 60, flexShrink: 0 }}>CONFIDENCE</span>
                <div style={{ flex: 1, height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 2 }}>
                  <div style={{ height: '100%', width: `${ins.confidence}%`, borderRadius: 2, background: ins.confidence > 90 ? '#3DBE62' : ins.confidence > 75 ? '#56B8FF' : '#FFB340' }} />
                </div>
                <span style={{ fontSize: 10, fontWeight: 600, fontFamily: 'DM Mono, monospace', color: ins.confidence > 90 ? '#3DBE62' : ins.confidence > 75 ? '#56B8FF' : '#FFB340', width: 32, textAlign: 'right', flexShrink: 0 }}>{ins.confidence}%</span>
              </div>

              {isExpanded && (
                <div style={{ marginTop: 14, animation: 'fade-up 0.2s ease' }}>
                  <div style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 10, padding: '12px', marginBottom: 10 }}>
                    <div style={{ fontSize: 10, fontFamily: 'DM Mono, monospace', color: '#6B7FA3', letterSpacing: '0.08em', marginBottom: 8 }}>DETAILED ANALYSIS</div>
                    <p style={{ fontSize: 12, color: '#C8D8F0', fontFamily: 'Inter, sans-serif', lineHeight: 1.7, margin: 0 }}>{ins.detail}</p>
                  </div>

                  <div>
                    <div style={{ fontSize: 10, fontFamily: 'DM Mono, monospace', color: '#6B7FA3', letterSpacing: '0.08em', marginBottom: 8 }}>DATA SOURCES</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {ins.dataPoints.map(dp => (
                        <span key={dp} style={{
                          fontSize: 10, fontFamily: 'DM Mono, monospace', color: '#56B8FF',
                          background: 'rgba(86,184,255,0.08)', border: '1px solid rgba(86,184,255,0.2)',
                          borderRadius: 20, padding: '3px 10px',
                        }}>{dp}</span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

/* ============================================================================
   SCREEN — StationsScreen
   ============================================================================ */

interface StationsScreenProps {
  selectedStation?: string | null
  onClear: () => void
}

function BatteryIcon({ level }: { level: number }) {
  const color = level > 50 ? '#3DBE62' : level > 20 ? '#FFB340' : '#FF4D4D'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      <div style={{ width: 18, height: 9, border: `1.5px solid ${color}33`, borderRadius: 2, position: 'relative', display: 'flex', alignItems: 'center', padding: '1px' }}>
        <div style={{ width: `${level}%`, height: '100%', background: color, borderRadius: 1 }} />
        <div style={{ position: 'absolute', right: -4, top: '50%', transform: 'translateY(-50%)', width: 3, height: 5, background: `${color}66`, borderRadius: '0 1px 1px 0' }} />
      </div>
      <span style={{ fontSize: 9, fontFamily: 'DM Mono, monospace', color }}>{level}%</span>
    </div>
  )
}

function SignalBars({ strength }: { strength: number }) {
  const color = strength > 70 ? '#3DBE62' : strength > 40 ? '#FFB340' : '#FF4D4D'
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2 }}>
      {[25, 50, 75, 100].map((threshold, i) => (
        <div key={i} style={{
          width: 3, height: 4 + i * 2, borderRadius: 1,
          background: strength >= threshold ? color : 'rgba(255,255,255,0.12)',
        }} />
      ))}
    </div>
  )
}

function StationCard({ s, isSelected, onClick }: { s: Station; isSelected: boolean; onClick: () => void }) {
  const color = getAQIColor(s.level)
  return (
    <button onClick={onClick} style={{
      width: '100%',
      background: isSelected ? `rgba(${s.online ? '61,190,98' : '107,127,163'},0.08)` : 'rgba(17,30,53,0.7)',
      border: `1px solid ${isSelected ? color + '44' : 'rgba(255,255,255,0.07)'}`,
      borderRadius: 14, padding: '14px', marginBottom: 10, cursor: 'pointer', textAlign: 'left',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12, flexShrink: 0,
            background: s.online ? `radial-gradient(circle, ${color}22, transparent)` : 'rgba(255,255,255,0.04)',
            border: `1.5px solid ${s.online ? color + '55' : 'rgba(255,255,255,0.08)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: s.online ? color : '#6B7FA3', fontFamily: 'Inter, sans-serif' }}>
              {s.online ? s.aqi : '—'}
            </span>
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#F0F4FF', fontFamily: 'Inter, sans-serif' }}>{s.name}</div>
            <div style={{ fontSize: 10, color: '#6B7FA3', fontFamily: 'DM Mono, monospace', marginTop: 1 }}>{s.id} · {s.district}</div>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 4,
            background: s.online ? 'rgba(61,190,98,0.1)' : 'rgba(255,77,77,0.1)', borderRadius: 20, padding: '2px 8px',
          }}>
            <div style={{ width: 5, height: 5, borderRadius: '50%', background: s.online ? '#3DBE62' : '#FF4D4D' }}
              className={s.online ? 'animate-glow-pulse' : ''} />
            <span style={{ fontSize: 9, fontFamily: 'DM Mono, monospace', color: s.online ? '#3DBE62' : '#FF4D4D', letterSpacing: '0.06em' }}>
              {s.online ? 'ONLINE' : 'OFFLINE'}
            </span>
          </div>
          {s.online && <span style={{ fontSize: 9, fontFamily: 'DM Mono, monospace', color: color, letterSpacing: '0.04em' }}>{getAQILabel(s.level)}</span>}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 4,
          background: s.cameraOnline ? 'rgba(86,184,255,0.08)' : 'rgba(255,255,255,0.04)',
          border: `1px solid ${s.cameraOnline ? 'rgba(86,184,255,0.2)' : 'rgba(255,255,255,0.06)'}`,
          borderRadius: 20, padding: '3px 8px',
        }}>
          <span style={{ fontSize: 9 }}>📷</span>
          <span style={{ fontSize: 9, fontFamily: 'DM Mono, monospace', color: s.cameraOnline ? '#56B8FF' : '#6B7FA3' }}>
            {s.cameraOnline ? 'CAM ON' : 'CAM OFF'}
          </span>
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 4,
          background: s.online ? 'rgba(61,190,98,0.08)' : 'rgba(255,255,255,0.04)',
          border: `1px solid ${s.online ? 'rgba(61,190,98,0.2)' : 'rgba(255,255,255,0.06)'}`,
          borderRadius: 20, padding: '3px 8px',
        }}>
          <span style={{ fontSize: 9 }}>🔬</span>
          <span style={{ fontSize: 9, fontFamily: 'DM Mono, monospace', color: s.online ? '#3DBE62' : '#6B7FA3' }}>
            {s.online ? 'SENSOR OK' : 'OFFLINE'}
          </span>
        </div>
        {s.solar && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(255,215,0,0.08)', border: '1px solid rgba(255,215,0,0.2)', borderRadius: 20, padding: '3px 8px' }}>
            <span style={{ fontSize: 9 }}>☀️</span>
            <span style={{ fontSize: 9, fontFamily: 'DM Mono, monospace', color: '#FFD700' }}>SOLAR</span>
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
        <div style={{ textAlign: 'center' }}>
          <BatteryIcon level={s.battery} />
          <div style={{ fontSize: 8, color: '#6B7FA3', fontFamily: 'DM Mono, monospace', marginTop: 3 }}>BATTERY</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center' }}><SignalBars strength={s.signal} /></div>
          <div style={{ fontSize: 8, color: '#6B7FA3', fontFamily: 'DM Mono, monospace', marginTop: 3 }}>SIGNAL</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 11, fontFamily: 'DM Mono, monospace', color: '#A8B8C8' }}>{s.firmware}</div>
          <div style={{ fontSize: 8, color: '#6B7FA3', fontFamily: 'DM Mono, monospace', marginTop: 3 }}>FIRMWARE</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 10, fontFamily: 'DM Mono, monospace', color: '#A8B8C8' }}>{s.lastSync}</div>
          <div style={{ fontSize: 8, color: '#6B7FA3', fontFamily: 'DM Mono, monospace', marginTop: 3 }}>LAST SYNC</div>
        </div>
      </div>

      {s.online && (
        <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: 12 }}>
          {[
            { label: 'PM2.5', value: `${s.pm25} μg/m³` },
            { label: 'PM10', value: `${s.pm10} μg/m³` },
            { label: 'TEMP', value: `${s.temp}°C` },
            { label: 'HUM', value: `${s.humidity}%` },
          ].map(m => (
            <div key={m.label}>
              <div style={{ fontSize: 8, color: '#6B7FA3', fontFamily: 'DM Mono, monospace', letterSpacing: '0.06em' }}>{m.label}</div>
              <div style={{ fontSize: 11, color: '#C8D8F0', fontFamily: 'DM Mono, monospace', marginTop: 2 }}>{m.value}</div>
            </div>
          ))}
        </div>
      )}
    </button>
  )
}

function StationsScreen({ selectedStation }: StationsScreenProps) {
  const [selected, setSelected] = useState<string | null>(selectedStation || null)
  const [filter, setFilter] = useState<'all' | 'online' | 'offline'>('all')

  const shown = stations.filter(s => {
    if (filter === 'online') return s.online
    if (filter === 'offline') return !s.online
    return true
  })

  const onlineCount = stations.filter(s => s.online).length
  const cameraCount = stations.filter(s => s.cameraOnline).length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <div style={{ padding: '16px 20px 12px', background: 'rgba(6,14,30,0.9)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: '#F0F4FF', fontFamily: 'Inter, sans-serif', letterSpacing: '-0.02em', marginBottom: 10 }}>Monitoring Stations</div>
        <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
          {[
            { label: 'STATIONS', value: stations.length, color: '#F0F4FF' },
            { label: 'ONLINE', value: onlineCount, color: '#3DBE62' },
            { label: 'CAMERAS', value: cameraCount, color: '#56B8FF' },
          ].map(stat => (
            <div key={stat.label} style={{ flex: 1, background: 'rgba(17,30,53,0.6)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: stat.color, fontFamily: 'Inter, sans-serif' }}>{stat.value}</div>
              <div style={{ fontSize: 8, fontFamily: 'DM Mono, monospace', color: '#6B7FA3', letterSpacing: '0.1em', marginTop: 2 }}>{stat.label}</div>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {(['all', 'online', 'offline'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: '5px 12px', borderRadius: 20,
              border: `1px solid ${filter === f ? '#3DBE62' : 'rgba(255,255,255,0.1)'}`,
              background: filter === f ? 'rgba(61,190,98,0.12)' : 'transparent',
              color: filter === f ? '#3DBE62' : '#6B7FA3',
              fontSize: 11, fontFamily: 'DM Mono, monospace', cursor: 'pointer', textTransform: 'capitalize',
            }}>{f}</button>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '12px 16px 16px' }}>
        {shown.map(s => (
          <StationCard key={s.id} s={s}
            isSelected={selected === s.id}
            onClick={() => setSelected(selected === s.id ? null : s.id)} />
        ))}
      </div>
    </div>
  )
}

/* ============================================================================
   SCREEN — RouteScreen
   ============================================================================ */

const routes = [
  {
    id: 'safe', label: 'Safest Route', icon: '🛡', color: '#3DBE62', time: '28 min', distance: '3.2 km',
    avgAQI: 48, exposure: 'Low', hotspots: 0,
    description: 'Via Kok-Tobe Blvd and park corridor. Avoids industrial zone and Seifullin Junction. Consistent tree canopy provides natural PM filtration.',
    via: ['Kok-Tobe Blvd', 'Republic Square', 'Park Corridor'],
  },
  {
    id: 'fast', label: 'Fastest Route', icon: '⚡', color: '#FFB340', time: '14 min', distance: '1.8 km',
    avgAQI: 118, exposure: 'High', hotspots: 2,
    description: 'Direct via Seifullin Junction and Furmanov St. Passes through moderate-to-unhealthy AQI zones. Not recommended for sensitive groups.',
    via: ['Seifullin Junction', 'Furmanov St', 'Dostyk Ave'],
  },
  {
    id: 'balanced', label: 'Balanced Route', icon: '⚖️', color: '#56B8FF', time: '20 min', distance: '2.6 km',
    avgAQI: 72, exposure: 'Moderate', hotspots: 1,
    description: 'Via Al-Farabi Ave lower section. Moderate exposure in one 400m stretch near Esentai. Otherwise clean. Recommended for cycling.',
    via: ['Al-Farabi Lower', 'Esentai Park', 'Dostyk South'],
  },
]

function RouteScreen() {
  const [from, setFrom] = useState('My Location')
  const [to, setTo] = useState('Almaty City Hall')
  const [selected, setSelected] = useState('safe')
  const [planned, setPlanned] = useState(false)

  const selectedRoute = routes.find(r => r.id === selected)!

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <div style={{ padding: '16px 20px 14px', background: 'rgba(6,14,30,0.9)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: '#F0F4FF', fontFamily: 'Inter, sans-serif', letterSpacing: '-0.02em', marginBottom: 14 }}>Safe Route Planner</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(17,30,53,0.8)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '10px 14px' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#3DBE62', flexShrink: 0 }} className="animate-glow-pulse" />
            <input value={from} onChange={e => setFrom(e.target.value)} style={{
              flex: 1, background: 'none', border: 'none', outline: 'none', fontSize: 14, color: '#F0F4FF', fontFamily: 'Inter, sans-serif',
            }} placeholder="Current location" />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(17,30,53,0.8)', border: '1px solid rgba(86,184,255,0.2)', borderRadius: 12, padding: '10px 14px' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#56B8FF', flexShrink: 0 }} />
            <input value={to} onChange={e => setTo(e.target.value)} style={{
              flex: 1, background: 'none', border: 'none', outline: 'none', fontSize: 14, color: '#F0F4FF', fontFamily: 'Inter, sans-serif',
            }} placeholder="Destination" />
          </div>
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '0 16px 16px' }}>
        <div style={{
          marginTop: 14, height: 160, borderRadius: 16, overflow: 'hidden', position: 'relative',
          background: 'linear-gradient(135deg, #081428 0%, #060E1E 100%)', border: '1px solid rgba(255,255,255,0.07)',
        }}>
          <svg width="100%" height="100%" viewBox="0 0 360 160" preserveAspectRatio="none">
            <defs>
              <pattern id="routeGrid" width="30" height="30" patternUnits="userSpaceOnUse">
                <path d="M 30 0 L 0 0 0 30" fill="none" stroke="rgba(86,184,255,0.1)" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="360" height="160" fill="url(#routeGrid)" />

            <ellipse cx="200" cy="90" rx="60" ry="40" fill="rgba(255,122,53,0.12)" />
            <ellipse cx="280" cy="60" rx="40" ry="30" fill="rgba(255,215,0,0.08)" />
            <ellipse cx="80" cy="100" rx="35" ry="25" fill="rgba(61,190,98,0.08)" />

            <path d="M 40 130 C 80 90 100 70 160 60 C 200 55 240 50 300 40"
              stroke={selected === 'safe' ? '#3DBE62' : 'rgba(61,190,98,0.3)'}
              strokeWidth={selected === 'safe' ? 3 : 1.5} fill="none" strokeLinecap="round"
              strokeDasharray={selected === 'safe' ? 'none' : '4,4'} />
            <path d="M 40 130 C 100 120 180 110 230 90 C 260 80 285 60 300 40"
              stroke={selected === 'fast' ? '#FFB340' : 'rgba(255,179,64,0.3)'}
              strokeWidth={selected === 'fast' ? 3 : 1.5} fill="none" strokeLinecap="round"
              strokeDasharray={selected === 'fast' ? 'none' : '4,4'} />
            <path d="M 40 130 C 90 110 130 85 180 75 C 220 68 260 55 300 40"
              stroke={selected === 'balanced' ? '#56B8FF' : 'rgba(86,184,255,0.3)'}
              strokeWidth={selected === 'balanced' ? 3 : 1.5} fill="none" strokeLinecap="round"
              strokeDasharray={selected === 'balanced' ? 'none' : '4,4'} />

            <circle cx="40" cy="130" r="6" fill="#3DBE62" />
            <circle cx="40" cy="130" r="10" fill="rgba(61,190,98,0.2)" />
            <circle cx="300" cy="40" r="6" fill="#56B8FF" />
            <circle cx="300" cy="40" r="10" fill="rgba(86,184,255,0.2)" />

            {selected !== 'safe' && (
              <g>
                <circle cx="200" cy="90" r="10" fill="rgba(255,122,53,0.3)" stroke="#FF7A35" strokeWidth="1" />
                <text x="200" y="94" textAnchor="middle" fill="#FFB340" fontSize="10">⚠</text>
              </g>
            )}
          </svg>
          <div style={{ position: 'absolute', top: 8, left: 12, fontSize: 9, fontFamily: 'DM Mono, monospace', color: '#6B7FA3', letterSpacing: '0.08em' }}>ROUTE PREVIEW · AI-OPTIMIZED</div>
          <div style={{ position: 'absolute', bottom: 8, right: 12, fontSize: 9, fontFamily: 'DM Mono, monospace', color: '#6B7FA3' }}>47 SENSOR STATIONS ACTIVE</div>
        </div>

        <div style={{ marginTop: 14 }}>
          <div style={{ fontSize: 11, fontFamily: 'DM Mono, monospace', color: '#6B7FA3', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>Route Options</div>
          {routes.map(route => (
            <button key={route.id} onClick={() => setSelected(route.id)} style={{
              width: '100%',
              background: selected === route.id ? `rgba(${route.color === '#3DBE62' ? '61,190,98' : route.color === '#56B8FF' ? '86,184,255' : '255,179,64'},0.08)` : 'rgba(17,30,53,0.6)',
              border: `1px solid ${selected === route.id ? route.color + '44' : 'rgba(255,255,255,0.06)'}`,
              borderRadius: 14, padding: '14px 16px', marginBottom: 8, cursor: 'pointer', textAlign: 'left',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 18 }}>{route.icon}</span>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: selected === route.id ? route.color : '#F0F4FF', fontFamily: 'Inter, sans-serif' }}>{route.label}</div>
                    <div style={{ fontSize: 10, color: '#6B7FA3', fontFamily: 'DM Mono, monospace', marginTop: 1 }}>
                      via {route.via[0]}
                    </div>
                  </div>
                </div>
                {selected === route.id && (
                  <div style={{ background: route.color, borderRadius: 20, padding: '3px 10px', fontSize: 9, fontFamily: 'DM Mono, monospace', color: '#000', fontWeight: 700, letterSpacing: '0.06em' }}>SELECTED</div>
                )}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                {[
                  { label: 'TIME', value: route.time },
                  { label: 'DISTANCE', value: route.distance },
                  { label: 'AVG AQI', value: route.avgAQI, color: route.avgAQI < 50 ? '#3DBE62' : route.avgAQI < 100 ? '#FFD700' : '#FF7A35' },
                  { label: 'EXPOSURE', value: route.exposure, color: route.exposure === 'Low' ? '#3DBE62' : route.exposure === 'Moderate' ? '#FFD700' : '#FF7A35' },
                ].map(m => (
                  <div key={m.label} style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 8, padding: '6px 8px' }}>
                    <div style={{ fontSize: 8, color: '#6B7FA3', fontFamily: 'DM Mono, monospace', letterSpacing: '0.08em' }}>{m.label}</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: (m as any).color || '#F0F4FF', fontFamily: 'Inter, sans-serif', marginTop: 2 }}>{m.value}</div>
                  </div>
                ))}
              </div>
            </button>
          ))}
        </div>

        <div style={{
          background: 'linear-gradient(135deg, #0D2820, #0A1E30)', border: '1px solid rgba(61,190,98,0.2)',
          borderRadius: 14, padding: '14px', marginTop: 4,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg, #3DBE62, #56B8FF)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>🤖</div>
            <div>
              <div style={{ fontSize: 10, fontFamily: 'DM Mono, monospace', color: '#3DBE62', letterSpacing: '0.08em' }}>AI ROUTE ANALYSIS</div>
              <div style={{ fontSize: 11, color: '#6B7FA3', fontFamily: 'Inter, sans-serif', marginTop: 1 }}>Based on real-time sensor + camera data</div>
            </div>
          </div>
          <p style={{ fontSize: 13, color: '#C8D8F0', fontFamily: 'Inter, sans-serif', lineHeight: 1.6, margin: 0 }}>
            {selectedRoute.description}
          </p>
          {selectedRoute.hotspots > 0 && (
            <div style={{ marginTop: 10, background: 'rgba(255,122,53,0.1)', border: '1px solid rgba(255,122,53,0.2)', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: '#FF7A35', fontFamily: 'Inter, sans-serif' }}>
              ⚠ {selectedRoute.hotspots} pollution hotspot{selectedRoute.hotspots > 1 ? 's' : ''} detected along this route
            </div>
          )}
        </div>

        <button onClick={() => setPlanned(!planned)} style={{
          width: '100%', marginTop: 14, padding: '16px', borderRadius: 14, border: 'none',
          background: planned ? 'rgba(61,190,98,0.15)' : 'linear-gradient(135deg, #3DBE62, #2DA050)',
          color: planned ? '#3DBE62' : '#fff', fontSize: 15, fontWeight: 700, fontFamily: 'Inter, sans-serif',
          letterSpacing: '-0.01em', cursor: 'pointer',
          boxShadow: planned ? 'none' : '0 8px 24px rgba(61,190,98,0.3)',
        }}>
          {planned ? '✓ Route Planned — Monitoring Active' : `Start ${selectedRoute.label}`}
        </button>
      </div>
    </div>
  )
}

/* ============================================================================
   SCREEN — ProfileScreen
   ============================================================================ */

const savedPlaces = [
  { name: 'Home', address: 'Kok-Tobe District, Almaty', aqi: 18, level: 'good' as const, icon: '🏠' },
  { name: 'Office', address: 'Dostyk Ave 12, Almaty', aqi: 78, level: 'moderate' as const, icon: '🏢' },
  { name: "Children's School", address: 'Al-Farabi 52, Medeu', aqi: 42, level: 'good' as const, icon: '🏫' },
]

const profileAqiColors = { good: '#3DBE62', moderate: '#FFD700', sensitive: '#FFB340', unhealthy: '#FF7A35' }

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!on)} style={{
      width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer',
      background: on ? '#3DBE62' : 'rgba(255,255,255,0.12)', position: 'relative', transition: 'background 0.2s ease',
      flexShrink: 0, padding: 0,
    }}>
      <div style={{
        position: 'absolute', top: 3, left: on ? 23 : 3, width: 18, height: 18, borderRadius: '50%',
        background: '#fff', transition: 'left 0.2s ease', boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
      }} />
    </button>
  )
}

function ProfileScreen() {
  const [settings, setSettings] = useState({
    pm25Alerts: true, smokeAlerts: true, dailyReport: true, savedLocations: true,
    darkMode: true, dataSharing: false, highContrast: false,
  })

  const set = (key: keyof typeof settings) => (v: boolean) =>
    setSettings(prev => ({ ...prev, [key]: v }))

  const [lang, setLang] = useState('English')
  const languages = ['English', 'Қазақша', 'Русский']

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <div style={{ padding: '16px 20px 14px', background: 'rgba(6,14,30,0.9)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ fontSize: 18, fontWeight: 700, color: '#F0F4FF', fontFamily: 'Inter, sans-serif', letterSpacing: '-0.02em' }}>Profile</div>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '14px 16px 16px' }}>
        <div style={{ background: 'linear-gradient(135deg, #0D2820, #0A1E30)', border: '1px solid rgba(61,190,98,0.2)', borderRadius: 16, padding: '18px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 54, height: 54, borderRadius: '50%', flexShrink: 0,
            background: 'linear-gradient(135deg, #3DBE62, #56B8FF)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24,
          }}>👤</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 17, fontWeight: 700, color: '#F0F4FF', fontFamily: 'Inter, sans-serif', marginBottom: 2 }}>Almaty Citizen</div>
            <div style={{ fontSize: 11, color: '#6B7FA3', fontFamily: 'DM Mono, monospace' }}>citizen@tynysalu.kz</div>
            <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
              <span style={{ fontSize: 10, fontFamily: 'DM Mono, monospace', color: '#3DBE62', background: 'rgba(61,190,98,0.12)', border: '1px solid rgba(61,190,98,0.25)', borderRadius: 20, padding: '2px 8px' }}>
                Asthma Plan
              </span>
              <span style={{ fontSize: 10, fontFamily: 'DM Mono, monospace', color: '#56B8FF', background: 'rgba(86,184,255,0.1)', border: '1px solid rgba(86,184,255,0.2)', borderRadius: 20, padding: '2px 8px' }}>
                Cyclist
              </span>
            </div>
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontFamily: 'DM Mono, monospace', color: '#6B7FA3', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>Saved Places</div>
          {savedPlaces.map(place => (
            <div key={place.name} style={{
              background: 'rgba(17,30,53,0.7)', border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 12, padding: '12px 14px', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <span style={{ fontSize: 20 }}>{place.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#F0F4FF', fontFamily: 'Inter, sans-serif' }}>{place.name}</div>
                <div style={{ fontSize: 10, color: '#6B7FA3', fontFamily: 'Inter, sans-serif', marginTop: 1 }}>{place.address}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: profileAqiColors[place.level], fontFamily: 'Inter, sans-serif' }}>{place.aqi}</div>
                <div style={{ fontSize: 8, fontFamily: 'DM Mono, monospace', color: profileAqiColors[place.level] }}>AQI</div>
              </div>
            </div>
          ))}
          <button style={{
            width: '100%', padding: '10px', borderRadius: 12, border: '1px dashed rgba(255,255,255,0.1)',
            background: 'transparent', color: '#6B7FA3', fontSize: 12, fontFamily: 'Inter, sans-serif', cursor: 'pointer',
          }}>+ Add saved place</button>
        </div>

        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontFamily: 'DM Mono, monospace', color: '#6B7FA3', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>Alert Settings</div>
          <div style={{ background: 'rgba(17,30,53,0.7)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, overflow: 'hidden' }}>
            {[
              { label: 'PM2.5 Spike Alerts', desc: 'Notify when PM2.5 exceeds WHO threshold', key: 'pm25Alerts' as const },
              { label: 'Smoke Detection', desc: 'Camera AI detects smoke or fire', key: 'smokeAlerts' as const },
              { label: 'Daily Summary', desc: 'Morning briefing for your saved places', key: 'dailyReport' as const },
              { label: 'Location Alerts', desc: 'Alerts when you enter poor air quality zones', key: 'savedLocations' as const },
            ].map((item, i, arr) => (
              <div key={item.key} style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '13px 14px',
                borderBottom: i < arr.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: '#F0F4FF', fontFamily: 'Inter, sans-serif' }}>{item.label}</div>
                  <div style={{ fontSize: 11, color: '#6B7FA3', fontFamily: 'Inter, sans-serif', marginTop: 2 }}>{item.desc}</div>
                </div>
                <Toggle on={settings[item.key]} onChange={set(item.key)} />
              </div>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontFamily: 'DM Mono, monospace', color: '#6B7FA3', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>App Settings</div>
          <div style={{ background: 'rgba(17,30,53,0.7)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, overflow: 'hidden' }}>
            <div style={{ padding: '13px 14px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: '#F0F4FF', fontFamily: 'Inter, sans-serif', marginBottom: 8 }}>Language</div>
              <div style={{ display: 'flex', gap: 6 }}>
                {languages.map(l => (
                  <button key={l} onClick={() => setLang(l)} style={{
                    padding: '5px 12px', borderRadius: 20, border: `1px solid ${lang === l ? '#3DBE62' : 'rgba(255,255,255,0.1)'}`,
                    background: lang === l ? 'rgba(61,190,98,0.12)' : 'transparent',
                    color: lang === l ? '#3DBE62' : '#6B7FA3', fontSize: 11, fontFamily: 'Inter, sans-serif', cursor: 'pointer',
                  }}>{l}</button>
                ))}
              </div>
            </div>
            {[
              { label: 'Dark Mode', desc: 'Optimized for night use', key: 'darkMode' as const },
              { label: 'High Contrast', desc: 'Accessibility enhancement', key: 'highContrast' as const },
              { label: 'Anonymized Data Sharing', desc: 'Help improve the city air model', key: 'dataSharing' as const },
            ].map((item, i, arr) => (
              <div key={item.key} style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '13px 14px',
                borderBottom: i < arr.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: '#F0F4FF', fontFamily: 'Inter, sans-serif' }}>{item.label}</div>
                  <div style={{ fontSize: 11, color: '#6B7FA3', fontFamily: 'Inter, sans-serif', marginTop: 2 }}>{item.desc}</div>
                </div>
                <Toggle on={settings[item.key]} onChange={set(item.key)} />
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: 'rgba(255,77,77,0.06)', border: '1px solid rgba(255,77,77,0.15)', borderRadius: 14, padding: '14px', marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#FF4D4D', fontFamily: 'Inter, sans-serif', marginBottom: 6 }}>🚨 Emergency Contacts</div>
          <div style={{ fontSize: 12, color: '#8BA3C0', fontFamily: 'Inter, sans-serif', marginBottom: 10 }}>
            Notified automatically during hazardous air events
          </div>
          {['Family — +7 (727) 123-4567', 'Doctor — +7 (727) 987-6543'].map(c => (
            <div key={c} style={{ fontSize: 12, color: '#C8D8F0', fontFamily: 'DM Mono, monospace', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ color: '#3DBE62' }}>✓</span> {c}
            </div>
          ))}
          <button style={{ marginTop: 8, padding: '6px 14px', borderRadius: 20, border: '1px solid rgba(255,77,77,0.3)', background: 'transparent', color: '#FF4D4D', fontSize: 11, fontFamily: 'DM Mono, monospace', cursor: 'pointer' }}>
            + Add Contact
          </button>
        </div>

        <div style={{ textAlign: 'center', padding: '8px 0 20px' }}>
          <div style={{ fontSize: 10, fontFamily: 'DM Mono, monospace', color: '#6B7FA3', letterSpacing: '0.06em' }}>
            TynysAlu v1.4.2 · Network: 47 stations · AI Model: v3.2
          </div>
          <div style={{ fontSize: 10, fontFamily: 'DM Mono, monospace', color: '#4a5a6a', marginTop: 4, letterSpacing: '0.04em' }}>
            Data from City Environmental Monitoring Network
          </div>
        </div>
      </div>
    </div>
  )
}

/* ============================================================================
   APP SHELL — App.tsx
   ============================================================================ */

type NavScreen = 'home' | 'map' | 'analytics' | 'alerts' | 'profile'
type AuxScreen = 'route' | 'insights' | 'stations'
type Screen = NavScreen | AuxScreen

const NAV_SCREENS: NavScreen[] = ['home', 'map', 'analytics', 'alerts', 'profile']

export default function App() {
  const [splashDone, setSplashDone] = useState(false)
  const [screen, setScreen] = useState<Screen>('home')
  const [selectedStation, setSelectedStation] = useState<string | null>(null)

  const navigate = useCallback((s: string) => setScreen(s as Screen), [])

  const handleStation = useCallback((id: string) => {
    setSelectedStation(id)
    setScreen('stations')
  }, [])

  const activeTab: NavScreen = NAV_SCREENS.includes(screen as NavScreen) ? (screen as NavScreen) : 'home'

  if (!splashDone) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-start', minHeight: '100vh', background: '#060E1E' }}>
        <div style={phoneFrame}>
          <SplashScreen onDone={() => setSplashDone(true)} />
        </div>
      </div>
    )
  }

  const renderScreen = () => {
    switch (screen) {
      case 'home': return <HomeScreen onNav={navigate} onStation={handleStation} />
      case 'map': return <MapScreen onStation={handleStation} />
      case 'analytics': return <AnalyticsScreen />
      case 'alerts': return <AlertsScreen />
      case 'profile': return <ProfileScreen />
      case 'route': return <RouteScreen />
      case 'insights': return <InsightsScreen />
      case 'stations': return <StationsScreen selectedStation={selectedStation} onClear={() => setSelectedStation(null)} />
      default: return <HomeScreen onNav={navigate} onStation={handleStation} />
    }
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-start', minHeight: '100vh', background: 'radial-gradient(ellipse at 50% 0%, #0D1E35 0%, #060E1E 60%)', padding: '20px 0' }}>
      <div style={phoneFrame}>
        {/* Status bar */}
        <div style={{
          height: 44, background: 'rgba(6,14,30,0.95)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 20px', flexShrink: 0,
          borderBottom: '1px solid rgba(255,255,255,0.04)',
        }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#F0F4FF', fontFamily: 'Inter, sans-serif' }}>
            {new Date().getHours().toString().padStart(2, '0')}:{new Date().getMinutes().toString().padStart(2, '0')}
          </span>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 1.5 }}>
              {[4, 6, 8, 10].map((h, i) => (
                <div key={i} style={{ width: 3, height: h, background: '#F0F4FF', borderRadius: 1, opacity: i < 4 ? 1 : 0.3 }} />
              ))}
            </div>
            <span style={{ fontSize: 11, color: '#F0F4FF', fontFamily: 'Inter, sans-serif' }}>4G</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <div style={{ width: 20, height: 10, border: '1.5px solid rgba(255,255,255,0.5)', borderRadius: 2, padding: '1.5px', display: 'flex' }}>
                <div style={{ width: '78%', background: '#3DBE62', borderRadius: 1 }} />
              </div>
            </div>
          </div>
        </div>

        {/* Back button for aux screens */}
        {!NAV_SCREENS.includes(screen as NavScreen) && (
          <button onClick={() => setScreen('home')} style={{
            position: 'absolute', top: 52, left: 12, zIndex: 100,
            background: 'rgba(17,30,53,0.9)', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 20, padding: '6px 12px', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 6,
            backdropFilter: 'blur(12px)',
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="#F0F4FF" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <span style={{ fontSize: 12, color: '#F0F4FF', fontFamily: 'Inter, sans-serif', fontWeight: 500 }}>Back</span>
          </button>
        )}

        {/* Screen content */}
        <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
          {renderScreen()}
        </div>

        {/* Bottom nav — only on main screens */}
        {NAV_SCREENS.includes(screen as NavScreen) && (
          <BottomNav active={activeTab} onNav={navigate} />
        )}
      </div>
    </div>
  )
}

const phoneFrame: React.CSSProperties = {
  width: 390,
  height: 844,
  borderRadius: 48,
  background: '#060E1E',
  border: '1px solid rgba(255,255,255,0.08)',
  boxShadow: '0 40px 120px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.04), inset 0 1px 0 rgba(255,255,255,0.06)',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  position: 'relative',
  flexShrink: 0,
}
