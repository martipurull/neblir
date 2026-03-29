interface ButtonProps {
  type: "submit" | "reset" | "button";
  text: string;
  disabled?: boolean;
}

const Button = ({ type, text, disabled = false }: ButtonProps) => {
  return (
    <button
      type={type}
      disabled={disabled}
      aria-disabled={disabled}
      className="w-full min-h-11 rounded-md bg-customPrimary px-4 py-2 text-customSecondary transition-colors hover:bg-customPrimaryHover active:bg-customPrimaryHover focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:bg-gray-500 disabled:text-gray-200 disabled:opacity-80 disabled:hover:bg-gray-500 disabled:active:bg-gray-500"
    >
      {text}
    </button>
  );
};

export default Button;
