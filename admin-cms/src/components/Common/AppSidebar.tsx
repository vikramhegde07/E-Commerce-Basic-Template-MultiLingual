import { Link, useLocation } from 'react-router-dom'
import { cn } from "@/lib/utils"
import {
    LayoutDashboard,
    Boxes,
    Package,
    Mail,
    Users,
    UserCircle,
    PaintBucket
} from "lucide-react"

const navItems = [
    { label: "Dashboard", to: "/", icon: LayoutDashboard },
    { label: "Banners", to: "/banners", icon: LayoutDashboard },
    { label: "Product Categories", to: "/categories", icon: Boxes },
    { label: "Products", to: "/products", icon: Package },
    { label: "Color Cards", to: "/color-cards", icon: PaintBucket },
    { label: "Inquiries", to: "/inquiries", icon: Mail },
    { label: "Users", to: "/users", icon: Users },
    { label: "Profile", to: "/profile", icon: UserCircle },
]

export default function AppSidebar() {
    const location = useLocation()

    return (
        <aside className="hidden md:flex w-64 bg-white border-r flex-col">
            <div className="h-16 flex items-center px-4 font-semibold text-lg border-b">
                Primeconnects
            </div>
            <nav className="flex-1 overflow-y-auto py-4">
                <ul className="space-y-1">
                    {navItems.map((item) => {
                        const Icon = item.icon
                        const active = location.pathname === item.to
                        return (
                            <li key={item.to}>
                                <Link
                                    to={item.to}
                                    className={cn(
                                        "flex items-center gap-3 px-4 py-2 text-sm font-medium rounded-md",
                                        active
                                            ? "bg-sky-100 text-sky-700"
                                            : "text-slate-700 hover:bg-slate-100"
                                    )}
                                >
                                    <Icon className="h-5 w-5" />
                                    {item.label}
                                </Link>
                            </li>
                        )
                    })}
                </ul>
            </nav>
        </aside>
    )
}
