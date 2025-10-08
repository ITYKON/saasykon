"use client";

import { useEffect, useState } from "react";

type Auth = {
  id: string | null;
  email?: string;
  first_name?: string;
  last_name?: string;
  roles: string[];
  permissions: string[];
  assignments: Array<{ role: string; business_id: string }>;
};

let cache: Auth | null = null;

export function useAuth() {
  const [auth, setAuth] = useState<Auth | null>(cache);
  const [loading, setLoading] = useState<boolean>(cache === null);
  useEffect(() => {
    if (cache) {
      setLoading(false);
      return;
    }
    let mounted = true;
    setLoading(true);
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        const user = data?.user || null;
        const a: Auth | null =
          user === null
            ? null
            : {
                id: user.id,
                email: user.email,
                first_name: user.first_name,
                last_name: user.last_name,
                roles: user.roles || [],
                permissions: user.permissions || [],
                assignments: user.assignments || [],
              };
        if (mounted) {
          cache = a;
          setAuth(a);
          setLoading(false);
        }
      })
      .catch(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  return { auth, loading };
}

export function clearAuthCache() {
  cache = null;
}

export default useAuth;
