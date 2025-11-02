import React from "react";
import { Controller, useFormContext } from "react-hook-form";

interface TextInputProps {
  name: string;
  placeholder?: string;
  label: string;
  type?: string;
}

const TextInput: React.FC<TextInputProps> = ({
  name,
  placeholder,
  label,
  type = "text",
}) => {
  const { control } = useFormContext();

  return (
    <div className="mb-6">
      <label htmlFor={name} className="block text-gray-700 font-bold">
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
            className="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-customPrimaryHover"
          />
        )}
      />
    </div>
  );
};

export default TextInput;
