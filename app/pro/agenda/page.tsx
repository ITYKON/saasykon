"use client";

import { useState, useEffect, useMemo } from "react";
import { Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import CreateReservationModal from "@/components/pro/CreateReservationModal";

type Appointment = {
  start: string; // HH:mm
  end: string; // HH:mm
  title: string;
  color?: string;
  client?: string;
  clientPhone?: string;
  employee?: string;
  _start?: number; // internal use
  _end?: number; // internal use
  durationMin?: number;
};

type Employee = {
  name: string;
  avatar: string;
  slots: Array<Appointment | null>;
};

type MonthEvent = {
  time?: string;
  title: string;
  color?: string;
  employee?: string;
  service?: string;
  durationMin?: number;
  priceDA?: number;
  client?: string;
  clientPhone?: string;
};

// Hook personnalisé pour le debounce
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default function ProAgenda() {
  // Single-day agenda view with employee columns
  const [view, setView] = useState<"day" | "week" | "month">("day")
  
  // Valeurs debouncées pour éviter les appels API trop fréquents (déclarées plus bas)
;
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [servicesText, setServicesText] = useState<string>(""); // Déclaration manquante ajoutée
  const [step, setStep] = useState<15 | 30>(15);
  const [availabilityOpen, setAvailabilityOpen] = useState(false);
  const [hideEmpty, setHideEmpty] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [servicesOptions, setServicesOptions] = useState<string[]>([]);
  const [categoriesOptions, setCategoriesOptions] = useState<string[]>([]);
  const [openEmp, setOpenEmp] = useState<boolean>(true);
  const [openSvc, setOpenSvc] = useState<boolean>(true);
  const [openCat, setOpenCat] = useState<boolean>(true);

  // Prefill reservation modal controls
  const [prefillDate, setPrefillDate] = useState<string>(""); // yyyy-mm-dd
  const [prefillTime, setPrefillTime] = useState<string>(""); // HH:mm
  const [prefillEmployeeId, setPrefillEmployeeId] = useState<
    string | "none" | undefined
  >("none");
  const [openSignal, setOpenSignal] = useState<number>(0);
  const [refreshKey, setRefreshKey] = useState<number>(0);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  useEffect(() => {
    const mql = window.matchMedia("(max-width: 767px)");
    const apply = () => setIsMobile(mql.matches);
    apply();
    mql.addEventListener("change", apply);
    return () => mql.removeEventListener("change", apply);
  }, []);

  // Real employees for mapping name -> id (used only to prefill modal)
  const [empMap, setEmpMap] = useState<Record<string, string>>({});
  // Live employees for Day view fetched from backend
  const [liveEmployees, setLiveEmployees] = useState<Employee[] | null>(null);
  // All employees from API to always render columns
  const [allEmployees, setAllEmployees] = useState<Employee[]>([]);
  // Live slots mapped by employee_id for robust overlay
  const [liveSlotsById, setLiveSlotsById] = useState<
    Record<string, Appointment[]>
  >({});
  const [liveSlotsByName, setLiveSlotsByName] = useState<
    Record<string, Appointment[]>
  >({});

  // Load real services for dropdown
  useEffect(() => {
    fetch(`/api/pro/filters/services`)
      .then((r) => r.json())
      .then((data) => setServicesOptions(data.services || []))
      .catch(() => setServicesOptions([]));
  }, []);

  // Load real categories for dropdown
  useEffect(() => {
    fetch(`/api/pro/filters/categories`)
      .then((r) => r.json())
      .then((data) => setCategoriesOptions(data.categories || []))
      .catch(() => setCategoriesOptions([]));
  }, []);
  // Live data for Week and Month
  const [liveWeekDays, setLiveWeekDays] = useState<Record<
    string,
    Appointment[]
  > | null>(null);
  const [liveMonthDays, setLiveMonthDays] = useState<Record<
    string,
    MonthEvent[]
  > | null>(null);

  // Month day events dialog
  const [dayListOpen, setDayListOpen] = useState(false);
  const [dayListDate, setDayListDate] = useState<Date | null>(null);
  const [dayListEvents, setDayListEvents] = useState<MonthEvent[]>([]);

  // Event details dialog
  type EventDetail = {
    dateStr: string;
    time?: string;
    title: string;
    employee?: string;
    service?: string;
    durationMin?: number;
    priceDA?: number;
    color?: string;
    client?: string;
    clientPhone?: string;
  };
  const [detailOpen, setDetailOpen] = useState(false);
  const [detail, setDetail] = useState<EventDetail | null>(null);
  const norm = (s: string | undefined) => (s || '').toLowerCase().trim()

  // Color palette and mapping per employee (stable by order)
  const palette = ['#2563eb','#16a34a','#ea580c','#9333ea','#e11d48','#0ea5e9','#f59e0b','#22c55e','#8b5cf6','#ef4444']
  const colorMap = useMemo(() => {
    const map: Record<string,string> = {}
    const base = (allEmployees.length > 0 ? allEmployees : [])
    base.forEach((e, i) => { map[norm(e.name)] = palette[i % palette.length] })
    return map
  }, [allEmployees])


  useEffect(() => {
    fetch(`/api/pro/employees?limit=200`)
      .then((r) => r.json())
      .then((j) => {
        const map: Record<string, string> = {};
        const list: Employee[] = [];
        (j.items || []).forEach((e: any) => {
          const name =
            e.full_name ||
            [e.first_name, e.last_name].filter(Boolean).join(" ");
          if (name) map[norm(name)] = e.id;
          if (name)
            list.push({
              name,
              avatar: e.avatar_url || e.avatar || "https://i.pravatar.cc/48",
              slots: [],
            });
        });
        setEmpMap(map);
        setAllEmployees(list);
      })
      .catch(() => {});
  }, []);


  // Valeurs debounced pour éviter les appels API trop fréquents
  const debouncedSearch = useDebounce(search, 500);
  const debouncedDate = useDebounce(currentDate, 300);

  // Fetch Day agenda from backend and map to Employee[] used by the grid
  useEffect(() => {
    let throttleTimeout: NodeJS.Timeout | null = null;

    const fetchData = () => {

      const toDateStr = (d: Date) =>
        `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, "0")}-${d
          .getDate()
          .toString()
          .padStart(2, "0")}`;

      const hhmm = (iso: string) => {
        const dt = new Date(iso);
        return `${dt.getHours().toString().padStart(2, "0")}:${dt
          .getMinutes()
          .toString()
          .padStart(2, "0")}`;
      };
      const addMinutesHHMM = (
        iso: string,
        mins?: number,
        fallbackIso?: string
      ) => {
        if (typeof mins === "number" && isFinite(mins) && mins > 0) {
          const dt = new Date(iso);
          if (!isNaN(dt.getTime())) {
            dt.setMinutes(dt.getMinutes() + mins);
            return `${dt.getHours().toString().padStart(2, "0")}:${dt
              .getMinutes()
              .toString()
              .padStart(2, "0")}`;
          }
        }
        if (fallbackIso) return hhmm(fallbackIso);
        return hhmm(iso);
      };

      const qs = new URLSearchParams({
        date: toDateStr(debouncedDate || currentDate),
        status: "CONFIRMED",
      });

      // Obtenir les IDs des employés
      const mappedEmployees = selectedEmployees
        .map((n) => empMap[norm(n)])
        .filter(Boolean) as string[];

      if (mappedEmployees.length > 0) {
        mappedEmployees.forEach((id) => qs.append("employee_id", id));
      }

      if (selectedCategories.length > 0) {
        selectedCategories.forEach((c) => qs.append("category", c));
      }

      if (selectedServices.length > 0) {
        selectedServices.forEach((s) => qs.append("service", s));
      }

      if (debouncedSearch) {
        qs.set("search", debouncedSearch);
      }

      // Exécuter la requête avec un délai
      if (throttleTimeout) {
        clearTimeout(throttleTimeout);
      }

      throttleTimeout = setTimeout(() => {
        fetch(`/api/pro/agenda/day?${qs.toString()}`)
          .then((r) => r.json())
          .then((data) => {
            const liveMap: Record<string, Appointment[]> = {};
            const liveByName: Record<string, Appointment[]> = {};
            const emps: Employee[] = (data.employees || []).map((e: any) => {
              const slots: Appointment[] = (e.items || []).map((it: any) => ({
                start: hhmm(it.start),
                end: addMinutesHHMM(it.start, Number(it.duration_minutes), it.end),
                title: it.title || 'Rendez-vous',
                color: '#3b82f6',
                client: it.client || undefined,
                clientPhone: it.client_phone || undefined,
                employee: e.employee_name || undefined,
                durationMin: typeof it.duration_minutes !== 'undefined' ? Number(it.duration_minutes) : undefined,
              }));
              if (e.employee_id) liveMap[e.employee_id] = slots;
              if (e.employee_name) liveByName[norm(e.employee_name)] = slots;
              return { name: e.employee_name || 'Aucun', avatar: e.avatar_url || e.avatar || 'https://i.pravatar.cc/48', slots };
            });

            setLiveEmployees(emps);
            setLiveSlotsById(liveMap);
            setLiveSlotsByName(liveByName);

            // Update empMap from response if ids are present
            const map: Record<string, string> = {};
            (data.employees || []).forEach((e: any) => {
              if (e.employee_id && e.employee_name) map[norm(e.employee_name)] = e.employee_id;
            });
            if (Object.keys(map).length) setEmpMap((prev) => ({ ...prev, ...map }));
          })
          .catch(() => {
            setLiveEmployees(null);
          });
      }, 1000); // Délai d'une seconde entre les appels
    };

    fetchData();

    // Nettoyage lors du démontage du composant
    return () => {
      if (throttleTimeout) {
        clearTimeout(throttleTimeout);
      }
    };
  }, [debouncedDate, selectedEmployees, selectedCategories, selectedServices, debouncedSearch]); 
  // Fetch Week agenda
  useEffect(() => {
    const toDateStr = (d: Date) =>
      `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, "0")}-${d
        .getDate()
        .toString()
        .padStart(2, "0")}`;
    const hhmm = (iso: string) => {
      const dt = new Date(iso);
      return `${dt.getHours().toString().padStart(2, "0")}:${dt
        .getMinutes()
        .toString()
        .padStart(2, "0")}`;
    };
    const addMinutesHHMM = (
      iso: string,
      mins?: number,
      fallbackIso?: string
    ) => {
      if (typeof mins === "number" && isFinite(mins) && mins > 0) {
        const dt = new Date(iso);
        if (!isNaN(dt.getTime())) {
          dt.setMinutes(dt.getMinutes() + mins);
          return `${dt.getHours().toString().padStart(2, "0")}:${dt
            .getMinutes()
            .toString()
            .padStart(2, "0")}`;
        }
      }
      if (fallbackIso) return hhmm(fallbackIso);
      return hhmm(iso);
    };
    const qs = new URLSearchParams({
      date: toDateStr(currentDate),
      status: "CONFIRMED",
    });
    selectedEmployees
      .map((n) => empMap[n])
      .filter(Boolean)
      .forEach((id) => qs.append("employee_id", id as string));
    selectedCategories.forEach((c) => qs.append("category", c));
    if (search) qs.set("search", search);
    fetch(`/api/pro/agenda/week?${qs.toString()}`)
      .then((r) => r.json())
      .then((data) => {
        const map: Record<string, Appointment[]> = {};
        (data.days || []).forEach((day: any) => {
          const items: Appointment[] = [];
          (day.employees || []).forEach((e: any) => {
            (e.items || []).forEach((it: any) => {
              items.push({
                start: hhmm(it.start),
                end: addMinutesHHMM(it.start, Number(it.duration_minutes), it.end),
                title: it.title || "Rendez-vous",
                color: "#3b82f6",
                client: it.client || undefined,
                clientPhone: it.client_phone || undefined,
                employee: e.employee_name || undefined,
                durationMin: typeof it.duration_minutes !== 'undefined' ? Number(it.duration_minutes) : undefined,
              });
            });
          });
          map[day.date] = items;
        });
        setLiveWeekDays(map);
      })
      .catch(() => setLiveWeekDays(null));
  }, [
    currentDate,
    selectedEmployees,
    selectedCategories,
    selectedServices,
    search,
    empMap,
    refreshKey,
  ]);

  // Fetch Month agenda
  useEffect(() => {
    const toDateStr = (d: Date) =>
      `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, "0")}-${d
        .getDate()
        .toString()
        .padStart(2, "0")}`;
    const qs = new URLSearchParams({
      date: toDateStr(currentDate),
      status: "CONFIRMED",
    });
    selectedEmployees
      .map((n) => empMap[n])
      .filter(Boolean)
      .forEach((id) => qs.append("employee_id", id as string));
    selectedCategories.forEach((c) => qs.append("category", c));
    if (search) qs.set("search", search);
    fetch(`/api/pro/agenda/month?${qs.toString()}`)
      .then((r) => r.json())
      .then((data) => {
        setLiveMonthDays(data.days || null);
      })
      .catch(() => setLiveMonthDays(null));
  }, [
    currentDate,
    selectedEmployees,
    selectedCategories,
    search,
    empMap,
    refreshKey,
  ]);

  const dateTitle = new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  }).format(currentDate);
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
  ];

  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
  const fmtKey = (d: Date) =>
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  
  const addDays = (d: Date, n: number) =>
    new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
  const addMonths = (d: Date, n: number) =>
    new Date(d.getFullYear(), d.getMonth() + n, 1);

  const getMonthMatrix = (d: Date) => {
    const first = new Date(d.getFullYear(), d.getMonth(), 1);
    const startDay = (first.getDay() || 7) - 1;
    const start = addDays(first, -startDay);
    return Array.from({ length: 42 }, (_, i) => addDays(start, i));
  };

  // Config for time-grid (Google Calendar-like)
  const hourHeight = 62; // px per hour (more compact)
  const pxPerMinute = hourHeight / 60;
  const [workingStart, setWorkingStart] = useState<number>(9);
  const [workingEnd, setWorkingEnd] = useState<number>(17);
  const [workingStartMin, setWorkingStartMin] = useState<number>(9*60);
  const [workingEndMin, setWorkingEndMin] = useState<number>(17*60);

  // Sync working hours with business profile
  useEffect(() => {
    const fetchHours = async () => {
      try {
        const res = await fetch('/api/pro/business/profile');
        const data = await res.json();
        const wh = data?.business?.working_hours || {};
        const dayNames = ['dimanche','lundi','mardi','mercredi','jeudi','vendredi','samedi'];
        const key = dayNames[currentDate.getDay()];
        const today = wh[key];
        const parseMin = (hhmm: string) => {
          if (!hhmm || typeof hhmm !== 'string') return undefined as number | undefined;
          const [h, m] = hhmm.split(':').map((x: string) => parseInt(x, 10));
          if (Number.isNaN(h) || Number.isNaN(m)) return undefined;
          return h*60 + m;
        };
        const startM = parseMin(today?.debut);
        const endM = parseMin(today?.fin);
        if (typeof startM === 'number' && typeof endM === 'number' && endM > startM) {
          setWorkingStart(Math.floor(startM/60));
          setWorkingEnd(Math.floor(endM/60));
          setWorkingStartMin(startM);
          setWorkingEndMin(endM);
        }
      } catch {}
    };
    fetchHours();
  }, [currentDate]);

  const toMinutes = (hhmm: string) => {
    const [h, m] = hhmm.split(":").map(Number);
    return h * 60 + m;
  };
  const rangeMinutes = (start: number, end: number, step: number) => {
    const out: number[] = [];
    for (let t = start; t <= end; t += step) out.push(t);
    return out;
  };

  // Overlap layout: assign each event a column index and total columns for that cluster
  type Positioned = Appointment & {
    top: number;
    height: number;
    col: number;
    cols: number;
  };
  function layoutEvents(apts: Appointment[], baseStartMin?: number): Positioned[] {
    const items = apts
      .filter(Boolean as any)
      .map((a) => ({
        ...a,
        _start: toMinutes(a.start),
        _end: toMinutes(a.end),
      }))
      .sort((a, b) => a._start - b._start || a._end - b._end);

    const result: Positioned[] = [];
    let active: Array<{ _end: number; col: number; id: number }> = [];
    let nextCol = 0;
    items.forEach((it, idx) => {
      // remove finished
      active = active.filter((x) => x._end > it._start);
      const used = new Set(active.map((x) => x.col));
      let col = 0;
      while (used.has(col)) col++;
      active.push({ _end: it._end, col, id: idx });
      const cols = Math.max(...active.map((x) => x.col)) + 1;
      const base = typeof baseStartMin === 'number' ? baseStartMin : workingStartMin;
      const top = (it._start - base) * pxPerMinute;
      const height = Math.max(20, (it._end - it._start) * pxPerMinute);
      result.push({ ...it, top, height, col, cols });
      nextCol = Math.max(nextCol, cols);
    });
    // Normalize cols per cluster: recompute based on overlaps window (simple pass acceptable for mock)
    return result.map((r) => ({ ...r, cols: Math.max(r.cols, 1) }));
  }

  const onPrev = () => {
    if (view === "day") setCurrentDate(addDays(currentDate, -1));
    else if (view === "week") setCurrentDate(addDays(currentDate, -7));
    else setCurrentDate(addMonths(currentDate, -1));
  };
  const onNext = () => {
    if (view === "day") setCurrentDate(addDays(currentDate, 1));
    else if (view === "week") setCurrentDate(addDays(currentDate, 7));
    else setCurrentDate(addMonths(currentDate, 1));
  };

  const filteredEmployees = (list: Employee[]) => {
    const hasSelection = selectedEmployees.length > 0;
    let base = hasSelection
      ? list.filter((e) => selectedEmployees.includes(e.name))
      : list;
    base = base.map((e) => ({
      ...e,
      slots: e.slots
        .map((s) =>
          s && (search || selectedCategories.length > 0) ? { ...s } : s
        )
        .filter((s) => {
          if (!s) return true;
          const t = s.title.toLowerCase();
          const searchOk = !search || t.includes(search.toLowerCase());
          const catOk =
            selectedCategories.length === 0 ||
            selectedCategories.some((c) => t.includes(c.toLowerCase()));
          return searchOk && catOk;
        }) as Array<Appointment | null>,
    }));
    // Optionally hide employees with no visible items when search applied
    if (hideEmpty) {
      base = base.filter((e) =>
        (e.slots as (Appointment | null)[]).some((s) => s)
      );
    }
    return base;
  };

  const renderDayView = () => {
    const startMin = workingStartMin;
    const endMin = workingEndMin;
    const gridHours = rangeMinutes(startMin, endMin, 60).map(
      (m) => `${pad(Math.floor(m / 60))}:00`
    );
    const gutter = 48;
    const colMin = 180; // smaller min width to fit more columns

    const toDateStr = (d: Date) =>
      `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

    // Always render using real API employees only (no mock fallback)
    const base = allEmployees;
    const sourceEmployees: Employee[] = base.map((e) => {
      const id = empMap[norm(e.name)];
      let slots = id && liveSlotsById[id] ? liveSlotsById[id] : [];
      if ((!slots || slots.length === 0) && liveSlotsByName[norm(e.name)])
        slots = liveSlotsByName[norm(e.name)];
      return { ...e, slots };
    });

    if (isMobile) {
      return (
        <div className="bg-neutral-100 -mx-4 px-4 py-2 min-h-[calc(100vh-200px)]">
          {/* Main Horizontal Scroll Container */}
          <div className="overflow-x-auto no-scrollbar snap-x pb-6">
            {/* Shared Vertical Scroll Container */}
            <div className="overflow-y-auto no-scrollbar rounded-2xl overscroll-contain" style={{ height: `${(endMin - startMin) * pxPerMinute + 120}px` }}>
              <div className="flex gap-4 min-w-max px-8 scroll-px-8">
                {sourceEmployees.map((emp) => {
                  const filtered = emp.slots.filter(
                    (slot): slot is Appointment => slot !== null
                  );
                  const events = layoutEvents(filtered);
                  const gridHeight = (endMin - startMin) * pxPerMinute;

                  return (
                    <div key={emp.name} className="flex-none w-[calc(100vw-64px)] snap-center flex flex-col gap-2">
                      {/* Employee Header - Sticky Top */}
                      <div className="sticky top-0 z-20 bg-neutral-100/80 backdrop-blur-sm pb-1">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-3 flex items-center gap-3 active:scale-95 transition-transform cursor-pointer">
                          <div className="relative">
                            <div className="h-10 w-10 rounded-full bg-gray-50 overflow-hidden border-2 border-white shadow-sm flex items-center justify-center text-gray-600 font-bold text-sm uppercase">
                              {emp.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                            </div>
                            <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white shadow-sm" style={{ backgroundColor: colorMap[norm(emp.name)] || '#3b82f6' }} />
                          </div>
                          <div className="flex flex-col">
                            <span className="font-bold text-gray-900 text-sm">{emp.name}</span>
                            <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">{filtered.length} RDV • {Math.floor(workingStartMin / 60)}h - {Math.floor(workingEndMin / 60)}h</span>
                          </div>
                        </div>
                      </div>

                      {/* Column Grid Area (No internal scroll) */}
                      <div className="relative bg-white/50 rounded-2xl border border-gray-200/50 shadow-inner overflow-hidden">
                        <div className="relative" style={{ height: gridHeight + 60 }}>
                          {/* Background Time Lines */}
                          {rangeMinutes(startMin, endMin, 60).map((m, i) => (
                            <div
                              key={m}
                              className="absolute left-0 right-0 border-t border-gray-200/40"
                              style={{ top: i * hourHeight }}
                            >
                              <span className="absolute top-1 left-2 text-[10px] font-bold text-gray-400">
                                {pad(Math.floor(m / 60))}:00
                              </span>
                            </div>
                          ))}
                          
                          {/* Events */}
                          {events.map((ev, i) => (
                            <div
                              key={i}
                              className="absolute left-0 right-0 mx-2"
                              style={{
                                top: ev.top,
                                height: ev.height,
                                left: `${(ev.col * 100) / ev.cols}%`,
                                width: `${100 / ev.cols}%`,
                              }}
                            >
                              <div
                                className="h-full bg-white rounded-xl p-3 border border-gray-100 shadow-sm flex flex-col gap-1 overflow-hidden active:brightness-95 transition-all cursor-pointer group"
                                onClick={() => {
                                  setDetail({
                                    dateStr: toDateStr(currentDate),
                                    time: `${ev.start}-${ev.end}`,
                                    title: ev.title,
                                    color: ev.color,
                                    client: ev.client,
                                    clientPhone: ev.clientPhone,
                                    durationMin: ev.durationMin,
                                  });
                                  setDetailOpen(true);
                                }}
                              >
                                <div className="text-[13px] font-bold text-gray-800">
                                  {ev.start} - {ev.end}
                                </div>
                                <div className="text-[12px] font-bold text-gray-900 truncate">
                                  {ev.client || 'Client anonyme'}
                                </div>
                                <div className="text-[11px] text-gray-600 font-medium leading-tight">
                                  {ev.title}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Add Button */}
                      
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      );
    }

    const roundToStep = (m: number) => {
      const s = step;
      const r = Math.max(0, Math.min(m, endMin - startMin));
      const rel = Math.round(r / s) * s;
      return rel;
    };

    const openAt = (
      clientY: number,
      container: HTMLElement,
      empName?: string
    ) => {
      const rect = container.getBoundingClientRect();
      const y = clientY - rect.top;
      const minutesFromStart = y / pxPerMinute;
      const rounded = roundToStep(minutesFromStart);
      const total = startMin + rounded;
      const hh = Math.floor(total / 60);
      const mm = total % 60;
      setPrefillDate(toDateStr(currentDate));
      setPrefillTime(`${pad(hh)}:${pad(mm)}`);
      if (empName) setPrefillEmployeeId(empMap[norm(empName)] || "none");
      setOpenSignal((s) => s + 1);
    };

    return (
      <div className="bg-white rounded-xl p-3 border border-gray-200">
        {/* Time grid with synced employees header */}
        <div className="overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
          {/* Employees header chips - sticky at top */}
          <div className="grid sticky top-0 z-10 bg-white" style={{ gridTemplateColumns: `${gutter}px repeat(${sourceEmployees.length}, minmax(${colMin}px, 1fr))` }}>
            <div />
            {sourceEmployees.map((emp) => (
              <div key={emp.name} className="px-1 py-2">
                <div className="bg-white rounded-full shadow-sm border border-gray-200 px-2 py-0.5 inline-flex items-center gap-2">
                  <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: colorMap[norm(emp.name)] || '#3b82f6' }} />
                  <span className="text-[12px] font-medium text-gray-900">{emp.name}</span>
                  {Array.isArray(emp.slots) && emp.slots.filter(Boolean).length > 0 && (
                    <span className="ml-1 text-[10px] text-white bg-black/80 rounded-full px-1.5 py-0.5">
                      {emp.slots.filter(Boolean).length}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
          {/* Time grid */}
          <div className="grid" style={{ gridTemplateColumns: `${gutter}px repeat(${sourceEmployees.length}, minmax(${colMin}px, 1fr))` }}>
            {/* gutter */}
            <div className="relative">
              <div
                style={{ height: (endMin - startMin) * pxPerMinute }}
                className="relative"
              >
                {gridHours.map((label, i) => (
                  <div
                    key={label}
                    className="absolute left-0 right-0"
                    style={{ top: i * hourHeight }}
                  >
                    <div className="text-[12px] font-medium text-neutral-600 pr-2 h-5 leading-5 text-right">
                      {label}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* columns per employee */}
            {sourceEmployees.map((emp) => {
              const filtered = emp.slots.filter(
                (slot): slot is Appointment => slot !== null
              );
              const events = layoutEvents(filtered);
              return (
                <div key={emp.name} className="px-1">
                  <div
                    className="relative bg-white rounded border overflow-hidden cursor-crosshair"
                    style={{ height: (endMin - startMin) * pxPerMinute }}
                    onDoubleClick={(e) =>
                      openAt(
                        e.clientY,
                        e.currentTarget as unknown as HTMLElement,
                        emp.name
                      )
                    }
                  >
                    {/* background tint like mock */}
                    <div className="absolute inset-0 bg-stone-100" />
                    {/* hour lines */}
                    {rangeMinutes(startMin, endMin - 60, 60).map((m, i) => (
                      <div
                        key={m}
                        className="absolute left-0 right-0 border-t border-gray-200"
                        style={{ top: i * hourHeight }}
                      />
                    ))}
                    {/* 15-min minor lines */}
                    {rangeMinutes(startMin + step, endMin - step, step).map(
                      (m) => (
                        <div
                          key={m}
                          className="absolute left-0 right-0 border-t border-gray-100"
                          style={{ top: (m - startMin) * pxPerMinute }}
                        />
                      )
                    )}
                    {/* non-working stripes */}
                    {workingStartMin > 0 && (
                      <div
                        className="absolute left-0 right-0 bg-gray-50/70"
                        style={{
                          top: 0,
                          height: Math.max(0, (Math.min(startMin, 24 * 60) - 0) * pxPerMinute),
                        }}
                      />
                    )}
                    {/* Events */}
                    {events.map((ev, i) => (
                      <div
                        key={i}
                        className="absolute left-0 right-0 mx-1"
                        style={{
                          top: ev.top,
                          height: ev.height,
                          left: `${(ev.col * 100) / ev.cols}%`,
                          width: `${100 / ev.cols}%`,
                        }}
                      >
                        <div
                          className="h-full rounded px-2 py-1 overflow-hidden cursor-pointer"
                          style={{ backgroundColor: colorMap[norm(emp.name)] || ev.color || "#3b82f6" }}
                          onClick={() => {
                            setDetail({
                              dateStr: toDateStr(currentDate),
                              time: `${ev.start}-${ev.end}`,
                              title: ev.title,
                              color: ev.color,
                              client: ev.client,
                              clientPhone: ev.clientPhone,
                              durationMin: ev.durationMin,
                            });
                            setDetailOpen(true);
                          }}
                        >
                          <div className="text-[11px] font-medium text-white truncate">
                            {ev.client || 'Client'}
                          </div>
                          <div className="text-[11px] text-white/90 truncate">
                            {ev.title}
                          </div>
                          <div className="text-[10px] text-white italic truncate">
                            {ev.employee}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const getWeekDays = (d: Date) => {
    const day = d.getDay() || 7;
    const monday = addDays(d, -day + 1);
    return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
  };

  // Fonction pour formater l'heure au format 12h
  const formatTime12h = (time24: string) => {
    const [hours, minutes] = time24.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const hours12 = hours % 12 || 12;
    return `${hours12}:${minutes < 10 ? '0' + minutes : minutes} ${period}`;
  };

  const renderWeekView = () => {
    const weekDays = getWeekDays(currentDate);
    const today = new Date();
    const todayKey = fmtKey(today);
    
    // Pour la vue mobile, on prépare les événements par jour
    const mobileEventsByDay: Record<string, Appointment[]> = {};
    weekDays.forEach(day => {
      const key = fmtKey(day);
      mobileEventsByDay[key] = (liveWeekDays && liveWeekDays[key]) || [];
    });

    // Sur mobile, on affiche une vue liste au lieu d'une grille
    if (isMobile) {
      return (
        <div className="space-y-4">
          {/* En-tête avec la semaine */}
          <div className="flex items-center justify-between px-2 py-2 bg-white rounded-lg shadow-sm">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setCurrentDate(addDays(currentDate, -7))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="text-sm font-medium">
              {new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' }).format(currentDate)}
            </div>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setCurrentDate(addDays(currentDate, 7))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Liste des jours avec événements */}
          <div className="space-y-2">
            {weekDays.map((day, dayIdx) => {
              const dayKey = fmtKey(day);
              const isToday = dayKey === todayKey;
              const events = mobileEventsByDay[dayKey] || [];
              
              return (
                <div key={dayIdx} className="bg-white rounded-lg shadow-sm overflow-hidden">
                  <div className={`p-3 ${isToday ? 'bg-blue-50' : 'bg-white'}`}>
                    <div className="flex items-center">
                      <div className="text-center mr-3">
                        <div className="text-sm font-medium text-gray-500">
                          {new Intl.DateTimeFormat('fr-FR', { weekday: 'short' }).format(day)}
                        </div>
                        <div className={`text-lg font-bold ${isToday ? 'text-blue-600' : 'text-gray-900'}`}>
                          {day.getDate()}
                        </div>
                      </div>
                      <div className="flex-1">
                        {events.length > 0 ? (
                          <div className="space-y-2">
                            {events.map((event, eventIdx) => (
                              <div 
                                key={eventIdx}
                                className="p-2 rounded border-l-4 border-blue-500 bg-blue-50"
                              >
                                <div className="text-sm font-medium text-gray-900">{event.client || 'Client'}</div>
                                <div className="text-xs text-gray-700 font-medium mt-0.5">
                                  {event.employee}
                                </div>
                                <div className="text-xs text-gray-600 mt-0.5">
                                  {event.title}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="h-4"></div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    // Vue originale pour les écrans de bureau
    let minStart = workingStartMin;
    let maxEnd = workingEndMin;
    const allDayKeys = weekDays.map((d) => fmtKey(d));
    allDayKeys.forEach((key) => {
      const list = (liveWeekDays && liveWeekDays[key]) || [];
      list.forEach((ev) => {
        const s = toMinutes(ev.start);
        const e = toMinutes(ev.end);
        if (s < minStart) minStart = s;
        if (e > maxEnd) maxEnd = e;
      });
    });
    const startMin = minStart;
    const endMin = Math.max(startMin + 60, maxEnd);
    const toDateStr = (d: Date) =>
      `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    const openAtWeek = (clientY: number, container: HTMLElement, day: Date) => {
      const rect = container.getBoundingClientRect();
      const y = clientY - rect.top;
      const minutesFromStart = y / pxPerMinute;
      const stepSize = step;
      const clamped = Math.max(
        0,
        Math.min(minutesFromStart, endMin - startMin)
      );
      const rounded = Math.round(clamped / stepSize) * stepSize;
      const total = startMin + rounded;
      const hh = Math.floor(total / 60);
      const mm = total % 60;
      setPrefillDate(toDateStr(day));
      setPrefillTime(`${pad(hh)}:${pad(mm)}`);
      setPrefillEmployeeId("none");
      setOpenSignal((s) => s + 1);
    };
    return (
      <div className="bg-white rounded-xl p-2 sm:p-4 border border-gray-200 overflow-x-auto">
        {/* Header days */}
        <div
          className="mb-2 grid min-w-[600px]" // Ajout d'une largeur minimale pour éviter l'écrasement
          style={{
            gridTemplateColumns: `60px repeat(${weekDays.length}, minmax(80px, 1fr))`,
          }}
        >
          <div></div>
          {weekDays.map((d, i) => (
            <div key={i} className="px-1 sm:px-2">
              <div
                className={`flex flex-col items-center ${
                  fmtKey(d) === fmtKey(new Date()) ? "text-black font-semibold" : "text-gray-700"
                }`}
              >
                <div className="text-xs sm:text-sm capitalize">
                  {new Intl.DateTimeFormat("fr-FR", {
                    weekday: isMobile ? "narrow" : "short",
                  }).format(d)}
                </div>
                <div className={`text-sm font-medium rounded-full w-6 h-6 flex items-center justify-center ${
                  fmtKey(d) === fmtKey(new Date()) ? "bg-blue-600 text-white" : ""
                }`}>
                  {d.getDate()}
                </div>
              </div>
            </div>
          ))}
        </div>



        <div
          className="grid min-w-[600px]" // Même largeur minimale que l'en-tête
          style={{
            gridTemplateColumns: `60px repeat(${weekDays.length}, minmax(80px, 1fr))`,
          }}
        >
          {/* gutter */}
          <div className="relative">
            <div
              style={{ height: (endMin - startMin) * pxPerMinute }}
              className="relative"
            >
              {rangeMinutes(startMin, endMin - 60, 60).map((m, i) => (
                <div
                  key={m}
                  className="absolute left-0 right-0"
                  style={{ top: i * hourHeight }}
                >
                  <div className="text-[10px] sm:text-[11px] text-gray-500 pr-1 sm:pr-2 h-4 leading-4 text-right">
                    {pad(Math.floor(m / 60))}:00
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* day columns */}
          {weekDays.map((d, dayIdx) => {
            // real data from API for this day
            const key = fmtKey(d);
            const timed: Appointment[] =
              liveWeekDays && liveWeekDays[key] ? liveWeekDays[key] : [];
            const positioned = layoutEvents(timed, startMin);
            return (
              <div key={dayIdx} className="px-1 sm:px-2">
                <div
                  className={`relative rounded-md border overflow-hidden ${
                    [6, 0].includes(d.getDay()) ? "bg-gray-50" : "bg-white"
                  }`}
                  style={{ 
                    height: (endMin - startMin) * pxPerMinute,
                    minHeight: "400px" // Hauteur minimale pour les petits écrans
                  }}
                  onDoubleClick={(e) =>
                    openAtWeek(
                      e.clientY,
                      e.currentTarget as unknown as HTMLElement,
                      d
                    )
                  }
                >
                  {/* hour lines */}
                  {rangeMinutes(startMin, endMin - 60, 60).map((m, i) => (
                    <div
                      key={m}
                      className="absolute left-0 right-0 border-t border-gray-200"
                      style={{ top: i * hourHeight }}
                    />
                  ))}
                  {rangeMinutes(startMin + step, endMin - step, step).map(
                    (m) => (
                      <div
                        key={m}
                        className="absolute left-0 right-0 border-t border-gray-100"
                        style={{ top: (m - startMin) * pxPerMinute }}
                      />
                    )
                  )}
                  {/* Current time indicator if today */}
                  {fmtKey(d) === fmtKey(new Date()) && (
                    <div
                      className="absolute left-0 right-0"
                      style={{
                        top:
                          (toMinutes(
                            new Date().getHours() +
                              ":" +
                              pad(new Date().getMinutes())
                          ) -
                            startMin) *
                          pxPerMinute,
                      }}
                    >
                      <div className="h-px bg-red-500"></div>
                      <div className="w-2 h-2 bg-red-500 rounded-full -mt-1"></div>
                    </div>
                  )}
                  {/* fake events */}
                  {positioned.map((ev, i) => {
                    const widthPct = 100 / ev.cols;
                    const leftPct = ev.col * widthPct;
                    const empColor = colorMap[norm(ev.employee || "")] || ev.color || "#3b82f6";
                    return (
                      <div
                        key={i}
                        className="absolute rounded-md shadow-sm border text-[11px] bg-white overflow-hidden"
                        style={{
                          top: ev.top,
                          left: `${leftPct}%`,
                          width: `calc(${widthPct}% - 3px)`,
                          height: ev.height,
                          borderLeft: `3px solid ${empColor}`,
                        }}
                        onClick={() => {
                          setDetail({
                            dateStr: `${d.getFullYear()}-${pad(
                              d.getMonth() + 1
                            )}-${pad(d.getDate())}`,
                            time: `${ev.start}-${ev.end}`,
                            title: ev.title,
                            durationMin: typeof ev.durationMin === 'number' ? ev.durationMin : (toMinutes(ev.end) - toMinutes(ev.start)),
                            color: ev.color,
                            client: ev.client,
                            clientPhone: ev.clientPhone,
                            employee: ev.employee,
                          });
                          setDetailOpen(true);
                        }}
                      >
                        <div className="px-2 py-1">
                          <div className="flex items-center gap-1 text-[10px] text-gray-600 font-medium">
                            <span className="inline-block h-1.5 w-1.5 rounded-sm" style={{ backgroundColor: empColor }} />
                            <span>{ev.client || 'Client'}</span>
                          </div>
                          <div className="text-[12px] text-gray-900 leading-snug truncate">
                            {ev.title}
                          </div>
                          <div className="text-[10px] text-gray-600 italic truncate">
                            {ev.employee}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderMonthView = () => {
    const days = getMonthMatrix(currentDate);
    const month = currentDate.getMonth();
    const todayKey = fmtKey(new Date());
    const maxVisible = isMobile ? 0 : 3; // show up to 3 events per day cell on desktop, none on mobile (indicators used instead)
    const monthEvents = liveMonthDays || {};

    // Filter events for the currently selected day on mobile
    const selectedDayKey = fmtKey(currentDate);
    const selectedDayEvents = monthEvents[selectedDayKey] || [];

    return (
      <div className="bg-white rounded-xl p-2 sm:p-4 border border-gray-200">
        {/* Weekday header */}
        <div className="grid grid-cols-7 gap-0">
          {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((n) => (
            <div
              key={n}
              className="text-[10px] sm:text-[11px] font-medium text-gray-500 text-center py-2 uppercase tracking-wide"
            >
              {isMobile ? n.charAt(0) : n}
            </div>
          ))}
        </div>

        {/* Month grid */}
        <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-lg overflow-hidden">
          {days.map((d, idx) => {
            const key = fmtKey(d);
            const isOther = d.getMonth() !== month;
            const isToday = key === todayKey;
            const isSelected = key === selectedDayKey;
            const evts = monthEvents[key] ?? [];
            const visible = evts.slice(0, maxVisible);
            const overflow = Math.max(0, evts.length - visible.length);

            return (
              <div
                key={key}
                className={`relative ${isMobile ? "min-h-[50px]" : "min-h-[112px]"} bg-white ${
                  isOther ? "opacity-50" : ""
                } ${isMobile && isSelected ? "bg-blue-50/50" : ""}`}
                onClick={() => {
                  if (isMobile) {
                    setCurrentDate(new Date(d.getFullYear(), d.getMonth(), d.getDate()));
                  }
                }}
                onDoubleClick={() => {
                  if (!isMobile) {
                    setPrefillDate(
                      `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(
                        d.getDate()
                      )}`
                    );
                    setPrefillTime(`${pad(Math.floor(workingStartMin/60))}:${pad(workingStartMin%60)}`);
                    setPrefillEmployeeId("none");
                    setOpenSignal((s) => s + 1);
                  }
                }}
              >
                <div className={`h-full ${isMobile ? "p-1" : "p-2"}`}>
                  {/* Day number */}
                  <div className="flex items-center justify-center sm:justify-between">
                    <button
                      className={`text-[10px] sm:text-xs font-medium px-1.5 sm:px-2 py-0.5 rounded-full ${
                        isToday
                          ? "bg-blue-600 text-white"
                          : isSelected && isMobile
                          ? "bg-black text-white"
                          : isOther
                          ? "text-gray-400"
                          : "text-gray-700"
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setCurrentDate(
                          new Date(d.getFullYear(), d.getMonth(), d.getDate())
                        );
                        if (!isMobile) setView("day");
                      }}
                    >
                      {d.getDate()}
                    </button>
                  </div>

                  {/* Events - Desktop View */}
                  {!isMobile && (
                    <div className="mt-2 space-y-1">
                      {visible.map((e, i) => {
                        const badgeColor = e.color || colorMap[norm(e.employee || "")] || "#3b82f6";
                        const duration = typeof e.durationMin === 'number' ? e.durationMin : (e as any)?.duration_minutes;
                        const price = typeof e.priceDA === 'number' ? e.priceDA : Math.round(((e as any)?.price_cents || 0) / 100);
                        return (
                          <button
                            key={i}
                            className="w-full flex items-center gap-2 rounded-md border px-2 py-1 text-xs shadow-sm hover:bg-gray-50 cursor-pointer text-left"
                            onClick={() => {
                              setDetail({
                                dateStr: `${d.getFullYear()}-${pad(
                                  d.getMonth() + 1
                                )}-${pad(d.getDate())}`,
                                time: e.time,
                                title: e.title,
                                employee: e.employee,
                                service: e.service,
                                durationMin: typeof duration === 'number' ? duration : undefined,
                                priceDA: typeof price === 'number' && isFinite(price) ? price : undefined,
                                color: badgeColor,
                                client: (e as any)?.client,
                                clientPhone: (e as any)?.client_phone,
                              });
                              setDetailOpen(true);
                            }}
                          >
                            <span
                              className="h-3 w-1.5 rounded-sm"
                              style={{ backgroundColor: badgeColor }}
                            />
                            <div className="truncate text-gray-800">
                              <span className="font-semibold">{(e as any).client || 'Client'}</span> • {e.title}
                            </div>
                            <div className="truncate text-[10px] text-gray-500 italic">
                              {(e as any).employee}
                            </div>
                          </button>
                        );
                      })}
                      {overflow > 0 && (
                        <button
                          className="text-[11px] text-blue-600 hover:underline"
                          onClick={() => {
                            setDayListDate(d);
                            setDayListEvents(evts);
                            setDayListOpen(true);
                          }}
                        >
                          +{overflow} autres
                        </button>
                      )}
                    </div>
                  )}

                  {/* Event indicators - Mobile View */}
                  {isMobile && evts.length > 0 && (
                    <div className="mt-1 flex flex-wrap justify-center gap-0.5">
                      {evts.slice(0, 4).map((e, i) => (
                        <div 
                          key={i} 
                          className="h-1 w-1 rounded-full" 
                          style={{ backgroundColor: e.color || colorMap[norm(e.employee || "")] || "#3b82f6" }}
                        />
                      ))}
                      {evts.length > 4 && <div className="h-1 w-1 rounded-full bg-gray-400" />}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

            {/* Selected Day Events List - Mobile Only */}
            {isMobile && (
              <div className="mt-4 border-t pt-4">
                <h3 className="text-sm font-semibold mb-3">
                  Rendez-vous du {new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long' }).format(currentDate)}
                </h3>
            {selectedDayEvents.length > 0 ? (
              <div className="space-y-2">
                {selectedDayEvents.map((e, i) => {
                  const badgeColor = e.color || colorMap[norm(e.employee || "")] || "#3b82f6";
                  const duration = typeof e.durationMin === 'number' ? e.durationMin : (e as any)?.duration_minutes;
                  return (
                    <div 
                      key={i} 
                      className="bg-neutral-50 rounded-lg p-3 border-l-4 shadow-sm flex justify-between items-center"
                      style={{ borderLeftColor: badgeColor }}
                      onClick={() => {
                        setDetail({
                          dateStr: fmtKey(currentDate),
                          time: e.time,
                          title: e.title,
                          employee: e.employee,
                          service: e.service,
                          durationMin: typeof duration === 'number' ? duration : undefined,
                          color: badgeColor,
                          client: (e as any)?.client,
                          clientPhone: (e as any)?.client_phone,
                        });
                        setDetailOpen(true);
                      }}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-gray-900">{e.time || '--:--'}</span>
                          <span className="text-sm font-semibold text-gray-900 truncate">{(e as any).client || 'Client'}</span>
                        </div>
                        <div className="text-xs text-gray-600 truncate mt-0.5">{e.title}</div>
                        <div className="text-[10px] text-gray-500 italic mt-0.5">{e.employee}</div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-gray-400 shrink-0" />
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-8 text-center bg-gray-50 rounded-lg border border-dashed border-gray-300">
                <p className="text-sm text-gray-500">Aucun rendez-vous pour ce jour</p>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="sticky top-0 z-30 bg-white/70 supports-[backdrop-filter]:bg-white/60 backdrop-blur border-b border-neutral-200">
        <div className="px-3 sm:px-4 md:px-6 py-1.5 sm:py-3 md:py-4">
          <div className="flex items-center justify-between gap-2">
            {/* Left/Main Row: navigation + Select (on mobile) */}
            <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto no-scrollbar flex-1">
              <div className="flex items-center shrink-0">
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-lg h-8 w-8 sm:h-9 sm:w-9"
                  onClick={onPrev}
                >
                  <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4" />
                </Button>
                <Button
                  variant="outline"
                  className="rounded-lg h-8 text-[11px] font-bold px-2 shrink-0 bg-neutral-50/50"
                  onClick={() => setCurrentDate(new Date())}
                >
                  Aujourd'hui
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-lg h-8 w-8 sm:h-9 sm:w-9"
                  onClick={onNext}
                >
                  <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
                </Button>
              </div>

              {isMobile && (
                <Select value={view} onValueChange={(v) => setView(v as any)}>
                  <SelectTrigger className="h-8 w-[85px] rounded-lg bg-neutral-100 border-none text-[10px] font-bold focus:ring-0 shadow-none shrink-0">
                    <SelectValue placeholder="Vue" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="day">Jour</SelectItem>
                    <SelectItem value="week">Semaine</SelectItem>
                    <SelectItem value="month">Mois</SelectItem>
                  </SelectContent>
                </Select>
              )}

              <h2 className="text-xs sm:text-sm md:text-base lg:text-lg font-bold text-black capitalize tracking-tight truncate min-w-0">
                {dateTitle}
              </h2>
            </div>

            {/* Right: view switch (desktop) + filters popover */}
            <div className="flex items-center gap-2 shrink-0">
              {!isMobile && (
                <div className="bg-neutral-100 rounded-lg p-0.5 flex">
                  <Button
                    variant={view === "day" ? "default" : "ghost"}
                    className="rounded-md px-3 h-8 text-sm"
                    onClick={() => setView("day")}
                  >
                    Jour
                  </Button>
                  <Button
                    variant={view === "week" ? "default" : "ghost"}
                    className="rounded-md px-3 h-8 text-sm"
                    onClick={() => setView("week")}
                  >
                    Semaine
                  </Button>
                  <Button
                    variant={view === "month" ? "default" : "ghost"}
                    className="rounded-md px-3 h-8 text-sm"
                    onClick={() => setView("month")}
                  >
                    Mois
                  </Button>
                </div>
              )}

              {/* Filters collapsed */}
              {!isMobile && (
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="inline-flex items-center justify-center whitespace-nowrap rounded-lg border border-input bg-background px-2 md:px-3 py-2 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground"
                    aria-expanded={filtersOpen}
                    onClick={() => setFiltersOpen(true)}
                  >
                    Filtres
                    {(selectedEmployees.length > 0 ||
                      search ||
                      step !== 15 ||
                      hideEmpty ||
                      selectedCategories.length > 0 || selectedServices.length > 0) && (
                      <span className="ml-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-black text-white text-[10px] px-1">
                        {Number(selectedEmployees.length > 0) +
                          Number(Boolean(search)) +
                          Number(step !== 15) +
                          Number(hideEmpty) +
                          Number(selectedCategories.length > 0) +
                          Number(selectedServices.length > 0)}
                      </span>
                    )}
                  </button>
                </PopoverTrigger>
                <PopoverContent
                  side="bottom"
                  align="end"
                  sideOffset={8}
                  className="w-80 z-50"
                >
                  <div className="space-y-3">
                    <div className="text-sm font-medium">Filtres</div>
                    <div className="space-y-2">
                      <button type="button" className="text-xs text-gray-600 w-full text-left" onClick={() => setOpenEmp(v=>!v)}>Employés</button>
                      {openEmp && (
                      <div className="max-h-40 overflow-auto rounded border p-2">
                        {allEmployees.map((e) => {
                          const checked = selectedEmployees.includes(e.name);
                          return (
                            <label
                              key={e.name}
                              className="flex items-center gap-2 py-1"
                            >
                              <Checkbox
                                checked={checked}
                                onCheckedChange={(v) => {
                                  setSelectedEmployees((prev) => {
                                    const on = Boolean(v);
                                    if (on && !prev.includes(e.name))
                                      return [...prev, e.name];
                                    if (!on)
                                      return prev.filter((x) => x !== e.name);
                                    return prev;
                                  });
                                }}
                              />
                              <span className="text-sm">{e.name}</span>
                            </label>
                          );
                        })}
                      </div>
                      )}
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedEmployees(allEmployees.map((e) => e.name))}
                        >
                          Tout
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedEmployees([])}
                        >
                          Aucun
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <button type="button" className="text-xs text-gray-600 w-full text-left" onClick={() => setOpenSvc(v=>!v)}>Services</button>
                      {openSvc && (
                      <div className="max-h-32 overflow-auto rounded border p-2">
                        {servicesOptions.map((s) => {
                          const checked = selectedServices.includes(s);
                          return (
                            <label key={s} className="flex items-center gap-2 py-1">
                              <Checkbox
                                checked={checked}
                                onCheckedChange={(v) => {
                                  setSelectedServices((prev) => {
                                    const on = Boolean(v);
                                    if (on && !prev.includes(s)) return [...prev, s];
                                    if (!on) return prev.filter((x) => x !== s);
                                    return prev;
                                  });
                                }}
                              />
                              <span className="text-sm">{s}</span>
                            </label>
                          );
                        })}
                      </div>
                      )}
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => setSelectedServices(servicesOptions)}>
                          Tout
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setSelectedServices([])}>
                          Aucun
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <button type="button" className="text-xs text-gray-600 w-full text-left" onClick={() => setOpenCat(v=>!v)}>Catégories</button>
                      {openCat && (
                      <div className="max-h-32 overflow-auto rounded border p-2">
                        {categoriesOptions.map((c) => {
                          const checked = selectedCategories.includes(c);
                          return (
                            <label
                              key={c}
                              className="flex items-center gap-2 py-1"
                            >
                              <Checkbox
                                checked={checked}
                                onCheckedChange={(v) => {
                                  setSelectedCategories((prev) => {
                                    const on = Boolean(v);
                                    if (on && !prev.includes(c))
                                      return [...prev, c];
                                    if (!on) return prev.filter((x) => x !== c);
                                    return prev;
                                  });
                                }}
                              />
                              <span className="text-sm">{c}</span>
                            </label>
                          );
                        })}
                      </div>
                      )}
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedCategories(categoriesOptions)}
                        >
                          Tout
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedCategories([])}
                        >
                          Aucun
                        </Button>
                      </div>
                    </div>
                    <Select
                      value={String(step)}
                      onValueChange={(v) => setStep(Number(v) as 15 | 30)}
                    >
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
                    <Input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Rechercher..."
                    />
                    <label className="flex items-center gap-2 text-sm">
                      <Checkbox
                        checked={hideEmpty}
                        onCheckedChange={(v) => setHideEmpty(Boolean(v))}
                      />
                      Masquer les colonnes vides
                    </label>
                    <div className="flex justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedEmployees([]);
                          setSelectedCategories([]);
                          setSelectedServices([]);
                          setSearch("");
                          setStep(15);
                          setHideEmpty(false);
                        }}
                      >
                        Réinitialiser
                      </Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
              )}

              {/* Mobile fallback: Dialog for filters */}
              {isMobile && (
              <Dialog open={filtersOpen} onOpenChange={setFiltersOpen}>
                <DialogContent className="md:hidden max-w-sm">
                  <DialogHeader>
                    <DialogTitle>Filtres</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <button type="button" className="text-xs text-gray-600 w-full text-left" onClick={() => setOpenEmp(v=>!v)}>Employés</button>
                      {openEmp && (
                      <div className="max-h-40 overflow-auto rounded border p-2">
                        {allEmployees.map((e) => {
                          const checked = selectedEmployees.includes(e.name);
                          return (
                            <label
                              key={e.name}
                              className="flex items-center gap-2 py-1"
                            >
                              <Checkbox
                                checked={checked}
                                onCheckedChange={(v) => {
                                  setSelectedEmployees((prev) => {
                                    const on = Boolean(v);
                                    if (on && !prev.includes(e.name))
                                      return [...prev, e.name];
                                    if (!on)
                                      return prev.filter((x) => x !== e.name);
                                    return prev;
                                  });
                                }}
                              />
                              <span className="text-sm">{e.name}</span>
                            </label>
                          );
                        })}
                      </div>
                      )}
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            setSelectedEmployees(allEmployees.map((e) => e.name))
                          }
                        >
                          Tout
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedEmployees([])}
                        >
                          Aucun
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <button type="button" className="text-xs text-gray-600 w-full text-left" onClick={() => setOpenSvc(v=>!v)}>Services</button>
                      {openSvc && (
                      <div className="max-h-32 overflow-auto rounded border p-2">
                        {servicesOptions.map((s) => {
                          const checked = selectedServices.includes(s);
                          return (
                            <label
                              key={s}
                              className="flex items-center gap-2 py-1"
                            >
                              <Checkbox
                                checked={checked}
                                onCheckedChange={(v) => {
                                  setSelectedServices((prev) => {
                                    const on = Boolean(v);
                                    if (on && !prev.includes(s))
                                      return [...prev, s];
                                    if (!on) return prev.filter((x) => x !== s);
                                    return prev;
                                  });
                                }}
                              />
                              <span className="text-sm">{s}</span>
                            </label>
                          );
                        })}
                      </div>
                      )}
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedServices(servicesOptions)}
                        >
                          Tout
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedServices([])}
                        >
                          Aucun
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <button type="button" className="text-xs text-gray-600 w-full text-left" onClick={() => setOpenCat(v=>!v)}>Catégories</button>
                      {openCat && (
                      <div className="max-h-32 overflow-auto rounded border p-2">
                        {categoriesOptions.map((c) => {
                          const checked = selectedCategories.includes(c);
                          return (
                            <label
                              key={c}
                              className="flex items-center gap-2 py-1"
                            >
                              <Checkbox
                                checked={checked}
                                onCheckedChange={(v) => {
                                  setSelectedCategories((prev) => {
                                    const on = Boolean(v);
                                    if (on && !prev.includes(c))
                                      return [...prev, c];
                                    if (!on) return prev.filter((x) => x !== c);
                                    return prev;
                                  });
                                }}
                              />
                              <span className="text-sm">{c}</span>
                            </label>
                          );
                        })}
                      </div>
                      )}
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedCategories(categoriesOptions)}
                        >
                          Tout
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedCategories([])}
                        >
                          Aucun
                        </Button>
                      </div>
                    </div>
                    <Select
                      value={String(step)}
                      onValueChange={(v) => setStep(Number(v) as 15 | 30)}
                    >
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
                    <Input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Rechercher..."
                    />
                    <label className="flex items-center gap-2 text-sm">
                      <Checkbox
                        checked={hideEmpty}
                        onCheckedChange={(v) => setHideEmpty(Boolean(v))}
                      />
                      Masquer les colonnes vides
                    </label>
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedEmployees([]);
                          setSelectedCategories([]);
                          setSelectedServices([]);
                          setServicesText("");
                          setSearch("");
                          setStep(15);
                          setHideEmpty(false);
                        }}
                      >
                        Réinitialiser
                      </Button>
                      <Button size="sm" onClick={() => setFiltersOpen(false)}>
                        Appliquer
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
              )}

              {!isMobile && (
                <CreateReservationModal
                  defaultDate={prefillDate}
                  defaultTime={prefillTime}
                  defaultEmployeeId={prefillEmployeeId}
                  forceOpenSignal={openSignal}
                  onCreated={() => setRefreshKey((k) => k + 1)}
                  trigger={
                    <Button className="bg-black text-white hover:bg-neutral-800 rounded-lg px-2 sm:px-4 h-8 sm:h-10 text-xs sm:text-sm whitespace-nowrap">
                      <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-0 sm:mr-2" />
                      <span className="hidden xs:inline">Nouveau rendez-vous</span>
                    </Button>
                  }
                />
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="p-2 sm:p-4 md:p-6" key={refreshKey}>
        {view === "day" && renderDayView()}
        {view === "week" && renderWeekView()}
        {view === "month" && renderMonthView()}
      </div>

      {/* Mobile Floating Action Button (FAB) */}
      {isMobile && (
        <CreateReservationModal
          defaultDate={fmtKey(currentDate)}
          defaultTime={`${pad(Math.floor(workingStartMin / 60))}:${pad(workingStartMin % 60)}`}
          defaultEmployeeId={prefillEmployeeId}
          onCreated={() => setRefreshKey((k) => k + 1)}
          trigger={
            <Button 
              className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-2xl bg-black text-white hover:bg-neutral-800 z-50 flex items-center justify-center p-0"
              size="icon"
            >
              <Plus className="h-6 w-6" />
            </Button>
          }
        />
      )}

      {/* Create appointment handled by CreateReservationModal */}

      {/* Month day events list dialog */}
      <Dialog open={dayListOpen} onOpenChange={setDayListOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dayListDate
                ? new Intl.DateTimeFormat("fr-FR", {
                    weekday: "long",
                    day: "2-digit",
                    month: "long",
                  }).format(dayListDate)
                : "Cette journée"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2 max-h-[60vh] overflow-auto">
            {dayListEvents.length === 0 && (
              <div className="text-sm text-gray-600">
                Aucun rendez-vous ce jour.
              </div>
            )}
            {dayListEvents.map((e, i) => (
              <button
                key={i}
                className="w-full flex items-start gap-3 rounded-md border px-3 py-2 text-left hover:bg-gray-50"
                onClick={() => {
                  if (!dayListDate) return;
                  const badgeColor = e.color || colorMap[norm(e.employee || "")] || "#3b82f6";
                  setDetail({
                    dateStr: `${dayListDate.getFullYear()}-${pad(
                      dayListDate.getMonth() + 1
                    )}-${pad(dayListDate.getDate())}`,
                    time: (() => {
                      const mins = (typeof e.durationMin === 'number' ? e.durationMin : (e as any)?.duration_minutes) as number | undefined;
                      if (!e.time) return undefined;
                      if (!mins || !isFinite(mins) || mins <= 0) return e.time;
                      const [hh, mm] = e.time.split(":").map(Number);
                      const startTotal = hh * 60 + mm;
                      const endTotal = startTotal + mins;
                      const eh = Math.floor((endTotal % (24*60)) / 60);
                      const em = endTotal % 60;
                      const pad2 = (n: number) => n.toString().padStart(2, '0');
                      return `${e.time}-${pad2(eh)}:${pad2(em)}`;
                    })(),
                    title: e.title,
                    employee: e.employee,
                    service: e.service,
                    durationMin: e.durationMin,
                    priceDA: e.priceDA,
                    color: badgeColor,
                    client: (e as any)?.client,
                    clientPhone: (e as any)?.client_phone,
                  });
                  setDetailOpen(true);
                }}
              >
                <span
                  className="mt-1 h-3 w-1.5 rounded-sm"
                  style={{ backgroundColor: e.color || colorMap[norm(e.employee || "")] || "#3b82f6" }}
                />
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-gray-900 truncate">
                    {(e as any).client || 'Client'}
                  </div>
                  <div className="text-xs text-gray-700 truncate">
                    {e.title}
                  </div>
                  <div className="text-xs text-gray-500 truncate mt-1">
                    {e.employee || "Employé"}
                    {typeof e.durationMin === "number"
                      ? ` • ${e.durationMin} min`
                      : ""}
                    {typeof e.priceDA === "number" ? ` • ${e.priceDA} DA` : ((e as any)?.price_cents ? ` • ${Math.round(((e as any).price_cents)/100)} DA` : "")}
                    {(e as any).client_phone ? ` • 📞 ${(e as any).client_phone}` : ""}
                  </div>
                </div>
              </button>
            ))}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                if (!dayListDate) return;
                setCurrentDate(
                  new Date(
                    dayListDate.getFullYear(),
                    dayListDate.getMonth(),
                    dayListDate.getDate()
                  )
                );
                setView("day");
                setDayListOpen(false);
              }}
            >
              Voir la journée
            </Button>
            <Button
              onClick={() => {
                if (!dayListDate) return;
                setPrefillDate(
                  `${dayListDate.getFullYear()}-${pad(
                    dayListDate.getMonth() + 1
                  )}-${pad(dayListDate.getDate())}`
                );
                setPrefillTime(`${pad(workingStart)}:00`);
                setPrefillEmployeeId("none");
                setDayListOpen(false);
                setOpenSignal((s) => s + 1);
              }}
            >
              Nouveau rendez-vous ce jour
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Event Detail dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Détails du rendez-vous</DialogTitle>
          </DialogHeader>
          {detail && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <span
                  className="h-3 w-1.5 rounded-sm"
                  style={{ backgroundColor: detail.color || "#3b82f6" }}
                />
                <span className="font-medium text-gray-900">
                  {detail.title}
                </span>
              </div>
              <div className="text-sm text-gray-700">
                {new Date(detail.dateStr).toLocaleDateString("fr-FR", {
                  weekday: "long",
                  day: "2-digit",
                  month: "long",
                })}{" "}
                {detail.time ? `• ${detail.time}` : ""}
              </div>
              <div className="text-sm text-gray-700">
                {detail.employee ? `Employé: ${detail.employee}` : ""}
                {detail.service ? ` • Service: ${detail.service}` : ""}
              </div>
              <div className="text-sm text-gray-700">
                {detail.client ? `Client: ${detail.client}` : ""}
                {detail.clientPhone ? ` • 📞 ${detail.clientPhone}` : ""}
              </div>
              <div className="text-sm text-gray-700">
                {typeof detail.durationMin === "number"
                  ? `${detail.durationMin} min`
                  : ""}
                {typeof detail.priceDA === "number"
                  ? ` • ${detail.priceDA} DA`
                  : ""}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                if (!detail) return;
                const d = new Date(detail.dateStr);
                setCurrentDate(
                  new Date(d.getFullYear(), d.getMonth(), d.getDate())
                );
                setView("day");
                setDetailOpen(false);
              }}
            >
              Voir dans la journée
            </Button>
            <Button
              onClick={() => {
                if (!detail) return;
                setPrefillDate(detail.dateStr);
                setPrefillTime(detail.time || `${pad(Math.floor(workingStartMin/60))}:${pad(workingStartMin%60)}`);
                setPrefillEmployeeId("none");
                setDetailOpen(false);
                setOpenSignal((s) => s + 1);
              }}
            >
              Créer un RDV similaire
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={availabilityOpen} onOpenChange={setAvailabilityOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Gérer les disponibilités</DialogTitle>
          </DialogHeader>
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              setAvailabilityOpen(false);
              // Note: The original code didn't have a save function defined here, 
              // just closing the modal. Keeping the same behavior but as a form.
            }}
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Employé" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {allEmployees.map((e) => (
                      <SelectItem key={e.name} value={e.name}>
                        {e.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              <Input type="date" />
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="open">Disponible</SelectItem>
                    <SelectItem value="closed">Fermé</SelectItem>
                    <SelectItem value="break">Pause</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter className="mt-4">
              <Button type="submit">
                Enregistrer
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
