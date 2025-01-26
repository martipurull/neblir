import { authSignIn } from "../serverActions/auth"
import Button from "./shared/Button"

export default function SignIn() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-between p-24">
            <div>
                <h1 className="text-3xl font-bold uppercase mb-3">Neblir</h1>
                <h2>A homebrewed sci-fi TTRPG set in a starless world</h2>
            </div>
            <form
                action={async () => {
                    await authSignIn("google", "/dashboard")
                }}
            >
                <Button type="submit" text="Signin with Google" />
            </form>
        </div>
    )
} 