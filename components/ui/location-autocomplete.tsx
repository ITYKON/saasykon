"use client";

import * as React from "react";
import { Check, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ALGERIA_LOCATIONS, Location } from "@/lib/algeria-locations";
import { Input } from "./input";

interface LocationAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function LocationAutocomplete({
  value,
  onChange,
  placeholder = "Où ? (Adresse, wilaya...)",
  className,
}: LocationAutocompleteProps) {
  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState(value);

  // Normalize string by removing accents and converting to lowercase
  const normalize = (str: string) => {
    return str
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();
  };

  // Filter locations based on input value
  const filteredLocations = React.useMemo(() => {
    if (!inputValue || inputValue.length < 2) return [];
    const normalizedInput = normalize(inputValue);
    
    // Support searching by "Commune, Wilaya" or "Wilaya, Commune" or just part of either
    return ALGERIA_LOCATIONS.filter((loc) => {
      const normalizedCommune = normalize(loc.commune);
      const normalizedWilaya = normalize(loc.wilaya);
      const normalizedLabel = normalize(loc.label);
      
      // Basic check: input is contained in the label
      if (normalizedLabel.includes(normalizedInput)) return true;
      
      // Advanced check: if there's a comma, split and check both parts
      if (normalizedInput.includes(",")) {
        const parts = normalizedInput.split(",").map(p => p.trim());
        if (parts.length >= 2) {
          const [p1, p2] = parts;
          // Case: Wilaya, Commune
          if (normalizedWilaya.includes(p1) && normalizedCommune.includes(p2)) return true;
          // Case: Commune, Wilaya
          if (normalizedCommune.includes(p1) && normalizedWilaya.includes(p2)) return true;
        }
      } else if (normalizedInput.includes(" ")) {
        // Advanced check: space-separated terms like "Alger Hydra"
        const parts = normalizedInput.split(" ").filter(p => p.length > 0);
        if (parts.length >= 2) {
          // Check if any part matches wilaya and another matches commune
          const matchesWilaya = parts.some(p => normalizedWilaya.includes(p));
          const matchesCommune = parts.some(p => normalizedCommune.includes(p));
          if (matchesWilaya && matchesCommune) return true;
        }
      }
      
      // Case: Searching for wilaya name might match commune names, but also check wilaya field specifically
      if (normalizedWilaya.includes(normalizedInput)) return true;

      return false;
    }).sort((a, b) => {
      const normalizedInput = normalize(inputValue);
      const aCommune = normalize(a.commune);
      const bCommune = normalize(b.commune);
      const aWilaya = normalize(a.wilaya);
      const bWilaya = normalize(b.wilaya);

      // 1. Exact commune match (e.g., "Bejaia" -> "Bejaia")
      if (aCommune === normalizedInput && bCommune !== normalizedInput) return -1;
      if (bCommune === normalizedInput && aCommune !== normalizedInput) return 1;

      // 2. "Centre" match for the searched wilaya (e.g., "Alger" -> "Alger centre")
      const isACentre = aCommune.includes("centre") && aWilaya.includes(normalizedInput);
      const isBCentre = bCommune.includes("centre") && bWilaya.includes(normalizedInput);
      if (isACentre && !isBCentre) return -1;
      if (isBCentre && !isACentre) return 1;

      // 3. Commune starts with input
      if (aCommune.startsWith(normalizedInput) && !bCommune.startsWith(normalizedInput)) return -1;
      if (bCommune.startsWith(normalizedInput) && !aCommune.startsWith(normalizedInput)) return 1;

      return 0;
    }).slice(0, 6); // Limit to 6 results for performance and UI clarity
  }, [inputValue]);

  const handleSelect = (selectedValue: string) => {
    onChange(selectedValue);
    setInputValue(selectedValue);
    setOpen(false);
  };

  return (
    <div className={cn("relative w-full", className)}>
      <Popover 
        open={open} 
        onOpenChange={(newOpen) => {
          if (newOpen && inputValue.length < 2) return;
          setOpen(newOpen);
        }}
      >
        <PopoverTrigger asChild>
          <div className="relative w-full cursor-text">
            <Input
              placeholder={placeholder}
              value={inputValue}
              onChange={(e) => {
                const val = e.target.value;
                setInputValue(val);
                onChange(val);
                if (!open && val.length >= 2) setOpen(true);
                if (open && val.length < 2) setOpen(false);
              }}
              onFocus={() => {
                if (inputValue.length >= 2) setOpen(true);
              }}
              className="h-12 text-lg border-gray-300 focus:border-black focus:ring-black pr-10"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
              <MapPin className="h-5 w-5" />
            </div>
          </div>
        </PopoverTrigger>
        <PopoverContent 
          className="w-[var(--radix-popover-trigger-width)] p-0" 
          align="start"
          side="bottom"
          sideOffset={8}
          avoidCollisions={false}
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          {(inputValue.length >= 2 || filteredLocations.length > 0) && (
            <Command className="rounded-2xl border border-gray-100 shadow-2xl overflow-hidden bg-white">
              <CommandList className="max-h-none">
                {inputValue.length >= 2 && filteredLocations.length === 0 && (
                  <CommandEmpty className="py-4 text-center text-xs text-gray-400">Aucun résultat trouvé.</CommandEmpty>
                )}
                <CommandGroup className="p-1.5">
                  {filteredLocations.map((loc) => {
                    const commune = loc.commune;
                    const wilaya = loc.wilaya.charAt(0).toUpperCase() + loc.wilaya.slice(1).toLowerCase();
                    
                    return (
                      <CommandItem
                        key={loc.label}
                        value={loc.label}
                        onSelect={() => handleSelect(loc.label)}
                        className="flex flex-col items-start px-3 py-1.5 cursor-pointer hover:bg-gray-50 rounded-xl border-b last:border-0 border-gray-50 transition-colors gap-0"
                      >
                        <span className="text-[13px] font-medium text-gray-800 leading-tight">
                          {commune}
                        </span>
                        <div className="flex items-center gap-1 text-[10px] text-gray-400 font-normal leading-tight mt-[-1px]">
                          <span>{wilaya}</span>
                          <span className="text-gray-200">•</span>
                          <span>Algérie</span>
                        </div>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              </CommandList>
            </Command>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
}
