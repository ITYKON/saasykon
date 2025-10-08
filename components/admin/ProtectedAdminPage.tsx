"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import useAuth from "@/hooks/useAuth";

type ProtectedAdminPageProps = {
  children: React.ReactNode;
  requiredPermission?: string;
  fallbackPath?: string;
};

/**
 * Wrapper component to protect admin pages.
 * Requires either ADMIN role or a specific permission.
 */
export function ProtectedAdminPage({
  children,
  requiredPermission,
  fallbackPath = "/client/dashboard",
}: ProtectedAdminPageProps) {
  const { auth, loading } = useAuth();
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    if (loading) return;

    if (!auth) {
      router.push("/auth/login");
      return;
    }

    const isAdmin = auth.roles.includes("ADMIN");
    const hasPermission = requiredPermission ? auth.permissions.includes(requiredPermission) : false;

    if (isAdmin || hasPermission) {
      setAuthorized(true);
    } else {
      router.push(fallbackPath);
    }
  }, [auth, loading, router, requiredPermission, fallbackPath]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!authorized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-600">Redirection...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
