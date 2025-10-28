"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Input } from "./input";
import { ScrollArea } from "./scroll-area";

export function ClientSearch({
  value,
  onChange,
  onSelect,
  businessId,
  className,
  placeholder = "Rechercher un client..."
}: {
  value: string;
  onChange: (value: string) => void;
  onSelect: (client: { id: string; name: string; phone?: string; email?: string }) => void;
  businessId: string;
  className?: string;
  placeholder?: string;
}) {
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Recherche des clients correspondant à la saisie
  const searchClients = useCallback(
    async (query: string) => {
      setLoading(true);
      try {
        const response = await fetch(
          `/api/pro/clients/search?business_id=${businessId}&q=${encodeURIComponent(query || "")}`
        );
        if (response.ok) {
          const data = await response.json();
          setSuggestions(data.items || []);
        }
      } catch (error) {
        console.error("Erreur lors de la recherche de clients:", error);
      } finally {
        setLoading(false);
      }
    },
    [businessId]
  );

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
    const value = e.target.value;
    onChange(value);
    searchClients(value);
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
      />
      {isOpen && (value.length > 0 || suggestions.length > 0) && (
        <div className="absolute z-10 mt-1 w-full rounded-md bg-white shadow-lg">
          <ScrollArea className="max-h-60 rounded-md border">
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
