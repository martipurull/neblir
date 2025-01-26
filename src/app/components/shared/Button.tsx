interface ButtonProps { type: "submit" | "reset" | "button", text: string }

const Button = ({ type, text }: ButtonProps) => {
    return (
        <button
            type={type}
            className="w-full text-customSecondary py-2 px-4 rounded-md bg-customPrimary hover:bg-customPrimaryHover focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
            {text}
        </button>
    )
}

export default Button