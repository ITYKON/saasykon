import { Users, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

export default function AdminUtilisateurs() {
  const users = [
    {
      id: 1,
      name: "Marie Dupont",
      email: "marie.dupont@email.com",
      phone: "+213 555 123 456",
      role: "Client",
      status: "Actif",
      joinDate: "Inscrit le 15 sept. 2025",
      reservations: 8,
      avatar: "MD",
    },
    {
      id: 2,
      name: "SOUSSOU HAMICHE",
      email: "soussou@pavana.dz",
      phone: "+213 555 789 012",
      role: "Professionnel",
      status: "Actif",
      joinDate: "Inscrit le 10 sept. 2025",
      salon: "Salon: PAVANA",
      avatar: "SH",
    },
    {
      id: 3,
      name: "Amina Khelifi",
      email: "amina.khelifi@email.com",
      phone: "+213 XX XX XX XX",
      role: "client",
      status: "actif",
      joinDate: "3 mars 2024",
      lastActivity: "Il y a 1j",
      totalBookings: 12,
      totalSpent: 2400,
      averageRating: 4.7,
      city: "Oran",
    },
    {
      id: 4,
      name: "Admin User",
      email: "admin@planity.com",
      phone: "+213 XX XX XX XX",
      role: "admin",
      status: "actif",
      joinDate: "1 janvier 2023",
      lastActivity: "Il y a 30min",
      totalBookings: 0,
      totalSpent: 0,
      averageRating: 0,
      city: "Alger",
    },
    {
      id: 5,
      name: "Fatima Meziani",
      email: "fatima.meziani@email.com",
      phone: "+213 XX XX XX XX",
      role: "professionnel",
      status: "suspendu",
      joinDate: "20 septembre 2025",
      lastActivity: "Il y a 3j",
      totalBookings: 8,
      totalSpent: 0,
      averageRating: 4.2,
      city: "Constantine",
      salonName: "Salon Elite",
    },
  ]

  const getRoleColor = (role: string) => {
    switch (role.toLowerCase()) {
      case "admin":
        return "bg-purple-100 text-purple-800"
      case "professionnel":
        return "bg-blue-100 text-blue-800"
      case "client":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "actif":
        return "bg-green-100 text-green-800"
      case "suspendu":
        return "bg-red-100 text-red-800"
      case "inactif":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="space-y-6">
      {/* Header ajusté pour ressembler au dashboard */}
      <header className="bg-white border-b border-gray-200 mb-6">
        <div className="px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-black">Gestion des utilisateurs</h2>
              <p className="text-gray-600">Gérez les clients et professionnels de la plateforme.</p>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline">Exporter données</Button>
            </div>
          </div>
        </div>
      </header>

      <div className="space-y-4">
        {users.map((user) => (
          <Card key={user.id} className="border border-gray-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Avatar className="h-12 w-12 bg-gray-200">
                    <AvatarFallback className="text-gray-600 font-medium">{user.avatar}</AvatarFallback>
                  </Avatar>

                  <div className="space-y-1">
                    <h3 className="text-lg font-semibold text-black">{user.name}</h3>
                    <p className="text-gray-600">{user.email}</p>
                    {user.salon && <p className="text-sm text-gray-500">{user.salon}</p>}

                    <div className="flex items-center space-x-4 mt-2">
                      <Badge variant="outline" className={getRoleColor(user.role)}>
                        {user.role}
                      </Badge>
                      <Badge variant="outline" className="text-green-600 border-green-600">
                        {user.status}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="text-right space-y-2">
                  <p className="text-sm text-gray-500">{user.joinDate}</p>
                  {user.reservations && <p className="text-sm text-gray-500">{user.reservations} réservations</p>}

                  <div className="flex space-x-2 mt-3">
                    <Button variant="outline" size="sm" className="bg-transparent">
                      <Users className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" className="bg-transparent">
                      <Mail className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
