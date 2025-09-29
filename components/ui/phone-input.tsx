import React from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Liste exhaustive des pays avec indicatif et drapeau
const countries = [
  { code: "+33", label: "FR", flag: "🇫🇷" },
  { code: "+32", label: "BE", flag: "🇧🇪" },
  { code: "+41", label: "CH", flag: "🇨🇭" },
  { code: "+49", label: "DE", flag: "🇩🇪" },
  { code: "+44", label: "GB", flag: "🇬🇧" },
  { code: "+1", label: "US", flag: "🇺🇸" },
  { code: "+34", label: "ES", flag: "🇪🇸" },
  { code: "+39", label: "IT", flag: "🇮🇹" },
  { code: "+351", label: "PT", flag: "🇵🇹" },
  { code: "+352", label: "LU", flag: "🇱🇺" },
  { code: "+31", label: "NL", flag: "🇳🇱" },
  { code: "+420", label: "CZ", flag: "🇨🇿" },
  { code: "+421", label: "SK", flag: "🇸🇰" },
  { code: "+43", label: "AT", flag: "🇦🇹" },
  { code: "+48", label: "PL", flag: "🇵🇱" },
  { code: "+40", label: "RO", flag: "🇷🇴" },
  { code: "+36", label: "HU", flag: "🇭🇺" },
  { code: "+45", label: "DK", flag: "🇩🇰" },
  { code: "+46", label: "SE", flag: "🇸🇪" },
  { code: "+47", label: "NO", flag: "🇳🇴" },
  { code: "+358", label: "FI", flag: "🇫🇮" },
  { code: "+420", label: "CZ", flag: "🇨🇿" },
  { code: "+375", label: "BY", flag: "🇧🇾" },
  { code: "+380", label: "UA", flag: "🇺🇦" },
  { code: "+7", label: "RU", flag: "🇷🇺" },
  { code: "+90", label: "TR", flag: "🇹🇷" },
  { code: "+20", label: "EG", flag: "��🇬" },
  { code: "+212", label: "MA", flag: "🇲�" },
  { code: "+213", label: "DZ", flag: "🇩🇿" },
  { code: "+216", label: "TN", flag: "🇹🇳" },
  { code: "+218", label: "LY", flag: "🇱🇾" },
  { code: "+225", label: "CI", flag: "🇨🇮" },
  { code: "+221", label: "SN", flag: "🇸🇳" },
  { code: "+1", label: "CA", flag: "🇨🇦" },
  // ... ajoutez tous les pays nécessaires
];

export interface PhoneInputProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  country: string;
  onCountryChange: (v: string) => void;
  required?: boolean;
}

export function PhoneInput({ value, onChange, country, onCountryChange, required, ...props }: PhoneInputProps) {
  return (
    <div className="flex items-center border rounded-lg overflow-hidden">
      <Select value={country} onValueChange={onCountryChange}>
        <SelectTrigger className="w-20">
          <SelectValue placeholder="Pays" />
        </SelectTrigger>
        <SelectContent>
          {countries.map((c) => (
            <SelectItem key={c.code} value={c.code}>
              <span className="mr-2">{c.flag}</span>{c.code}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Input
        type="tel"
        value={value}
        onChange={onChange}
        placeholder="Ex : 06 86 26 44 44"
        className="border-0 focus:ring-0"
        {...props}
      />
    </div>
  );
}
