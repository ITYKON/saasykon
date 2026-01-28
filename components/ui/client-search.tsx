"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Input } from "./input";
import { ScrollArea } from "./scroll-area";

export function ClientSearch({
  value,
  onChange,
  onSelect,
  className,
  placeholder = "Rechercher un client...",
  onKeyDown,
  businessId
}: {
  value: string;
  onChange: (value: string) => void;
  onSelect: (client: { id: string; name: string; phone?: string; email?: string }) => void;
  className?: string;
  placeholder?: string;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  businessId?: string;
}) {
  // Remove unstable props object
  // const props = { value, onChange, onSelect, className, placeholder, onKeyDown, businessId };

  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const lastRequestRef = useRef<number>(0);

  // Recherche des clients correspondant à la saisie
  const searchClients = useCallback(
    async (query: string) => {
      const requestId = Date.now();
      lastRequestRef.current = requestId;
      setLoading(true);
      try {
        const url = new URL("/api/pro/clients/search", window.location.origin);
        url.searchParams.set("q", query || "");
        if (businessId) url.searchParams.set("business_id", businessId);

        const response = await fetch(url.toString());
        if (requestId !== lastRequestRef.current) return;
        
        if (response.ok) {
          const data = await response.json();
          if (requestId !== lastRequestRef.current) return;
          setSuggestions(data.items || []);
        }
      } catch (error) {
        if (requestId !== lastRequestRef.current) return;
        console.error("Erreur lors de la recherche de clients:", error);
      } finally {
        if (requestId === lastRequestRef.current) {
          setLoading(false);
        }
      }
    },
    [businessId] // Stable dependency
  );

  // Debounce search when value changes
  useEffect(() => {
    const timer = setTimeout(() => {
      searchClients(value);
    }, 300);
    return () => clearTimeout(timer);
  }, [value, searchClients]);

  // Gestion du clic en dehors du composant
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Gestion du changement de la valeur de recherche
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    onChange(val);
    setIsOpen(true);
  };

  // Gestion de la sélection d'un client
  const handleSelect = (client: any) => {
    onSelect({
      id: client.id,
      name: client.name || [client.first_name, client.last_name].filter(Boolean).join(" ") || "Client",
      phone: client.phone,
      email: client.email,
    });
    setIsOpen(false);
  };

  return (
    <div className="relative w-full" ref={containerRef}>
      <Input
        type="text"
        value={value}
        onChange={handleChange}
        onFocus={() => { setIsOpen(true); searchClients(value); }}
        placeholder={placeholder}
        className={className}
        onKeyDown={onKeyDown}
      />
      {isOpen && (value.length > 0 || suggestions.length > 0) && (
        <div className="absolute z-50 mt-1 w-full rounded-md bg-white shadow-lg border border-gray-200">
          <ScrollArea className="h-[240px] max-h-[240px] rounded-md">
            {loading ? (
              <div className="p-2 text-sm text-gray-500">Chargement...</div>
            ) : suggestions.length > 0 ? (
              suggestions.map((client) => (
                <div
                  key={client.id}
                  className="cursor-pointer px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  onClick={() => handleSelect(client)}
                >
                  <div className="font-medium">
                    {client.name || [client.first_name, client.last_name].filter(Boolean).join(" ")}
                  </div>
                  {client.phone && (
                    <div className="text-xs text-gray-500">{client.phone}</div>
                  )}
                  {client.email && (
                    <div className="text-xs text-gray-500">{client.email}</div>
                  )}
                </div>
              ))
            ) : (
              <div className="p-2 text-sm text-gray-500">
                {value.length > 0 ? "Aucun client trouvé" : "Commencez à taper pour rechercher"}
              </div>
            )}
          </ScrollArea>
        </div>
      )}
    </div>
  );
}
