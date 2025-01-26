import { SignOut } from "@/app/components/SignOut"


export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="en">
            <body>
                <nav className="flex justify-end p-2">
                    <SignOut />
                </nav>
                <main>{children}</main>
            </body>
        </html>
    )
}