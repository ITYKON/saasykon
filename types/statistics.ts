export interface DailyStat {
  date: string;
  count: number;
  revenue: number;
}

export interface ServiceStat {
  name: string;
  count: number;
  revenue: number;
}

export interface EmployeeStat {
  name: string;
  count: number;
  revenue: number;
}

export interface RecentAppointment {
  id: string;
  customerName: string;
  date: string;
  time: string;
  services: string;
  status: string;
  total: number;
}

export interface DashboardStatistics {
  overview: {
    totalAppointments: number;
    completedAppointments: number;
    cancelledAppointments: number;
    noShowAppointments: number;
    totalRevenue: number;
    averageRevenuePerAppointment: number;
  };
  dailyStats: DailyStat[];
  serviceStats: ServiceStat[];
  employeeStats: EmployeeStat[];
  recentAppointments: RecentAppointment[];
}
