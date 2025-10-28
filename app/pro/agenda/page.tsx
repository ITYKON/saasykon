"use client"
 
import { useState } from "react"
import { Plus, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Checkbox } from "@/components/ui/checkbox"

export default function ProAgenda() {
  // Single-day agenda view with employee columns
  const [view, setView] = useState<"day" | "week" | "month">("day")
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([])
  const [search, setSearch] = useState("")
  const [step, setStep] = useState<15 | 30>(15)
  const [createOpen, setCreateOpen] = useState(false)
  const [availabilityOpen, setAvailabilityOpen] = useState(false)
  const [hideEmpty, setHideEmpty] = useState(false)

  const dateTitle = new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  }).format(currentDate)
  const times = [
    "08:00",
    "09:00",
    "10:00",
    "11:00",
    "12:00",
    "13:00",
    "14:00",
    "15:00",
    "16:00",
    "17:00",
    "18:00",
  ]

  // --- Month view data mocks & utils ---
  type MonthEvent = { time?: string; title: string; color: string }
  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`)
  const fmtKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
  const palette = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#06b6d4", "#8b5cf6", "#0ea5e9", "#84cc16"]
  // Generate a few deterministic fake events per day for month view visualization
  const getMonthEvents = (visibleDays: Date[]): Record<string, MonthEvent[]> => {
    const out: Record<string, MonthEvent[]> = {}
    visibleDays.forEach((d) => {
      const key = fmtKey(d)
      const seed = d.getDate() + d.getMonth() * 31
      // Ensure at least 1 event per day; sometimes overflow to demo '+X autres'
      let count = (seed % 3) + 1 // 1..3 events
      if (seed % 5 === 0) count += 3 // some days have 4-6 events
      const list: MonthEvent[] = []
      for (let i = 0; i < count; i++) {
        const color = palette[(seed + i) % palette.length]
        const hh = 9 + ((seed + i) % 8) // between 9..16
        const time = `${pad(hh)}:${i % 2 === 0 ? "00" : "30"}`
        list.push({ time, title: `RDV ${i + 1}`, color })
      }
      out[key] = list
    })
    return out
  }

  // Date helpers (placed here so they are available to mocks below)
  const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n)
  const addMonths = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth() + n, 1)

  // All-day events (for Week and Month views)
  type AllDayEvent = { start: Date; end: Date; title: string; color: string }
  const sampleAllDay: AllDayEvent[] = [
    // Spans Tue→Thu of current week
    { start: addDays(currentDate, -((currentDate.getDay() || 7) - 2)), end: addDays(currentDate, -((currentDate.getDay() || 7) - 4)), title: "Formation équipe", color: "#0ea5e9" },
    // Single day on Fri
    { start: addDays(currentDate, -((currentDate.getDay() || 7) - 5)), end: addDays(currentDate, -((currentDate.getDay() || 7) - 5)), title: "Audit interne", color: "#f97316" },
  ]

  type Appointment = {
    start: string // HH:mm
    end: string   // HH:mm
    title: string
    notes?: string
    span?: number // number of time slots tall
    color?: string
  }

  type Employee = {
    name: string
    avatar: string
    slots: Array<Appointment | null>
  }

  // Mock data to mirror the screenshot
  const employees: Employee[] = [
    {
      name: "Jean Charles",
      avatar: "https://i.pravatar.cc/48?img=3",
      slots: [
        { start: "10:00", end: "11:00", title: "Coupe + Barbe + Soin complet", color: "#3b82f6" },
        { start: "11:00", end: "12:00", title: "Coupe + Barbe + Soin complet + Épilation complète", color: "#10b981" },
        null,
        { start: "14:00", end: "15:00", title: "Coupe ciseau + Barbe + Shampoing + Coiffage", color: "#ef4444" },
        { start: "15:00", end: "16:00", title: "Coupe + Taille barbe simple (tondeuse)", color: "#f59e0b" },
        null,
        null,
      ],
    },
    {
      name: "Julie",
      avatar: "https://i.pravatar.cc/48?img=5",
      slots: [
        { start: "10:00", end: "10:45", title: "Coupe homme", color: "#06b6d4" },
        null,
        { start: "11:00", end: "13:00", title: "Couleur • Shampoing Coupe Brushing • Cheveux Longs", color: "#8b5cf6" },
        null,
        { start: "15:00", end: "16:00", title: "Coloration Sans Ammoniaque • Shampoing Brushing", color: "#22c55e" },
        null,
        null,
      ],
    },
    {
      name: "Marc",
      avatar: "https://i.pravatar.cc/48?img=8",
      slots: [
        { start: "10:00", end: "11:00", title: "Taille de barbe et contours tondeuse", color: "#f97316" },
        { start: "11:00", end: "13:00", title: "Taille de barbe et contours rasoir", color: "#0ea5e9" },
        null,
        { start: "14:00", end: "15:00", title: "Rasage de crâne et/ou barbe à l'ancienne", color: "#84cc16" },
        { start: "15:00", end: "16:00", title: "Taille de barbe", color: "#e11d48" },
        null,
        null,
      ],
    },
  ]

  // Config for time-grid (Google Calendar-like)
  const hourHeight = 44 // px per hour (more compact)
  const pxPerMinute = hourHeight / 60
  const workingStart = 9 // 09:00
  const workingEnd = 18 // 18:00

  const toMinutes = (hhmm: string) => {
    const [h, m] = hhmm.split(":" ).map(Number)
    return h * 60 + m
  }
  const rangeMinutes = (start: number, end: number, step: number) => {
    const out: number[] = []
    for (let t = start; t <= end; t += step) out.push(t)
    return out
  }

  // Overlap layout: assign each event a column index and total columns for that cluster
  type Positioned = Appointment & { top: number; height: number; col: number; cols: number }
  function layoutEvents(apts: Appointment[]): Positioned[] {
    const items = apts
      .filter(Boolean as any)
      .map((a) => ({
        ...a,
        _start: toMinutes(a.start),
        _end: toMinutes(a.end),
      }))
      .sort((a, b) => a._start - b._start || a._end - b._end)

    const result: Positioned[] = []
    let active: Array<{ _end: number; col: number; id: number }> = []
    let nextCol = 0
    items.forEach((it, idx) => {
      // remove finished
      active = active.filter((x) => x._end > it._start)
      const used = new Set(active.map((x) => x.col))
      let col = 0
      while (used.has(col)) col++
      active.push({ _end: it._end, col, id: idx })
      const cols = Math.max(...active.map((x) => x.col)) + 1
      const top = (it._start - workingStart * 60) * pxPerMinute
      const height = Math.max(20, (it._end - it._start) * pxPerMinute)
      result.push({ ...it, top, height, col, cols })
      nextCol = Math.max(nextCol, cols)
    })
    // Normalize cols per cluster: recompute based on overlaps window (simple pass acceptable for mock)
    return result.map((r) => ({ ...r, cols: Math.max(r.cols, 1) }))
  }

  const onPrev = () => {
    if (view === "day") setCurrentDate(addDays(currentDate, -1))
    else if (view === "week") setCurrentDate(addDays(currentDate, -7))
    else setCurrentDate(addMonths(currentDate, -1))
  }
  const onNext = () => {
    if (view === "day") setCurrentDate(addDays(currentDate, 1))
    else if (view === "week") setCurrentDate(addDays(currentDate, 7))
    else setCurrentDate(addMonths(currentDate, 1))
  }

  const filteredEmployees = (list: Employee[]) => {
    const hasSelection = selectedEmployees.length > 0
    let base = hasSelection ? list.filter((e) => selectedEmployees.includes(e.name)) : list
    base = base.map((e) => ({
      ...e,
      slots: e.slots.map((s) => (s && search ? { ...s } : s)).filter((s) => {
        if (!s) return true
        if (!search) return true
        return s.title.toLowerCase().includes(search.toLowerCase())
      }) as Array<Appointment | null>,
    }))
    // Optionally hide employees with no visible items when search applied
    if (hideEmpty) {
      base = base.filter((e) => (e.slots as (Appointment | null)[]).some((s) => s))
    }
    return base
  }

  const renderDayView = () => {
    const startMin = workingStart * 60
    const endMin = workingEnd * 60
    const gridHours = rangeMinutes(startMin, endMin, 60).map((m) => `${pad(Math.floor(m / 60))}:00`)
    const gutter = 48
    const colMin = 180 // smaller min width to fit more columns
    return (
      <div className="bg-white rounded-xl p-3 border border-gray-200">
        {/* Header employees (compact) */}
        <div className="mb-2 overflow-x-auto">
          <div className="grid" style={{ gridTemplateColumns: `${gutter}px repeat(${filteredEmployees(employees).length}, minmax(${colMin}px, 1fr))` }}>
            <div></div>
            {filteredEmployees(employees).map((emp) => (
              <div key={emp.name} className="px-1">
                <div className="bg-white rounded-full shadow-sm border border-gray-200 px-2 py-0.5 inline-flex items-center gap-2">
                  <img src={emp.avatar} alt={emp.name} className="h-5 w-5 rounded-full object-cover" />
                  <span className="text-[11px] font-medium text-gray-900">{emp.name}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Time grid */}
        <div className="overflow-x-auto">
          <div className="grid" style={{ gridTemplateColumns: `${gutter}px repeat(${filteredEmployees(employees).length}, minmax(${colMin}px, 1fr))` }}>
            {/* gutter */}
            <div className="relative">
              <div style={{ height: (endMin - startMin) * pxPerMinute }} className="relative">
                {gridHours.map((label, i) => (
                  <div key={label} className="absolute left-0 right-0" style={{ top: i * hourHeight }}>
                    <div className="text-[10px] text-gray-500 pr-2 h-4 leading-4 text-right">{label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* columns per employee */}
            {filteredEmployees(employees).map((emp) => {
              const filtered = (emp.slots.filter(Boolean) as Appointment[])
              const events = layoutEvents(filtered)
              return (
                <div key={emp.name} className="px-1">
                  <div className="relative bg-white rounded border overflow-hidden" style={{ height: (endMin - startMin) * pxPerMinute }}>
                    {/* sticky header label for column */}
                    <div className="sticky top-0 z-10 pointer-events-none">
                      <div className="absolute left-1 top-1 text-[10px] bg-white/70 backdrop-blur px-1 rounded">{emp.name}</div>
                    </div>
                    {/* hour lines */}
                    {rangeMinutes(startMin, endMin - 60, 60).map((m, i) => (
                      <div key={m} className="absolute left-0 right-0 border-t border-gray-200" style={{ top: i * hourHeight }} />
                    ))}
                    {/* 15-min minor lines */}
                    {rangeMinutes(startMin + step, endMin - step, step).map((m) => (
                      <div key={m} className="absolute left-0 right-0 border-t border-gray-100" style={{ top: (m - startMin) * pxPerMinute }} />
                    ))}
                    {/* non-working stripes */}
                    {workingStart > 0 && (
                      <div className="absolute left-0 right-0 bg-gray-50/70" style={{ top: 0, height: Math.max(0, (Math.min(startMin, 24*60) - 0) * pxPerMinute) }} />
                    )}
                    {workingEnd < 24 && (
                      <div className="absolute left-0 right-0 bg-gray-50/70" style={{ top: (endMin - startMin) * pxPerMinute - Math.max(0, (24*60 - endMin) * pxPerMinute), height: Math.max(0, (24*60 - endMin) * pxPerMinute) }} />
                    )}
                    {/* events */}
                    {events.map((ev, i) => {
                      const widthPct = 100 / ev.cols
                      const leftPct = ev.col * widthPct
                      return (
                        <div
                          key={i}
                          className="absolute rounded-md shadow-sm border text-[11px] bg-white overflow-hidden"
                          style={{
                            top: ev.top,
                            left: `${leftPct}%`,
                            width: `calc(${widthPct}% - 2px)`,
                            height: ev.height,
                            borderLeft: `3px solid ${ev.color || '#3b82f6'}`,
                          }}
                        >
                          <div className="px-1.5 py-0.5">
                            <div className="text-[10px] text-gray-600 font-medium">{ev.start} - {ev.end}</div>
                            <div className="text-[11.5px] text-gray-900 leading-snug line-clamp-3">{ev.title}</div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  const getWeekDays = (d: Date) => {
    const day = d.getDay() || 7
    const monday = addDays(d, -day + 1)
    return Array.from({ length: 7 }, (_, i) => addDays(monday, i))
  }

  const renderWeekView = () => {
    const weekDays = getWeekDays(currentDate)
    const startMin = workingStart * 60
    const endMin = workingEnd * 60
    return (
      <div className="bg-white rounded-xl p-4 border border-gray-200">
        {/* Header days */}
        <div className="mb-2 grid" style={{ gridTemplateColumns: `72px repeat(${weekDays.length}, minmax(0, 1fr))` }}>
          <div></div>
          {weekDays.map((d, i) => (
            <div key={i} className="px-2">
              <div className={`flex items-center gap-2 ${fmtKey(d)===fmtKey(new Date())? 'text-black' : ''}`}>
                <div className="text-sm font-medium capitalize">{new Intl.DateTimeFormat('fr-FR',{ weekday:'short', day:'2-digit', month:'short'}).format(d)}</div>
              </div>
            </div>
          ))}
        </div>

        {/* All-day row with spanning events */}
        <div className="mb-3 grid items-stretch" style={{ gridTemplateColumns: `72px repeat(${weekDays.length}, minmax(0, 1fr))` }}>
          <div className="text-[11px] text-gray-500 pr-2 h-7 leading-7 text-right">Toute la journée</div>
          {/* All-day grid */}
          <div className="col-span-7 grid grid-cols-7 gap-px bg-gray-200 rounded-md overflow-hidden">
            {weekDays.map((d, i) => (
              <div key={i} className={`h-7 bg-white ${[6,0].includes(d.getDay()) ? 'bg-gray-50' : ''}`} />
            ))}
          </div>
          {/* Bars positioned using CSS grid with col-span */}
          <div className="col-span-7 -mt-7 grid grid-cols-7 gap-0 pointer-events-none">
            {sampleAllDay.map((e, idx) => {
              // compute span within this week
              const startIdx = Math.max(0, weekDays.findIndex((d) => fmtKey(d) >= fmtKey(new Date(e.start.getFullYear(), e.start.getMonth(), e.start.getDate()))))
              const endIdx = Math.min(6, weekDays.findIndex((d) => fmtKey(d) >= fmtKey(new Date(e.end.getFullYear(), e.end.getMonth(), e.end.getDate()))) )
              const from = Math.max(0, weekDays.findIndex((d)=> d.toDateString() === new Date(e.start).toDateString()))
              const to = Math.max(from, weekDays.findIndex((d)=> d.toDateString() === new Date(e.end).toDateString()))
              const colStart = (from === -1 ? 0 : from) + 1
              const span = (to === -1 ? 6 : to) - (from === -1 ? 0 : from) + 1
              return (
                <div key={idx} className="h-7 px-1" style={{ gridColumn: `${colStart} / span ${span}` }}>
                  <div className="pointer-events-auto h-full rounded-md text-xs flex items-center px-2 shadow-sm" style={{ background: e.color, color: 'white' }}>
                    {e.title}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="grid" style={{ gridTemplateColumns: `72px repeat(${weekDays.length}, minmax(0, 1fr))` }}>
          {/* gutter */}
          <div className="relative">
            <div style={{ height: (endMin - startMin) * pxPerMinute }} className="relative">
              {rangeMinutes(startMin, endMin - 60, 60).map((m, i) => (
                <div key={m} className="absolute left-0 right-0" style={{ top: i * hourHeight }}>
                  <div className="text-[11px] text-gray-500 pr-2 h-4 leading-4 text-right">{pad(Math.floor(m/60))}:00</div>
                </div>
              ))}
            </div>
          </div>

          {/* day columns */}
          {weekDays.map((d, dayIdx) => {
            // create timed fake events for each day
            const seed = d.getDate() + d.getMonth() * 31
            const timed: Appointment[] = []
            const make = (s: number, e: number, idx: number) => ({ start: `${pad(Math.floor(s/60))}:${pad(s%60)}`, end: `${pad(Math.floor(e/60))}:${pad(e%60)}`, title: `Client ${idx+1}`, color: palette[(seed + idx) % palette.length] })
            if (seed % 2 === 0) timed.push(make(10*60, 11*60, 0))
            if (seed % 3 !== 0) timed.push(make(11*60 + 15, 12*60, 1))
            if (seed % 5 !== 0) timed.push(make(14*60, 15*60, 2))
            if (seed % 7 === 0) timed.push(make(15*60, 16*60, 3))
            const positioned = layoutEvents(timed)
            return (
            <div key={dayIdx} className="px-2">
              <div className={`relative rounded-md border overflow-hidden ${[6,0].includes(d.getDay()) ? 'bg-gray-50' : 'bg-white'}`} style={{ height: (endMin - startMin) * pxPerMinute }}>
                {/* hour lines */}
                {rangeMinutes(startMin, endMin - 60, 60).map((m, i) => (
                  <div key={m} className="absolute left-0 right-0 border-t border-gray-200" style={{ top: i * hourHeight }} />
                ))}
                {rangeMinutes(startMin + step, endMin - step, step).map((m) => (
                  <div key={m} className="absolute left-0 right-0 border-t border-gray-100" style={{ top: (m - startMin) * pxPerMinute }} />
                ))}
                {/* Current time indicator if today */}
                {fmtKey(d) === fmtKey(new Date()) && (
                  <div className="absolute left-0 right-0" style={{ top: (toMinutes(new Date().getHours()+":"+pad(new Date().getMinutes())) - startMin) * pxPerMinute }}>
                    <div className="h-px bg-red-500"></div>
                    <div className="w-2 h-2 bg-red-500 rounded-full -mt-1"></div>
                  </div>
                )}
                {/* fake events */}
                {positioned.map((ev, i) => {
                  const widthPct = 100 / ev.cols
                  const leftPct = ev.col * widthPct
                  return (
                    <div
                      key={i}
                      className="absolute rounded-md shadow-sm border text-[11px] bg-white overflow-hidden"
                      style={{
                        top: ev.top,
                        left: `${leftPct}%`,
                        width: `calc(${widthPct}% - 3px)`,
                        height: ev.height,
                        borderLeft: `3px solid ${ev.color || '#3b82f6'}`,
                      }}
                    >
                      <div className="px-2 py-1">
                        <div className="text-[10px] text-gray-600 font-medium">{ev.start} - {ev.end}</div>
                        <div className="text-[12px] text-gray-900 leading-snug">{ev.title}</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )})}
        </div>
      </div>
    )
  }

  const getMonthMatrix = (d: Date) => {
    const first = new Date(d.getFullYear(), d.getMonth(), 1)
    const startDay = (first.getDay() || 7) - 1
    const start = addDays(first, -startDay)
    return Array.from({ length: 42 }, (_, i) => addDays(start, i))
  }

  const renderMonthView = () => {
    const days = getMonthMatrix(currentDate)
    const month = currentDate.getMonth()
    const todayKey = fmtKey(new Date())
    const maxVisible = 3 // show up to 3 events per day cell
    const monthEvents = getMonthEvents(days)

    return (
      <div className="bg-white rounded-xl p-4 border border-gray-200">
        {/* Weekday header */}
        <div className="grid grid-cols-7 gap-0">
          {["Lun","Mar","Mer","Jeu","Ven","Sam","Dim"].map((n) => (
            <div key={n} className="text-[11px] font-medium text-gray-500 text-center py-2 uppercase tracking-wide">
              {n}
            </div>
          ))}
        </div>

        {/* Month grid */}
        <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-lg overflow-hidden">
          {days.map((d, idx) => {
            const key = fmtKey(d)
            const isOther = d.getMonth() !== month
            const isToday = key === todayKey
            const evts = monthEvents[key] ?? []
            const visible = evts.slice(0, maxVisible)
            const overflow = Math.max(0, evts.length - visible.length)

            return (
              <div
                key={key}
                className={`min-h-28 bg-white ${isOther ? "bg-gray-50" : "bg-white"} ${[5,6].includes(new Date(d).getDay()) ? 'bg-gray-50' : ''}`}
              >
                <div className="h-full p-2">
                  {/* Day number */}
                  <div className="flex items-center justify-between">
                    <button
                      className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        isToday ? "bg-black text-white" : isOther ? "text-gray-400" : "text-gray-700"
                      }`}
                      onClick={() => {
                        setCurrentDate(new Date(d.getFullYear(), d.getMonth(), d.getDate()))
                        setView("day")
                      }}
                    >
                      {d.getDate()}
                    </button>
                  </div>

                  {/* Events */}
                  <div className="mt-2 space-y-1">
                    {visible.map((e, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-2 rounded-md border px-2 py-1 text-xs shadow-sm hover:bg-gray-50 cursor-pointer"
                      >
                        <span className="h-3 w-1.5 rounded-sm" style={{ backgroundColor: e.color }} />
                        <div className="truncate text-gray-800">
                          {e.time ? `${e.time} ` : ""}{e.title}
                        </div>
                      </div>
                    ))}
                    {overflow > 0 && (
                      <button
                        className="text-[11px] text-blue-600 hover:underline"
                        onClick={() => {
                          setCurrentDate(new Date(d.getFullYear(), d.getMonth(), d.getDate()))
                          setView("day")
                        }}
                      >
                        +{overflow} autres
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <div className="bg-white border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            {/* Left: navigation + date */}
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" className="rounded-lg" onClick={onPrev}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" className="rounded-lg" onClick={() => setCurrentDate(new Date())}>Aujourd'hui</Button>
              <Button variant="outline" size="icon" className="rounded-lg" onClick={onNext}>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <h2 className="ml-3 text-xl font-semibold text-black capitalize">{dateTitle}</h2>
            </div>

            {/* Right: view switch + filters popover + primary action */}
            <div className="flex items-center gap-2">
              <div className="bg-gray-100 rounded-lg p-1 inline-flex">
                <Button variant={view === "day" ? "default" : "ghost"} className="rounded-md px-3" onClick={() => setView("day")}>Jour</Button>
                <Button variant={view === "week" ? "default" : "ghost"} className="rounded-md px-3" onClick={() => setView("week")}>Semaine</Button>
                <Button variant={view === "month" ? "default" : "ghost"} className="rounded-md px-3" onClick={() => setView("month")}>Mois</Button>
              </div>

              {/* Filters collapsed */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="rounded-lg px-3">
                    Filtres
                    {(selectedEmployees.length>0 || search || step !== 15 || hideEmpty) && (
                      <span className="ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-black text-white text-[10px] px-1">
                        {Number(selectedEmployees.length>0) + Number(Boolean(search)) + Number(step !== 15) + Number(hideEmpty)}
                      </span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-80">
                  <div className="space-y-3">
                    <div className="text-sm font-medium">Filtres</div>
                    <div className="space-y-2">
                      <div className="text-xs text-gray-600">Employés</div>
                      <div className="max-h-40 overflow-auto rounded border p-2">
                        {employees.map((e) => {
                          const checked = selectedEmployees.includes(e.name)
                          return (
                            <label key={e.name} className="flex items-center gap-2 py-1">
                              <Checkbox checked={checked} onCheckedChange={(v)=>{
                                setSelectedEmployees((prev)=>{
                                  const on = Boolean(v)
                                  if (on && !prev.includes(e.name)) return [...prev, e.name]
                                  if (!on) return prev.filter((x)=>x!==e.name)
                                  return prev
                                })
                              }} />
                              <span className="text-sm">{e.name}</span>
                            </label>
                          )
                        })}
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={()=>setSelectedEmployees(employees.map(e=>e.name))}>Tout</Button>
                        <Button size="sm" variant="outline" onClick={()=>setSelectedEmployees([])}>Aucun</Button>
                      </div>
                    </div>
                    <Select value={String(step)} onValueChange={(v) => setStep(Number(v) as 15 | 30)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Pas" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectItem value="15">Pas 15 min</SelectItem>
                          <SelectItem value="30">Pas 30 min</SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                    <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher..." />
                    <label className="flex items-center gap-2 text-sm">
                      <Checkbox checked={hideEmpty} onCheckedChange={(v)=>setHideEmpty(Boolean(v))} />
                      Masquer les colonnes vides
                    </label>
                    <div className="flex justify-end">
                      <Button variant="outline" size="sm" onClick={() => { setSelectedEmployees([]); setSearch(''); setStep(15); setHideEmpty(false); }}>Réinitialiser</Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>

              <Button className="bg-black text-white hover:bg-gray-800 rounded-lg px-4" onClick={() => setCreateOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Nouveau rendez-vous
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        {view === "day" && renderDayView()}
        {view === "week" && renderWeekView()}
        {view === "month" && renderMonthView()}
      </div>

      {/* Create appointment dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouveau rendez-vous</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select>
              <SelectTrigger><SelectValue placeholder="Employé" /></SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {employees.map((e) => (<SelectItem key={e.name} value={e.name}>{e.name}</SelectItem>))}
                </SelectGroup>
              </SelectContent>
            </Select>
            <Input placeholder="Client" />
            <Input type="time" defaultValue="10:00" />
            <Input type="time" defaultValue="11:00" />
            <Input placeholder="Service / Notes" className="sm:col-span-2" />
          </div>
          <DialogFooter>
            <Button onClick={() => setCreateOpen(false)}>Enregistrer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Availability dialog */}
      <Dialog open={availabilityOpen} onOpenChange={setAvailabilityOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Gérer les disponibilités</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Select>
              <SelectTrigger><SelectValue placeholder="Employé" /></SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {employees.map((e) => (<SelectItem key={e.name} value={e.name}>{e.name}</SelectItem>))}
                </SelectGroup>
              </SelectContent>
            </Select>
            <Input type="date" />
            <Select>
              <SelectTrigger><SelectValue placeholder="Statut" /></SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="open">Disponible</SelectItem>
                  <SelectItem value="closed">Fermé</SelectItem>
                  <SelectItem value="break">Pause</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button onClick={() => setAvailabilityOpen(false)}>Enregistrer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
