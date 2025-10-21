import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function ClientDetailsPage({ params }: { params: { id: string } }) {
  const isUuid = /^[0-9a-fA-F-]{36}$/;
  if (!isUuid.test(params.id)) {
    return (
      <div className="p-6">
        <p>Client introuvable.</p>
        <Link href="/pro/clients" className="text-blue-600 underline">Retour</Link>
      </div>
    );
  }

  const client = await prisma.clients.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      first_name: true,
      last_name: true,
      phone: true,
      notes: true,
      users: { select: { email: true } },
      reservations: { select: { id: true, starts_at: true, status: true }, orderBy: { starts_at: "desc" }, take: 10 },
    },
  });

  if (!client) {
    return (
      <div className="p-6">
        <p>Client introuvable.</p>
        <Link href="/pro/clients" className="text-blue-600 underline">Retour</Link>
      </div>
    );
  }

  const name = `${client.first_name || ""} ${client.last_name || ""}`.trim() || "Client";

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-black">{name}</h1>
        <Link href={`/pro/clients/${client.id}/edit`} className="text-sm text-blue-600 underline">Modifier</Link>
      </div>
      <Card>
        <CardContent className="p-6 space-y-2">
          <div><span className="text-gray-600">Email:</span> {client.users?.email || "—"}</div>
          <div><span className="text-gray-600">Téléphone:</span> {client.phone || "—"}</div>
          <div><span className="text-gray-600">Notes:</span> {client.notes || "—"}</div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-6">
          <h2 className="font-semibold mb-3">Derniers rendez-vous</h2>
          <div className="space-y-2 text-sm">
            {client.reservations.map(r => (
              <div key={r.id} className="flex items-center justify-between border p-2 rounded">
                <div>{new Date(r.starts_at).toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" })}</div>
                <Badge variant="outline">{r.status}</Badge>
              </div>
            ))}
            {client.reservations.length === 0 && <div className="text-gray-600">Aucun RDV</div>}
          </div>
        </CardContent>
      </Card>
      <Link href="/pro/clients" className="text-blue-600 underline">← Retour à la liste</Link>
    </div>
  );
}
