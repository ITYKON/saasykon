import {
  Calendar,
  Clock,
  Users,
  TrendingUp,
  DollarSign,
  Settings,
  Plus,
  Eye,
  AlertCircle,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Link from "next/link";
import CreateReservationModal from "@/components/pro/CreateReservationModal";
import { headers } from "next/headers";
import { buildSalonSlug } from "@/lib/salon-slug";

export default async function ProDashboard() {
  // Fetch unified dashboard data from API (server-side)
  const h = headers();
  const host = h.get("x-forwarded-host") || h.get("host");
  const proto = h.get("x-forwarded-proto") || "http";
  const origin = `${proto}://${host}`;
  const resp = await fetch(`${origin}/api/pro/dashboard`, {
    cache: "no-store",
    headers: { cookie: h.get("cookie") || "" },
  });
  if (!resp.ok) {
    return (
      <div className="p-6">
        <h2 className="text-xl font-semibold text-red-600">
          Erreur de chargement du tableau de bord
        </h2>
      </div>
    );
  }
  const { kpis, todayAgenda, notifications, business, address } =
    await resp.json();

  // Fetch claim information and business verification
  let claimInfo: any = null;
  let needsVerification = false;
  let verificationSubmitted = false;
  let daysRemaining = 7;

  try {
    // Get claim info if exists
    const claimResp = await fetch(`${origin}/api/pro/claim`, {
      cache: "no-store",
      headers: { cookie: h.get("cookie") || "" },
    });

    if (claimResp.ok) {
      const claimData = await claimResp.json();
      claimInfo = claimData.claim;
    }

    // Check if business needs verification
    if (business) {
      const verificationResp = await fetch(
        `${origin}/api/business/verification`,
        {
          cache: "no-store",
          headers: { cookie: h.get("cookie") || "" },
        }
      );

      if (verificationResp.ok) {
        const verificationData = await verificationResp.json();

        if (verificationData.verification) {
          verificationSubmitted = true;

          // Pour les leads convertis, calculer les jours restants
          if (
            business.converted_from_lead &&
            verificationData.verification.status === "pending"
          ) {
            // Calculer les jours depuis la création de la vérification
            const createdAt = new Date(
              verificationData.verification.created_at
            );
            const now = new Date();
            const daysPassed = Math.floor(
              (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24)
            );
            daysRemaining = Math.max(0, 7 - daysPassed);
          }
        }

        // If business is converted from lead and has no verification or verification is incomplete
        needsVerification =
          business.converted_from_lead &&
          (!verificationData.verification ||
            verificationData.verification.status === "pending" ||
            !verificationData.verification.id_document_front_url ||
            !verificationData.verification.id_document_back_url ||
            !verificationData.verification.rc_document_url);
      }
    }
  } catch (e) {
    console.error("Error fetching verification status:", e);
  }
  const stats = {
    revenueCents: kpis?.revenueCents || 0,
    bookings: kpis?.bookings || 0,
    newClients: kpis?.newClients || 0,
    rating: kpis?.rating || 0,
  };
  const todayItems: Array<{
    id: string;
    starts_at: Date | string;
    status: string;
    client: string;
    service: string;
    duration_minutes: number;
    price_cents: number;
  }> = todayAgenda || [];
  const formatMoney = (cents: number) =>
    new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: kpis?.currency || "DZD",
    }).format((cents || 0) / 100);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
            <div className="w-full sm:w-auto">
              <h2 className="text-xl sm:text-2xl font-bold text-black truncate">
                {business?.public_name || business?.legal_name || "Mon salon"}
              </h2>
              {address?.address_line1 ? (
                <p className="text-sm sm:text-base text-gray-600 truncate">
                  {address.address_line1}
                </p>
              ) : (
                <p className="text-sm sm:text-base text-gray-600">&nbsp;</p>
              )}
            </div>
            <div className="w-full sm:w-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
              <CreateReservationModal
                trigger={
                  <Button
                    size="sm"
                    className="w-full sm:w-auto bg-black text-white hover:bg-gray-800 text-sm"
                  >
                    <Plus className="h-4 w-4 mr-1 sm:mr-2 flex-shrink-0" />
                    <span>Nouveau RDV</span>
                  </Button>
                }
              />
              <Link
                href={
                  business?.id
                    ? `/salon/${buildSalonSlug(
                        business.public_name || business.legal_name || "",
                        business.id,
                        address?.cities?.name || null
                      )}`
                    : "#"
                }
                className="w-full sm:w-auto"
              >
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full sm:w-auto text-sm"
                >
                  <Eye className="h-4 w-4 mr-1 sm:mr-2 flex-shrink-0" />
                  <span>Voir ma page</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="p-6">
        {/* Verification Reminder Banner */}
        {((claimInfo && !claimInfo.has_all_documents) ||
          (needsVerification && !verificationSubmitted)) && (
          <Alert
            className={`mb-6 ${
              claimInfo?.is_blocked
                ? "border-red-500 bg-red-50"
                : "border-yellow-500 bg-yellow-50"
            }`}
          >
            <AlertCircle
              className={`h-4 w-4 ${
                claimInfo?.is_blocked ? "text-red-600" : "text-yellow-600"
              }`}
            />
            <AlertTitle
              className={
                claimInfo?.is_blocked ? "text-red-800" : "text-yellow-800"
              }
            >
              {claimInfo?.is_blocked ? "Compte bloqué" : "Documents manquants"}
            </AlertTitle>
            <AlertDescription
              className={
                claimInfo?.is_blocked ? "text-red-700" : "text-yellow-700"
              }
            >
              {claimInfo?.is_blocked ? (
                <p>
                  Votre compte a été bloqué car les documents requis n'ont pas
                  été soumis dans les délais. Veuillez soumettre vos documents
                  pour débloquer votre compte.
                </p>
              ) : (
                <p>
                  {business?.converted_from_lead ? (
                    <>
                      Il vous reste{" "}
                      <strong>
                        {daysRemaining} jour{daysRemaining > 1 ? "s" : ""}
                      </strong>{" "}
                      pour soumettre vos documents légaux. Votre compte sera
                      bloqué après ce délai si les documents ne sont pas
                      fournis.
                    </>
                  ) : claimInfo?.days_remaining ? (
                    <>
                      Il vous reste{" "}
                      <strong>
                        {claimInfo.days_remaining} jour
                        {claimInfo.days_remaining > 1 ? "s" : ""}
                      </strong>{" "}
                      pour soumettre vos documents légaux. Votre compte sera
                      bloqué après ce délai si les documents ne sont pas
                      fournis.
                    </>
                  ) : (
                    "Veuillez soumettre vos documents de vérification pour accéder à toutes les fonctionnalités."
                  )}
                </p>
              )}
              <div className="mt-4">
                <Link href="/pro/documents-verification">
                  <Button
                    variant={claimInfo?.is_blocked ? "destructive" : "default"}
                    size="sm"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    {claimInfo?.is_blocked
                      ? "Soumettre les documents"
                      : "Compléter les documents"}
                  </Button>
                </Link>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <DollarSign className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-2xl font-bold text-black">
                    {formatMoney(stats.revenueCents)}
                  </p>
                  <p className="text-gray-600">Cette semaine</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Calendar className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-2xl font-bold text-black">
                    {stats.bookings}
                  </p>
                  <p className="text-gray-600">RDV cette semaine</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-2xl font-bold text-black">
                    {stats.newClients}
                  </p>
                  <p className="text-gray-600">Nouveaux clients</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-yellow-600" />
                <div className="ml-4">
                  <p className="text-2xl font-bold text-black">
                    {stats.rating}
                  </p>
                  <p className="text-gray-600">Note moyenne</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Today's Schedule */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-bold text-black">
                Agenda d'aujourd'hui
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {todayItems.map((booking) => (
                <div
                  key={booking.id}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="flex items-center mb-1">
                        <Clock className="h-4 w-4 mr-2 text-gray-500" />
                        <span className="font-semibold text-black">
                          {new Date(booking.starts_at).toLocaleTimeString(
                            "fr-FR",
                            { hour: "2-digit", minute: "2-digit" }
                          )}
                        </span>
                      </div>
                      <h3 className="font-medium text-black">
                        {booking.client}
                      </h3>
                      <p className="text-sm text-gray-600">{booking.service}</p>
                    </div>
                    <Badge
                      variant="outline"
                      className={
                        booking.status === "CONFIRMED"
                          ? "text-green-600 border-green-600"
                          : "text-orange-600 border-orange-600"
                      }
                    >
                      {booking.status}
                    </Badge>
                  </div>

                  <div className="flex justify-between items-center text-sm text-gray-600">
                    <span>{booking.duration_minutes}min</span>
                    <span className="font-semibold text-black">
                      {formatMoney(booking.price_cents)}
                    </span>
                  </div>

                  <div className="flex space-x-2 mt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-blue-600 border-blue-600 hover:bg-blue-50 bg-transparent"
                    >
                      Modifier
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-gray-600 border-gray-300 bg-transparent"
                    >
                      Contacter
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-bold text-black">
                Actions rapides
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <CreateReservationModal
                trigger={
                  <Button className="w-full bg-black text-white hover:bg-gray-800 h-12">
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter un RDV
                  </Button>
                }
              />

              <Link href="/pro/services" className="block">
                <Button
                  variant="outline"
                  className="w-full border-black text-black hover:bg-gray-50 h-12 bg-transparent"
                >
                  <Users className="h-4 w-4 mr-2" />
                  Gérer mes services
                </Button>
              </Link>

              <Link href="/pro/profil-institut" className="block">
                <Button
                  variant="outline"
                  className="w-full border-black text-black hover:bg-gray-50 h-12 bg-transparent"
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Modifier mes horaires
                </Button>
              </Link>

              <Link href="/pro/statistiques" className="block">
                <Button
                  variant="outline"
                  className="w-full border-black text-black hover:bg-gray-50 h-12 bg-transparent"
                >
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Voir les statistiques
                </Button>
              </Link>

              <div className="pt-4 border-t border-gray-200">
                <h4 className="font-semibold text-black mb-3">
                  Notifications récentes
                </h4>
                <div className="space-y-2 text-sm">
                  {(notifications || []).length === 0 && (
                    <div className="p-2 bg-gray-50 rounded">
                      <p className="text-gray-700">
                        Aucune notification récente
                      </p>
                    </div>
                  )}
                  {(notifications || []).map((n: any) => {
                    const t = (n.type || "").toLowerCase();
                    const color = t.includes("payment")
                      ? { bg: "bg-green-50", text: "text-green-800" }
                      : t.includes("cancel")
                      ? { bg: "bg-orange-50", text: "text-orange-800" }
                      : { bg: "bg-blue-50", text: "text-blue-800" };
                    const message =
                      typeof n.payload?.message === "string"
                        ? n.payload.message
                        : n.type;
                    return (
                      <div key={n.id} className={`p-2 rounded ${color.bg}`}>
                        <p className={`${color.text}`}>{message}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
