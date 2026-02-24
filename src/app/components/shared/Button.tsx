interface ButtonProps {
  type: "submit" | "reset" | "button";
  text: string;
}

const Button = ({ type, text }: ButtonProps) => {
  return (
    <button
      type={type}
      className="w-full min-h-11 rounded-md bg-customPrimary px-4 py-2 text-customSecondary transition-colors hover:bg-customPrimaryHover active:bg-customPrimaryHover focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
    >
      {text}
    </button>
  );
};

export default Button;
