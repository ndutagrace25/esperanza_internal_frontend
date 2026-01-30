"use client";

import { useEffect, useState } from "react";
import Select, { StylesConfig, GroupBase } from "react-select";
import { cn } from "@/lib/utils";

export interface SelectOption {
  value: string;
  label: string;
}

interface SearchableSelectProps {
  options: SelectOption[];
  value?: string | null | undefined;
  onValueChange: (value: string | null | undefined) => void;
  placeholder?: string;
  isDisabled?: boolean;
  isLoading?: boolean;
  isClearable?: boolean;
  className?: string;
  id?: string;
}

// Custom styles to match the app's design
const customStyles: StylesConfig<SelectOption, false, GroupBase<SelectOption>> = {
  control: (provided, state) => ({
    ...provided,
    minHeight: "44px",
    backgroundColor: "white",
    borderColor: state.isFocused ? "hsl(var(--ring))" : "hsl(var(--input))",
    borderRadius: "calc(var(--radius) - 2px)",
    boxShadow: state.isFocused ? "0 0 0 2px hsl(var(--ring) / 0.2)" : "none",
    "&:hover": {
      borderColor: state.isFocused ? "hsl(var(--ring))" : "hsl(var(--input))",
    },
  }),
  valueContainer: (provided) => ({
    ...provided,
    padding: "2px 12px",
  }),
  input: (provided) => ({
    ...provided,
    margin: "0px",
    color: "hsl(var(--foreground))",
  }),
  placeholder: (provided) => ({
    ...provided,
    color: "hsl(var(--muted-foreground))",
  }),
  singleValue: (provided) => ({
    ...provided,
    color: "hsl(var(--foreground))",
  }),
  menu: (provided) => ({
    ...provided,
    backgroundColor: "white",
    border: "1px solid hsl(var(--border))",
    borderRadius: "calc(var(--radius) - 2px)",
    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
    zIndex: 9999,
  }),
  menuPortal: (provided) => ({
    ...provided,
    zIndex: 9999,
  }),
  menuList: (provided) => ({
    ...provided,
    padding: "4px",
  }),
  option: (provided, state) => ({
    ...provided,
    backgroundColor: state.isSelected
      ? "hsl(var(--primary))"
      : state.isFocused
        ? "hsl(var(--accent))"
        : "transparent",
    color: state.isSelected
      ? "hsl(var(--primary-foreground))"
      : "hsl(var(--foreground))",
    borderRadius: "calc(var(--radius) - 4px)",
    padding: "8px 12px",
    cursor: "pointer",
    "&:active": {
      backgroundColor: state.isSelected
        ? "hsl(var(--primary))"
        : "hsl(var(--accent))",
    },
  }),
  indicatorSeparator: () => ({
    display: "none",
  }),
  dropdownIndicator: (provided, state) => ({
    ...provided,
    color: "hsl(var(--muted-foreground))",
    padding: "8px",
    "&:hover": {
      color: "hsl(var(--foreground))",
    },
    transform: state.selectProps.menuIsOpen ? "rotate(180deg)" : undefined,
    transition: "transform 0.2s ease",
  }),
  clearIndicator: (provided) => ({
    ...provided,
    color: "hsl(var(--muted-foreground))",
    padding: "8px",
    "&:hover": {
      color: "hsl(var(--destructive))",
    },
  }),
  loadingIndicator: (provided) => ({
    ...provided,
    color: "hsl(var(--muted-foreground))",
  }),
  noOptionsMessage: (provided) => ({
    ...provided,
    color: "hsl(var(--muted-foreground))",
    padding: "8px 12px",
  }),
};

export function SearchableSelect({
  options,
  value,
  onValueChange,
  placeholder = "Select...",
  isDisabled = false,
  isLoading = false,
  isClearable = true,
  className,
  id,
}: SearchableSelectProps) {
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);

  // Find selected option - handle undefined, null, and empty string
  const selectedOption = value
    ? options.find((opt) => opt.value === value) || null
    : null;

  // Set portal target after mount to avoid SSR issues
  useEffect(() => {
    setPortalTarget(document.body);
  }, []);

  const handleChange = (option: SelectOption | null) => {
    const newValue = option?.value ?? null;
    onValueChange(newValue);
  };

  return (
    <div onPointerDown={(e) => e.stopPropagation()}>
      <Select<SelectOption, false>
        inputId={id}
        options={options}
        value={selectedOption}
        onChange={handleChange}
        placeholder={placeholder}
        isDisabled={isDisabled}
        isLoading={isLoading}
        isClearable={isClearable}
        isSearchable
        styles={customStyles}
        className={cn("react-select-container", className)}
        classNamePrefix="react-select"
        menuPortalTarget={portalTarget}
        menuPosition="fixed"
        closeMenuOnSelect={true}
        blurInputOnSelect={false}
        noOptionsMessage={() => "No options found"}
        loadingMessage={() => "Loading..."}
      />
    </div>
  );
}
