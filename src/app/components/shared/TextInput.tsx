import { TextField } from "@/app/components/shared/TextField";
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
          <TextField
            {...field}
            type={type}
            id={name}
            placeholder={placeholder}
            className={className}
          />
        )}
      />
    </div>
  );
};

export default TextInput;
