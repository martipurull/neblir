import React from "react";
import { Controller, useFormContext } from "react-hook-form";

interface TextInputProps {
  name: string;
  placeholder?: string;
  label: string;
  type?: string;
  className?: string;
}

const TextInput: React.FC<TextInputProps> = ({
  name,
  placeholder,
  label,
  type = "text",
  className = "",
}) => {
  const { control } = useFormContext();

  return (
    <div className="mb-6">
      <label htmlFor={name} className="block text-black font-bold">
        {label}
      </label>
      <Controller
        name={name}
        control={control}
        defaultValue=""
        render={({ field }) => (
          <input
            {...field}
            type={type}
            id={name}
            placeholder={placeholder}
            className={`min-h-11 w-full rounded-md border border-black/20 bg-paleBlue px-3 py-2 text-black placeholder:text-black/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-customPrimaryHover ${className}`.trim()}
          />
        )}
      />
    </div>
  );
};

export default TextInput;
