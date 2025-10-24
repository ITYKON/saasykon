"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Eye, Edit, Trash2, Shield, User } from "lucide-react";

type AccountItem = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  status: string;
  profession: string | null;
  permissions: string[];
  last_login_at: string | null;
};

export default function ComptesEmployesPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [roleFilter, setRoleFilter] = useState<string>("");
  const [items, setItems] = useState<AccountItem[]>([]);
  const [total, setTotal] = useState(0);
  const [active, setActive] = useState(0);
  const [rolesBreakdown, setRolesBreakdown] = useState<
    { role: string; count: number }[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [roles, setRoles] = useState<
    {
      code: string;
      name: string;
      permissions?: { code: string; description?: string }[];
    }[]
  >([]);
  const [proPermissions, setProPermissions] = useState<
    { code: string; description?: string }[]
  >([]);
  const [employees, setEmployees] = useState<{ id: string; name: string }[]>(
    []
  );
  const [createEmployeeId, setCreateEmployeeId] = useState<string>("");
  const [createEmail, setCreateEmail] = useState<string>("");
  const [selectedRoleCodes, setSelectedRoleCodes] = useState<string[]>([]);
  const [selectedPermissionCodes, setSelectedPermissionCodes] = useState<
    string[]
  >([]);
  const [createEmployeeRole, setCreateEmployeeRole] = useState<string>("");
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editTargetId, setEditTargetId] = useState<string>("");
  const [editStatus, setEditStatus] = useState<string>("Actif");
  const [editSelectedPermissionCodes, setEditSelectedPermissionCodes] =
    useState<string[]>([]);
  const [editEmployeeRole, setEditEmployeeRole] = useState<string>("");
  const [editLoading, setEditLoading] = useState<boolean>(false);
  const [editSaving, setEditSaving] = useState<boolean>(false);
  const [initialEditSnapshot, setInitialEditSnapshot] = useState<any>(null);
  const [editName, setEditName] = useState<string>("");
  const [editEmail, setEditEmail] = useState<string>("");
  const [viewOpen, setViewOpen] = useState(false);
  const [viewData, setViewData] = useState<any>(null);
  const [customCreateRole, setCustomCreateRole] = useState<string>("");
  const [customEditRole, setCustomEditRole] = useState<string>("");
  const [createPermQuery, setCreatePermQuery] = useState<string>("");

  const employeeRoleOptions = [
    { value: "admin_institut", label: "Admin Institut" },
    { value: "manager", label: "Manager" },
    { value: "gestionnaire", label: "Gestionnaire" },
    { value: "receptionniste", label: "Réceptionniste" },
    { value: "praticien", label: "Praticien" },
    { value: "agent_commercial", label: "Agent commercial" },
  ];

  // Show all institute-scoped roles returned by the API (business-specific). No whitelist filter.

  useEffect(() => {
    loadProPermissions();
  }, []);

  function handleRoleToggle(code: string, checked: boolean) {
    setSelectedRoleCodes((prev) =>
      checked
        ? Array.from(new Set([...prev, code]))
        : prev.filter((c) => c !== code)
    );
  }

  function isEditDirtyFn(): boolean {
    if (!initialEditSnapshot) return true;
    const currentActive = editStatus === "Actif";
    const currentRole = editEmployeeRole || "";
    const snapPerms = new Set(initialEditSnapshot.permission_codes || []);
    const curPerms = new Set(editSelectedPermissionCodes || []);
    const permsChanged =
      snapPerms.size !== curPerms.size ||
      [...curPerms].some((c) => !snapPerms.has(c));
    return (
      currentActive !== !!initialEditSnapshot.is_active ||
      currentRole !== (initialEditSnapshot.role || "") ||
      permsChanged
    );
  }
  async function loadProPermissions() {
    try {
      const bidMatch =
        typeof document !== "undefined"
          ? document.cookie.match(/(?:^|; )business_id=([^;]+)/)
          : null;
      const businessId = bidMatch ? decodeURIComponent(bidMatch[1]) : "";
      const sep = businessId
        ? `?business_id=${encodeURIComponent(businessId)}`
        : "";
      const res = await fetch(`/api/pro/pro-permissions${sep}`);
      const data = await res.json();
      if (res.ok)
        setProPermissions(
          (data?.permissions || []).map((p: any) => ({
            code: p.code,
            description: p.description,
          }))
        );
    } catch {}
  }

  function handlePermToggle(code: string, checked: boolean, isEdit?: boolean) {
    if (isEdit) {
      setEditSelectedPermissionCodes((prev) =>
        checked
          ? Array.from(new Set([...prev, code]))
          : prev.filter((c) => c !== code)
      );
    } else {
      setSelectedPermissionCodes((prev) =>
        checked
          ? Array.from(new Set([...prev, code]))
          : prev.filter((c) => c !== code)
      );
    }
  }

  async function openEdit(account: AccountItem) {
    setEditTargetId(account.id);
    setIsEditOpen(true);
    setEditLoading(true);
    try {
      const bidMatch =
        typeof document !== "undefined"
          ? document.cookie.match(/(?:^|; )business_id=([^;]+)/)
          : null;
      const businessId = bidMatch ? decodeURIComponent(bidMatch[1]) : "";
      const sep = businessId
        ? `?business_id=${encodeURIComponent(businessId)}`
        : "";
      const res = await fetch(`/api/pro/employee-accounts/${account.id}${sep}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Erreur de chargement");
      // Prefill from fresh server data
      setEditName(data.name || account.name || "");
      setEditEmail(data.email || account.email || "");
      setEditStatus(data.is_active ? "Actif" : "Inactif");
      // Map fetched label to select code if possible; else put into custom field (with fallback to account.profession)
      const byLabel = new Map(
        employeeRoleOptions.map((o) => [o.label, o.value])
      );
      const label = ((data.role || account.profession || "") as string).trim();
      const mappedCode = byLabel.get(label);
      if (mappedCode) {
        setEditEmployeeRole(mappedCode);
        setCustomEditRole("");
      } else {
        setEditEmployeeRole("");
        setCustomEditRole(label);
      }
      const permsFromApi = (data.permission_codes || []) as string[];
      const permsFallback = (account.permissions || []) as string[];
      setEditSelectedPermissionCodes(
        permsFromApi.length ? permsFromApi : permsFallback
      );
      setInitialEditSnapshot({
        is_active: !!data.is_active,
        role: label,
        permission_codes: permsFromApi.length ? permsFromApi : permsFallback,
      });
    } catch (e: any) {
      alert(e?.message || "Erreur");
    } finally {
      setEditLoading(false);
    }
  }

  async function openView(account: AccountItem) {
    try {
      const bidMatch =
        typeof document !== "undefined"
          ? document.cookie.match(/(?:^|; )business_id=([^;]+)/)
          : null;
      const businessId = bidMatch ? decodeURIComponent(bidMatch[1]) : "";
      const sep = businessId
        ? `?business_id=${encodeURIComponent(businessId)}`
        : "";
      const res = await fetch(`/api/pro/employee-accounts/${account.id}${sep}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Erreur de chargement");
      setViewData(data);
      setViewOpen(true);
    } catch (e: any) {
      alert(e?.message || "Erreur");
    }
  }

  async function handleSaveEdit() {
    if (!editTargetId) return;
    try {
      setEditSaving(true);
      const bidMatch =
        typeof document !== "undefined"
          ? document.cookie.match(/(?:^|; )business_id=([^;]+)/)
          : null;
      const businessId = bidMatch ? decodeURIComponent(bidMatch[1]) : "";
      const sep = businessId
        ? `?business_id=${encodeURIComponent(businessId)}`
        : "";
      const res = await fetch(
        `/api/pro/employee-accounts/${editTargetId}${sep}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            is_active: editStatus === "Actif",
            profession: editEmployeeRole,
            permission_codes: editSelectedPermissionCodes,
          }),
        }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Enregistrement échoué");
      setIsEditOpen(false);
      setInitialEditSnapshot(null);
      await loadData();
      // simple toast
      console.log("Modifications enregistrées");
    } catch (e: any) {
      alert(e?.message || "Erreur");
    } finally {
      setEditSaving(false);
    }
  }

  async function handleUnlinkAccount() {
    if (!editTargetId) return;
    if (!confirm("Délier le compte utilisateur de cet employé ?")) return;
    try {
      const bidMatch =
        typeof document !== "undefined"
          ? document.cookie.match(/(?:^|; )business_id=([^;]+)/)
          : null;
      const businessId = bidMatch ? decodeURIComponent(bidMatch[1]) : "";
      const sep = businessId
        ? `?business_id=${encodeURIComponent(businessId)}`
        : "";
      const res = await fetch(
        `/api/pro/employee-accounts/${editTargetId}${sep}`,
        { method: "DELETE" }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Échec du déliage");
      setIsEditOpen(false);
      setEditTargetId("");
      await loadData();
      alert("Compte délié");
    } catch (e: any) {
      alert(e?.message || "Erreur");
    }
  }

  async function loadData() {
    setLoading(true);
    try {
      const q = new URLSearchParams();
      if (searchTerm) q.set("q", searchTerm);
      if (statusFilter && statusFilter !== "all") q.set("status", statusFilter);
      if (roleFilter) q.set("role", roleFilter);
      const bidMatch =
        typeof document !== "undefined"
          ? document.cookie.match(/(?:^|; )business_id=([^;]+)/)
          : null;
      const businessId = bidMatch ? decodeURIComponent(bidMatch[1]) : "";
      if (businessId) q.set("business_id", businessId);
      const res = await fetch(`/api/pro/employee-accounts?${q.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Erreur de chargement");
      const list: AccountItem[] = Array.isArray(data?.items) ? data.items : [];
      setItems(list);
      setTotal(Number(data?.total || 0));
      setActive(Number(data?.active || 0));
      setRolesBreakdown(
        Array.isArray(data?.roles_breakdown) ? data.roles_breakdown : []
      );
    } catch {
    } finally {
      setLoading(false);
    }
  }

  async function loadRoles() {
    try {
      const bidMatch =
        typeof document !== "undefined"
          ? document.cookie.match(/(?:^|; )business_id=([^;]+)/)
          : null;
      const businessId = bidMatch ? decodeURIComponent(bidMatch[1]) : "";
      const sep = businessId
        ? `&business_id=${encodeURIComponent(businessId)}`
        : "";
      const res = await fetch(`/api/pro/roles?scope=institute${sep}`);
      const data = await res.json();
      if (res.ok)
        setRoles(
          (data?.roles || []).map((r: any) => ({
            code: r.code,
            name: r.name,
            permissions: r.permissions || [],
          }))
        );
    } catch {}
  }

  async function loadEmployeesForCreate() {
    try {
      const bidMatch =
        typeof document !== "undefined"
          ? document.cookie.match(/(?:^|; )business_id=([^;]+)/)
          : null;
      const businessId = bidMatch ? decodeURIComponent(bidMatch[1]) : "";
      const sep = businessId
        ? `&business_id=${encodeURIComponent(businessId)}`
        : "";
      const res = await fetch(`/api/pro/employees?limit=200${sep}`);
      const data = await res.json();
      if (res.ok) {
        const list = Array.isArray(data?.items) ? data.items : [];
        setEmployees(list.map((e: any) => ({ id: e.id, name: e.full_name })));
      }
    } catch {}
  }

  useEffect(() => {
    loadData();
  }, [searchTerm, statusFilter, roleFilter]);

  useEffect(() => {
    loadData();
    loadRoles();
    loadProPermissions();
  }, []);

  useEffect(() => {
    if (isCreateModalOpen) loadEmployeesForCreate();
  }, [isCreateModalOpen]);

  async function handleCreateAccount() {
    if (!createEmployeeId || !createEmail) {
      alert("Employé et email requis");
      return;
    }
    if (!(customCreateRole || createEmployeeRole)) {
      alert("Veuillez choisir un rôle ou saisir un rôle personnalisé");
      return;
    }
    try {
      const bidMatch =
        typeof document !== "undefined"
          ? document.cookie.match(/(?:^|; )business_id=([^;]+)/)
          : null;
      const businessId = bidMatch ? decodeURIComponent(bidMatch[1]) : "";
      const sep = businessId
        ? `?business_id=${encodeURIComponent(businessId)}`
        : "";
      const res = await fetch(`/api/pro/employee-accounts${sep}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employee_id: createEmployeeId,
          user_email: createEmail,
          role_codes: selectedRoleCodes,
          employee_role: customCreateRole || createEmployeeRole,
          permission_codes: selectedPermissionCodes,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Création du compte échouée");
      setIsCreateModalOpen(false);
      setCreateEmployeeId("");
      setCreateEmail("");
      setSelectedRoleCodes([]);
      await loadData();
      alert("Compte employé créé");
    } catch (e: any) {
      alert(e?.message || "Erreur de création");
    }
  }

  return (
    <div>
      <header className="bg-white border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Comptes Employés
              </h1>
              <p className="text-gray-600">
                Gérez les comptes et permissions de vos employés
              </p>
            </div>
            <Dialog
              open={isCreateModalOpen}
              onOpenChange={setIsCreateModalOpen}
            >
              <DialogTrigger asChild>
                <Button className="bg-black hover:bg-gray-800">
                  <Plus className="h-4 w-4 mr-2" />
                  Nouveau Compte
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg w-[92vw] p-6 max-h-[80vh] overflow-auto">
                <DialogHeader>
                  <DialogTitle>Créer un compte employé</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="rounded-lg border bg-white shadow-sm p-4 space-y-4">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      className="w-full"
                      placeholder="email@exemple.com"
                      value={createEmail}
                      onChange={(e) => setCreateEmail(e.target.value)}
                    />

                    <div>
                      <Label htmlFor="employee">Employé</Label>
                      <Select
                        value={createEmployeeId || undefined}
                        onValueChange={setCreateEmployeeId}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Sélectionner un employé" />
                        </SelectTrigger>
                        <SelectContent>
                          {employees.map((e) => (
                            <SelectItem key={e.id} value={e.id}>
                              {e.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="empRole">Rôle Employé (Institut)</Label>
                      <Select
                        value={createEmployeeRole || undefined}
                        onValueChange={setCreateEmployeeRole}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Sélectionner un rôle" />
                        </SelectTrigger>
                        <SelectContent>
                          {employeeRoleOptions.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <div className="mt-2">
                        <Input
                          className="w-full"
                          placeholder="Ou saisir un rôle personnalisé (ex: Réceptionniste)"
                          value={customCreateRole}
                          onChange={(e) => setCustomCreateRole(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="rounded-lg border bg-white shadow-sm p-3 flex flex-col max-h-[50vh] overflow-hidden">
                      <div className="flex items-center justify-between mb-3">
                        <div className="font-medium text-sm text-gray-700">Pages et actions (Espace Pro)</div>
                        <div className="ml-2 flex items-center gap-2">
                          <Button type="button" variant="ghost" onClick={() => setSelectedPermissionCodes(proPermissions.map((p) => p.code))}>Tout sélectionner</Button>
                          <Button type="button" variant="ghost" onClick={() => setSelectedPermissionCodes([])}>Tout désélectionner</Button>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mb-3">
                        <Input
                          className="flex-1"
                          placeholder="Rechercher une permission..."
                          value={createPermQuery}
                          onChange={(e) => setCreatePermQuery(e.target.value)}
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 overflow-auto pr-1">
                        {(proPermissions.filter((p) =>
                          createPermQuery
                            ? (p.code
                                .toLowerCase()
                                .includes(createPermQuery.toLowerCase()) ||
                              (p.description || "")
                                .toLowerCase()
                                .includes(createPermQuery.toLowerCase()))
                            : true
                        )).map((p) => (
                          <div key={p.code} className="flex items-start space-x-2">
                            <Checkbox
                              id={`perm-${p.code}`}
                              checked={selectedPermissionCodes.includes(
                                p.code
                              )}
                              onCheckedChange={(checked) =>
                                handlePermToggle(p.code, checked as boolean)
                              }
                              className="mt-1"
                            />
                            <div className="grid gap-0.5 leading-tight min-w-0">
                              <label
                                htmlFor={`perm-${p.code}`}
                                className="text-sm font-medium leading-tight truncate"
                                title={p.description || p.code}
                              >
                                {p.code}
                              </label>
                            </div>
                          </div>
                        ))}
                      </div>
                  </div>
                </div>
                <div className="pt-4 mt-4 border-t flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsCreateModalOpen(false)} className="min-w-[120px]">Annuler</Button>
                  <Button className="bg-black hover:bg-gray-800 min-w-[120px]" onClick={handleCreateAccount}>Créer le compte</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <User className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Total Employés
                </p>
                <p className="text-2xl font-bold text-gray-900">{total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Shield className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Comptes Actifs
                </p>
                <p className="text-2xl font-bold text-gray-900">{active}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <User className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Praticiens</p>
                <p className="text-2xl font-bold text-gray-900">
                  {rolesBreakdown.find(
                    (r) => (r.role || "").toLowerCase() === "praticien"
                  )?.count || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <User className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Réceptionnistes
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {rolesBreakdown.find(
                    (r) =>
                      (r.role || "").toLowerCase() === "réceptionniste" ||
                      (r.role || "").toLowerCase() === "receptionniste"
                  )?.count || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recherche et filtres */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Rechercher par nom, email ou rôle..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select
              value={statusFilter || undefined}
              onValueChange={setStatusFilter}
            >
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filtrer par statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="active">Actif</SelectItem>
                <SelectItem value="inactive">Inactif</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tableau des comptes */}
      <Card>
        <CardHeader>
          <CardTitle>Comptes Employés</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employé</TableHead>
                <TableHead>Rôle</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Permissions</TableHead>
                <TableHead>Dernière connexion</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((account) => (
                <TableRow key={account.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{account.name}</div>
                      <div className="text-sm text-gray-500">
                        {account.email || "-"}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{account.profession || "-"}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        account.status === "Actif" ? "default" : "secondary"
                      }
                      className={
                        account.status === "Actif"
                          ? "bg-green-100 text-green-800"
                          : ""
                      }
                    >
                      {account.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {account.permissions.slice(0, 4).map((permission) => (
                        <Badge
                          key={permission}
                          variant="outline"
                          className="text-xs"
                        >
                          {proPermissions.find((p) => p.code === permission)
                            ?.code || permission}
                        </Badge>
                      ))}
                      {account.permissions.length > 4 && (
                        <Badge variant="outline" className="text-xs">
                          +{account.permissions.length - 4}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-gray-500">
                    {account.last_login_at
                      ? new Date(account.last_login_at).toLocaleString()
                      : "-"}
                  </TableCell>
                  <TableCell className="space-x-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => openView(account)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => openEdit(account)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        try {
                          const bidMatch =
                            typeof document !== "undefined"
                              ? document.cookie.match(
                                  /(?:^|; )business_id=([^;]+)/
                                )
                              : null;
                          const businessId = bidMatch
                            ? decodeURIComponent(bidMatch[1])
                            : "";
                          const sep = businessId
                            ? `?business_id=${encodeURIComponent(
                                businessId
                              )}`
                            : "";
                          const res = await fetch(
                            `/api/pro/employee-accounts/${account.id}/resend-invite${sep}`,
                            { method: "POST" }
                          );
                          if (!res.ok) {
                            const d = await res.json().catch(() => ({}));
                            throw new Error(d?.error || `Erreur ${res.status}`);
                          }
                          alert("Invitation renvoyée");
                        } catch (e: any) {
                          alert(e?.message || "Erreur envoi invitation");
                        }
                      }}
                    >
                      Renvoyer l’invitation
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700 bg-transparent"
                      onClick={async () => {
                        if (!confirm("Supprimer ce compte employé ?")) return;
                        try {
                          const bidMatch =
                            typeof document !== "undefined"
                              ? document.cookie.match(
                                  /(?:^|; )business_id=([^;]+)/
                                )
                              : null;
                          const businessId = bidMatch
                            ? decodeURIComponent(bidMatch[1])
                            : "";
                          const sep = businessId
                            ? `?business_id=${encodeURIComponent(
                                businessId
                              )}&hard=true`
                            : "?hard=true";
                          const res = await fetch(
                            `/api/pro/employee-accounts/${account.id}${sep}`,
                            { method: "DELETE" }
                          );
                          const data = await res.json().catch(() => ({}));
                          if (!res.ok)
                            throw new Error(
                              data?.error || "Suppression échouée"
                            );
                          await loadData();
                        } catch (e: any) {
                          alert(e?.message || "Erreur");
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Account Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Modifier le compte employé</DialogTitle>
            {(editName || editEmail) && (
              <div className="text-sm text-muted-foreground">
                {editName}
                {editName && editEmail ? " • " : ""}
                {editEmail}
              </div>
            )}
          </DialogHeader>
          {editLoading ? (
            <div className="py-10 text-sm text-gray-500">
              Chargement des informations...
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label>Statut</Label>
                  <Select value={editStatus} onValueChange={setEditStatus}>
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Actif">Actif</SelectItem>
                      <SelectItem value="Inactif">Inactif</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Rôle Employé (Institut)</Label>
                  <Select
                    value={editEmployeeRole || undefined}
                    onValueChange={setEditEmployeeRole}
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent>
                      {employeeRoleOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="mt-2">
                    <Input
                      placeholder="Ou saisir un rôle personnalisé"
                      value={customEditRole}
                      onChange={(e) => setCustomEditRole(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Si renseigné, ce libellé remplace la sélection ci-dessus.
                    </p>
                  </div>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between">
                  <Label>Rôles (permissions d'accès)</Label>
                  <span className="text-xs text-muted-foreground">
                    {editSelectedPermissionCodes.length} sélectionnée(s)
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  {proPermissions.map((p) => (
                    <div key={p.code} className="flex items-start space-x-2">
                      <Checkbox
                        id={`edit-${p.code}`}
                        checked={editSelectedPermissionCodes.includes(p.code)}
                        onCheckedChange={(c) => {
                          const checked = Boolean(c as any);
                          handlePermToggle(p.code, checked, true);
                        }}
                      />
                      <div className="grid gap-1 leading-none">
                        <label
                          htmlFor={`edit-${p.code}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {p.code}
                        </label>
                        <p className="text-xs text-muted-foreground">
                          {p.description || ""}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex justify-between">
                <Button
                  variant="destructive"
                  onClick={handleUnlinkAccount}
                  disabled={editSaving}
                >
                  Délier le compte
                </Button>
                <div className="space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsEditOpen(false)}
                    disabled={editSaving}
                  >
                    Annuler
                  </Button>
                  <Button
                    className="bg-black hover:bg-gray-800"
                    disabled={!isEditDirtyFn() || editSaving}
                    onClick={() => {
                      setEditEmployeeRole(customEditRole || editEmployeeRole);
                      handleSaveEdit();
                    }}
                  >
                    {editSaving ? "Enregistrement..." : "Enregistrer"}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* View Account Dialog */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Détails du compte</DialogTitle>
          </DialogHeader>
          {viewData ? (
            <div className="space-y-3">
              <div>
                <Label>Employé</Label>
                <div>{viewData.name}</div>
              </div>
              <div>
                <Label>Email</Label>
                <div>{viewData.email || "-"}</div>
              </div>
              <div>
                <Label>Rôle</Label>
                <div>{viewData.role || "-"}</div>
              </div>
              <div>
                <Label>Permissions</Label>
                <div className="flex flex-wrap gap-1 mt-1">
                  {(viewData.permission_codes || []).map((c: string) => (
                    <Badge key={c} variant="outline" className="text-xs">
                      {c}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-sm text-gray-500">Chargement...</div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
