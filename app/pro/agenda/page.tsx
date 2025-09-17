import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function ProAgenda() {
  const currentWeek = [
    { day: "Lun", date: "16 Sept", isToday: false },
    { day: "Mar", date: "17 Sept", isToday: false },
    { day: "Mer", date: "18 Sept", isToday: false },
    { day: "Jeu", date: "19 Sept", isToday: false },
    { day: "Ven", date: "20 Sept", isToday: false },
    { day: "Sam", date: "21 Sept", isToday: false },
    { day: "Dim", date: "22 Sept", isToday: true, isClosed: true },
  ]

  const timeSlots = ["09:00", "10:00", "11:00", "11:30", "12:00", "12:30", "13:00", "13:30", "14:00", "14:30"]

  const appointments = [
    // Lundi
    { day: 0, time: "09:00", client: "Marie D.", color: "bg-green-100 text-green-800" },
    { day: 0, time: "11:00", client: "Sarah B.", color: "bg-blue-100 text-blue-800" },
    { day: 0, time: "14:00", client: "Amina K.", color: "bg-yellow-100 text-yellow-800" },

    // Mardi
    { day: 1, time: "09:00", client: "Marie D.", color: "bg-green-100 text-green-800" },
    { day: 1, time: "11:00", client: "Sarah B.", color: "bg-blue-100 text-blue-800" },
    { day: 1, time: "14:00", client: "Amina K.", color: "bg-yellow-100 text-yellow-800" },

    // Mercredi
    { day: 2, time: "09:00", client: "Marie D.", color: "bg-green-100 text-green-800" },
    { day: 2, time: "11:00", client: "Sarah B.", color: "bg-blue-100 text-blue-800" },
    { day: 2, time: "14:00", client: "Amina K.", color: "bg-yellow-100 text-yellow-800" },

    // Jeudi
    { day: 3, time: "09:00", client: "Marie D.", color: "bg-green-100 text-green-800" },
    { day: 3, time: "11:00", client: "Sarah B.", color: "bg-blue-100 text-blue-800" },
    { day: 3, time: "14:00", client: "Amina K.", color: "bg-yellow-100 text-yellow-800" },

    // Vendredi
    { day: 4, time: "09:00", client: "Marie D.", color: "bg-green-100 text-green-800" },
    { day: 4, time: "11:00", client: "Sarah B.", color: "bg-blue-100 text-blue-800" },
    { day: 4, time: "14:00", client: "Amina K.", color: "bg-yellow-100 text-yellow-800" },

    // Samedi
    { day: 5, time: "09:00", client: "Marie D.", color: "bg-green-100 text-green-800" },
    { day: 5, time: "11:00", client: "Sarah B.", color: "bg-blue-100 text-blue-800" },
    { day: 5, time: "10:30", client: "Sarah B.", color: "bg-blue-100 text-blue-800" },
    { day: 5, time: "11:30", client: "Sarah B.", color: "bg-blue-100 text-blue-800" },
    { day: 5, time: "12:00", client: "Sarah B.", color: "bg-blue-100 text-blue-800" },
    { day: 5, time: "12:30", client: "Sarah B.", color: "bg-blue-100 text-blue-800" },
    { day: 5, time: "13:00", client: "Sarah B.", color: "bg-blue-100 text-blue-800" },
    { day: 5, time: "13:30", client: "Sarah B.", color: "bg-blue-100 text-blue-800" },
  ]

  return (

      <div className="bg-white border-b border-gray-200">
      <div className="px-6 py-4">
         <div className="flex justify-between items-center">
          <div>
        <h1 className="text-2xl font-bold text-black">Planning de la semaine</h1>
        <p className="text-gray-600">Gérer votre planning</p>
        </div>
        <div className="flex items-center space-x-4">
          <Button className="bg-black text-white hover:bg-gray-800 rounded-lg px-6">
            <Plus className="h-4 w-4 mr-2" />
            Nouveau rendez-vous
          </Button>
          <Button variant="outline" className="rounded-lg px-6 bg-transparent">
            Gérer les disponibilités
          </Button>
        </div>
      </div>
      </div>

      <div className="p-6">
        <div className="bg-white rounded-lg border overflow-hidden">
          {/* Header with days */}
          <div className="grid grid-cols-8 border-b bg-gray-50">
            <div className="p-4 text-sm font-medium text-gray-600"></div>
            {currentWeek.map((day, index) => (
              <div key={index} className="p-4 text-center border-l">
                <div className="text-sm font-medium text-gray-900">{day.day}</div>
                <div className="text-sm text-gray-600">{day.date}</div>
                {day.isClosed && <div className="text-xs text-gray-500 mt-1">Fermé</div>}
              </div>
            ))}
          </div>

          {/* Time slots and appointments */}
          <div className="divide-y">
            {timeSlots.map((time, timeIndex) => (
              <div key={timeIndex} className="grid grid-cols-8 min-h-[60px]">
                <div className="p-4 text-sm text-gray-600 border-r bg-gray-50 flex items-center">{time}</div>
                {currentWeek.map((day, dayIndex) => {
                  const appointment = appointments.find((apt) => apt.day === dayIndex && apt.time === time)
                  const isClosed = day.isClosed

                  return (
                    <div
                      key={dayIndex}
                      className={`border-l p-2 flex items-center justify-center min-h-[60px] ${
                        isClosed ? "bg-gray-100" : "hover:bg-gray-50 cursor-pointer"
                      }`}
                    >
                      {appointment && !isClosed && (
                        <div
                          className={`px-3 py-2 rounded-md text-sm font-medium w-full text-center ${appointment.color}`}
                        >
                          {appointment.client}
                        </div>
                      )}
                      {isClosed && <span className="text-xs text-gray-400">Fermé</span>}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
