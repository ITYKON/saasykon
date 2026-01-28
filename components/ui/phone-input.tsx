import React, { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import * as RPNInput from "react-phone-number-input";
import flags from "react-phone-number-input/flags";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Input, InputProps } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

type PhoneInputProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "onChange" | "value"
> &
  Omit<RPNInput.Props<typeof RPNInput.default>, "onChange"> & {
    onChange?: (value: RPNInput.Value) => void;
  };

export function PhoneInput({ className, onChange, ...props }: PhoneInputProps) {
  return (
    <RPNInput.default
      defaultCountry="DZ"
      className={cn("flex", className)}
      flagComponent={FlagComponent}
      countrySelectComponent={CountrySelect}
      inputComponent={InputComponent}
      /**
       * Handles the onChange event.
       *
       * react-phone-number-input might trigger the onChange event as undefined
       * when a valid phone number is not generated.
       *
       * @param value
       */
      onChange={(value) => onChange?.(value || "" as RPNInput.Value)}
      {...props}
    />
  );
}

const InputComponent = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => (
    <Input
      className={cn("rounded-e-lg rounded-s-none", className)}
      {...props}
      ref={ref}
    />
  )
);
InputComponent.displayName = "InputComponent";

type CountrySelectOption = { label: string; value: RPNInput.Country };

type CountrySelectProps = {
  disabled?: boolean;
  value: RPNInput.Country;
  onChange: (value: RPNInput.Country) => void;
  options: CountrySelectOption[];
};

const CountrySelect = ({
  disabled,
  value,
  onChange,
  options,
}: CountrySelectProps) => {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleEvent = (e: Event) => {
      if (!open) return;
      
      // If the event target is inside our dropdown content, allow it (don't close)
      // This handles scrolling the list of countries
      if (ref.current && e.target instanceof Node && ref.current.contains(e.target)) {
        return;
      }
      
      // Otherwise (scrolling/wheeling outside), close the dropdown
      setOpen(false);
    };

    // Catch scroll, wheel, and touchmove events to close the dropdown immediately
    // when the user interacts with the rest of the page.
    const opts = { capture: true, passive: true };
    window.addEventListener("scroll", handleEvent, opts);
    window.addEventListener("wheel", handleEvent, opts);
    window.addEventListener("touchmove", handleEvent, opts);
    
    return () => {
      window.removeEventListener("scroll", handleEvent, opts);
      window.removeEventListener("wheel", handleEvent, opts);
      window.removeEventListener("touchmove", handleEvent, opts);
    };
  }, [open]);

  const handleSelect = React.useCallback(
    (country: RPNInput.Country) => {
      onChange(country);
      setOpen(false);
    },
    [onChange]
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant={"outline"}
          className={cn("flex gap-1 rounded-e-none rounded-s-lg px-3")}
          disabled={disabled}
        >
          <FlagComponent country={value} countryName={value} />
          <ChevronsUpDown
            className={cn(
              "-mr-2 h-4 w-4 opacity-50",
              disabled ? "hidden" : "opacity-100"
            )}
          />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" side="bottom" align="start" avoidCollisions={false}>
        <div ref={ref}>
          <Command>
            <CommandList>
              <ScrollArea className="h-72">
                <CommandInput placeholder="Rechercher un pays..." />
                <CommandEmpty>Aucun pays trouvé.</CommandEmpty>
                <CommandGroup>
                  {options
                    .filter((x) => x.value)
                    .map((option) => (
                      <CommandItem
                        className="gap-2"
                        key={option.value}
                        onSelect={() => handleSelect(option.value)}
                      >
                        <FlagComponent
                          country={option.value}
                          countryName={option.label}
                        />
                        <span className="flex-1 text-sm">{option.label}</span>
                        {option.value && (
                          <span className="text-foreground/50 text-sm">
                            {`+${RPNInput.getCountryCallingCode(option.value)}`}
                          </span>
                        )}
                        <Check
                          className={cn(
                            "ml-auto h-4 w-4",
                            option.value === value ? "opacity-100" : "opacity-0"
                          )}
                        />
                      </CommandItem>
                    ))}
                </CommandGroup>
              </ScrollArea>
            </CommandList>
          </Command>
        </div>
      </PopoverContent>
    </Popover>
  );
};

const FlagComponent = ({ country, countryName }: RPNInput.FlagProps) => {
  const Flag = flags[country];

  return (
    <span className="flex h-5 w-8 overflow-hidden rounded-sm [&_svg]:h-full [&_svg]:w-full [&_svg]:object-cover">
      {Flag && <Flag title={countryName} />}
    </span>
  );
};
