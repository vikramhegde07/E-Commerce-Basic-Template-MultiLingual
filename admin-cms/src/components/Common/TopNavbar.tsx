import { useAuth } from "@/context/AuthContext"
import { Button } from "@/components/ui/button"

import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { useLang } from "@/context/LangContext";

export default function TopNavbar() {
    const { logout } = useAuth();
    const { locale, setLocale } = useLang();

    return (
        <header className="h-14 bg-white border-b flex items-center px-4 justify-end">
            <div className="flex gap-3">
                <Select value={locale} onValueChange={(val: 'en' | 'ar' | 'zh') => setLocale(val)}>
                    <SelectTrigger>
                        <SelectValue placeholder="Choose Language" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectGroup>
                            <SelectLabel>Language</SelectLabel>
                            <SelectItem value="en">English</SelectItem>
                            <SelectItem value="ar">Arabic</SelectItem>
                            <SelectItem value="zh">Chinese</SelectItem>
                        </SelectGroup>
                    </SelectContent>
                </Select>
                <Button variant="outline" size="sm" onClick={logout}>
                    Logout
                </Button>
            </div>
        </header>
    )
}
