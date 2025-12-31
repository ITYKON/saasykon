| Categorie | Methode | Endpoint | Description |
|---|---|---|---|
| admin | GET | /api/admin/archives | GET /api/admin/archives?type=utilisateurs|salons|reservations|abonnements&q=&page=&pageSize= |
| admin | DELETE | /api/admin/archives | Attempts permanent deletion. May fail if foreign key constraints exist. |
| admin | POST | /api/admin/archives/restore | POST /api/admin/archives/restore  body: { type, id } |
| admin | GET | /api/admin/archives/stats | GET /api/admin/archives/stats |
| admin | GET | /api/admin/business-ownership-transfers | Pas de description |
| admin | POST | /api/admin/business-ownership-transfers/[id] | Pas de description |
| admin | GET | /api/admin/business-ownership-transfers/[id] | Pas de description |
| admin | POST | /api/admin/businesses/[id]/verify | Pas de description |
| admin | GET | /api/admin/claims | Pas de description |
| admin | GET | /api/admin/claims/[id] | Pas de description |
| admin | POST | /api/admin/claims/[id]/verify | Pas de description |
| admin | GET | /api/admin/dashboard | Pas de description |
| admin | GET | /api/admin/dashboard/actions/export-financials | Pas de description |
| admin | GET | /api/admin/dashboard/actions/validate-pending-salons | Pas de description |
| admin | POST | /api/admin/dashboard/actions/validate-pending-salons | Pas de description |
| admin | GET | /api/admin/leads | Pas de description |
| admin | PATCH | /api/admin/leads | Pas de description |
| admin | GET | /api/admin/leads/[id] | Pas de description |
| admin | POST | /api/admin/leads/[id]/convert | Pas de description |
| admin | POST | /api/admin/leads/[id]/status | Pas de description |
| admin | GET | /api/admin/permissions | Pas de description |
| admin | GET | /api/admin/plans | GET /api/admin/plans Récupère tous les plans d'abonnement avec leurs features |
| admin | GET | /api/admin/plans/[id] | GET /api/admin/plans/[id] Récupère un plan spécifique |
| admin | PUT | /api/admin/plans/[id] | PUT /api/admin/plans/[id] Met à jour un plan d'abonnement |
| admin | GET | /api/admin/reservations | GET: Liste toutes les réservations avec infos client, service, salon |
| admin | POST | /api/admin/reservations | Pas de description |
| admin | GET | /api/admin/roles | Pas de description |
| admin | POST | /api/admin/roles | Pas de description |
| admin | PUT | /api/admin/roles | Pas de description |
| admin | DELETE | /api/admin/roles | Pas de description |
| admin | GET | /api/admin/roles/[id] | Pas de description |
| admin | POST | /api/admin/roles/assign | Pas de description |
| admin | DELETE | /api/admin/roles/assign | Pas de description |
| admin | GET | /api/admin/salons | Pas de description |
| admin | POST | /api/admin/salons | Pas de description |
| admin | PUT | /api/admin/salons | Pas de description |
| admin | PATCH | /api/admin/salons | Pas de description |
| admin | DELETE | /api/admin/salons | Pas de description |
| admin | PATCH | /api/admin/salons/[id]/status | Pas de description |
| admin | GET | /api/admin/statistics | Pas de description |
| admin | GET | /api/admin/statistics/export | Pas de description |
| admin | GET | /api/admin/users | GET: Liste tous les utilisateurs |
| admin | DELETE | /api/admin/users | DELETE: Supprime un utilisateur (soft delete) |
| admin | PUT | /api/admin/users | PUT: Modifie un utilisateur |
| admin | GET | /api/admin/verifications | Pas de description |
| auth | POST | /api/auth/invite/complete | Pas de description |
| auth | POST | /api/auth/invite/verify | Pas de description |
| auth | POST | /api/auth/login | Pas de description |
| auth | POST | /api/auth/logout | Pas de description |
| auth | GET | /api/auth/me | Pas de description |
| auth | POST | /api/auth/password/request | Pas de description |
| auth | POST | /api/auth/password/reset | Pas de description |
| auth | GET | /api/auth/password/verify-token | Pas de description |
| auth | POST | /api/auth/register | Pas de description |
| auth | POST | /api/auth/set-password | Pas de description |
| business | GET | /api/business/verification | Pas de description |
| business | POST | /api/business/verification | Pas de description |
| businesses | POST | /api/businesses/[id]/claim | Pas de description |
| businesses | GET | /api/businesses/[id]/claim | Pas de description |
| businesses | POST | /api/businesses/[id]/transfer-ownership | Pas de description |
| businesses | GET | /api/businesses/[id]/transfer-ownership | Pas de description |
| categories | GET | /api/categories | Pas de description |
| cities | GET | /api/cities | Pas de description |
| claims | POST | /api/claims | Pas de description |
| claims | POST | /api/claims/complete | Pas de description |
| claims | POST | /api/claims/documents | Pas de description |
| claims | GET | /api/claims/verify | Pas de description |
| client | GET | /api/client/address | GET: return only the primary (default) address for the user (or first if none flagged) |
| client | PUT | /api/client/address | PUT: upsert the user's single primary address (replaces previous) |
| client | GET | /api/client/addresses | List addresses of current user |
| client | POST | /api/client/addresses | Create address |
| client | PUT | /api/client/addresses | Update address by id (must belong to user) |
| client | DELETE | /api/client/addresses | Delete address by id (must belong to user) |
| client | GET | /api/client/bookings | Pas de description |
| client | POST | /api/client/bookings | Créer une réservation par le client |
| client | PUT | /api/client/bookings | Modifier une réservation par le client (reprogrammer) |
| client | PATCH | /api/client/bookings | Annuler une réservation par le client |
| client | GET | /api/client/bookings/[id] | GET: Récupérer les détails d'une réservation spécifique |
| client | GET | /api/client/bookings/[id]/history | GET: Récupérer l'historique des changements de statut d'une réservation |
| client | GET | /api/client/dashboard | Pas de description |
| client | GET | /api/client/favorites | Pas de description |
| client | POST | /api/client/favorites | Pas de description |
| client | DELETE | /api/client/favorites | Pas de description |
| client | GET | /api/client/preferences | GET: return user's notification preferences (create defaults if missing) |
| client | PUT | /api/client/preferences | PUT: update user's notification preferences |
| client | GET | /api/client/profile | Pas de description |
| client | PUT | /api/client/profile | Pas de description |
| client | POST | /api/client/profile/avatar | Pas de description |
| client | GET | /api/client/reviews | GET: Récupérer les avis du client |
| client | POST | /api/client/reviews | POST: Créer un avis |
| client | PUT | /api/client/reviews | PUT: Modifier un avis |
| client | DELETE | /api/client/reviews | DELETE: Supprimer un avis |
| client | GET | /api/client/stats | GET: Statistiques détaillées du client |
| lead | POST | /api/lead | Pas de description |
| leads | POST | /api/leads | Pas de description |
| pro | PATCH | /api/pro/addons/[addonId] | Pas de description |
| pro | DELETE | /api/pro/addons/[addonId] | Pas de description |
| pro | GET | /api/pro/agenda/day | Pas de description |
| pro | GET | /api/pro/agenda/month | Pas de description |
| pro | GET | /api/pro/agenda/today | Pas de description |
| pro | GET | /api/pro/agenda/week | Pas de description |
| pro | POST | /api/pro/appointments | Pas de description |
| pro | GET | /api/pro/archives/accounts | Pas de description |
| pro | POST | /api/pro/archives/accounts | Restore account: reactivate the employee |
| pro | DELETE | /api/pro/archives/accounts | Permanently delete account link (unlink user) without deleting employee |
| pro | GET | /api/pro/archives/reservations | Pas de description |
| pro | POST | /api/pro/archives/reservations | Restore a cancelled reservation: set cancelled_at null and status to PENDING if currently CANCELLED |
| pro | GET | /api/pro/archives/services | Pas de description |
| pro | POST | /api/pro/archives/services | Restore a service from archives (reactivate) |
| pro | DELETE | /api/pro/archives/services | Permanently delete a service (may fail on FK constraints) |
| pro | GET | /api/pro/business/profile | Pas de description |
| pro | PUT | /api/pro/business/profile | Pas de description |
| pro | GET | /api/pro/claim | Pas de description |
| pro | GET | /api/pro/claim/token | Pas de description |
| pro | GET | /api/pro/clients | Pas de description |
| pro | POST | /api/pro/clients | Pas de description |
| pro | GET | /api/pro/clients/[id] | Pas de description |
| pro | PATCH | /api/pro/clients/[id] | Pas de description |
| pro | DELETE | /api/pro/clients/[id] | Pas de description |
| pro | GET | /api/pro/clients/search | Pas de description |
| pro | GET | /api/pro/dashboard | Pas de description |
| pro | GET | /api/pro/dashboard/statistics | Pas de description |
| pro | GET | /api/pro/debug-auth | Pas de description |
| pro | GET | /api/pro/employee-accounts | Pas de description |
| pro | POST | /api/pro/employee-accounts | Pas de description |
| pro | PATCH | /api/pro/employee-accounts/[id] | Pas de description |
| pro | DELETE | /api/pro/employee-accounts/[id] | Pas de description |
| pro | GET | /api/pro/employee-accounts/[id] | Pas de description |
| pro | POST | /api/pro/employee-accounts/[id]/resend-invite | Pas de description |
| pro | GET | /api/pro/employees | Pas de description |
| pro | POST | /api/pro/employees | Pas de description |
| pro | GET | /api/pro/employees/[id] | Pas de description |
| pro | PATCH | /api/pro/employees/[id] | Pas de description |
| pro | DELETE | /api/pro/employees/[id] | Pas de description |
| pro | GET | /api/pro/employees/[id]/account | Pas de description |
| pro | POST | /api/pro/employees/[id]/account | Pas de description |
| pro | DELETE | /api/pro/employees/[id]/account | Pas de description |
| pro | GET | /api/pro/employees/[id]/availability | Pas de description |
| pro | PUT | /api/pro/employees/[id]/availability | Pas de description |
| pro | GET | /api/pro/employees/[id]/hours | Pas de description |
| pro | PUT | /api/pro/employees/[id]/hours | Pas de description |
| pro | GET | /api/pro/employees/[id]/roles | Pas de description |
| pro | PUT | /api/pro/employees/[id]/roles | Pas de description |
| pro | GET | /api/pro/employees/[id]/services | Pas de description |
| pro | PUT | /api/pro/employees/[id]/services | Pas de description |
| pro | GET | /api/pro/employees/[id]/time-off | Pas de description |
| pro | POST | /api/pro/employees/[id]/time-off | Pas de description |
| pro | GET | /api/pro/filters/categories | Pas de description |
| pro | GET | /api/pro/filters/services | Pas de description |
| pro | GET | /api/pro/guard | Pas de description |
| pro | GET | /api/pro/me | Pas de description |
| pro | GET | /api/pro/notifications | Pas de description |
| pro | POST | /api/pro/notifications/mark-read | Pas de description |
| pro | POST | /api/pro/onboarding/complete | Pas de description |
| pro | GET | /api/pro/permissions | Pas de description |
| pro | POST | /api/pro/permissions | Pas de description |
| pro | GET | /api/pro/pro-permissions | Pas de description |
| pro | GET | /api/pro/reservations | Pas de description |
| pro | GET | /api/pro/reservations/[id] | Pas de description |
| pro | DELETE | /api/pro/reservations/[id] | Pas de description |
| pro | PATCH | /api/pro/reservations/[id] | Pas de description |
| pro | POST | /api/pro/reservations/complete | Pas de description |
| pro | GET | /api/pro/roles | Pas de description |
| pro | GET | /api/pro/service-categories | Pas de description |
| pro | POST | /api/pro/service-categories | Pas de description |
| pro | GET | /api/pro/services | Pas de description |
| pro | POST | /api/pro/services | Pas de description |
| pro | GET | /api/pro/services/[id] | Pas de description |
| pro | PATCH | /api/pro/services/[id] | Pas de description |
| pro | DELETE | /api/pro/services/[id] | Pas de description |
| pro | GET | /api/pro/services/[id]/addons | Pas de description |
| pro | POST | /api/pro/services/[id]/addons | Pas de description |
| pro | GET | /api/pro/services/[id]/variants | Pas de description |
| pro | POST | /api/pro/services/[id]/variants | Pas de description |
| pro | GET | /api/pro/stats/series | Pas de description |
| pro | GET | /api/pro/stats/week | Pas de description |
| pro | GET | /api/pro/subscription | Returns the current (or latest) subscription for the active business, including plan details |
| pro | POST | /api/pro/subscription | Starts a new subscription or swaps plan. Body: { plan_id: number } |
| pro | PATCH | /api/pro/subscription | - resume: set cancel_at_period_end = false |
| pro | PATCH | /api/pro/variants/[variantId] | Pas de description |
| pro | DELETE | /api/pro/variants/[variantId] | Pas de description |
| pro | GET | /api/pro/verification | Pas de description |
| pro | POST | /api/pro/verification | Pas de description |
| pro | POST | /api/pro/verify-documents | Pas de description |
| public | GET | /api/public/plans | GET /api/public/plans Récupère tous les plans d'abonnement actifs (API publique) |
| salon | GET | /api/salon/[id] | Pas de description |
| salon | GET | /api/salon/[id]/employees | Pas de description |
| salon | GET | /api/salon/[id]/timeslots | Pas de description |
| salon | POST | /api/salon/[id]/timeslots/check-availability | Pas de description |
| search | GET | /api/search | Pas de description |
| search | GET | /api/search/v2 | Pas de description |
| search-simple | GET | /api/search-simple | Pas de description |
| test-email | GET | /api/test-email | Pas de description |
| uploads | POST | /api/uploads/onboarding | Pas de description |
| webhooks | POST | /api/webhooks/payments | { type: "invoice.payment_succeeded", data: { subscription_id: "...", provider_subscription_id: "..." } } |