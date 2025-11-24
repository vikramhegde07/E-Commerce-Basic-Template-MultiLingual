import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, LogIn } from "lucide-react";
import toast from "react-hot-toast";

import client from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useLoading } from "@/context/LoadingContext";

// shadcn/ui
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type LoginResponse = {
    token: string;
    expires_in: number;
    user: {
        id: number;
        name: string;
        email: string;
        role: "admin" | "editor";
    };
};

const Login: React.FC = () => {
    const { login } = useAuth();
    const { setLoading } = useLoading();
    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPwd, setShowPwd] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email || !password) {
            toast.error("Please enter email and password");
            return;
        }

        try {
            setLoading(true);
            const res = await client.post<LoginResponse>("/api/auth/login", { email, password });
            const { token, user } = res.data;

            // Your AuthContext expects { id, username, email?, role? }
            login({
                token,
                userData: {
                    id: user.id,
                    username: user.name,
                    email: user.email,
                    role: user.role,
                },
            });

            toast.success("Logged in!");
            navigate("/");
        } catch (err: any) {
            const msg = err?.response?.data?.error || "Login failed";
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-muted px-4">
            <Card className="w-full max-w-md shadow-lg">
                <CardHeader className="space-y-2">
                    <CardTitle className="text-2xl flex items-center gap-2">
                        <LogIn className="h-6 w-6" />
                        Admin Login
                    </CardTitle>
                    <CardDescription>Sign in to manage products, categories, and inquiries.</CardDescription>
                </CardHeader>

                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="you@example.com"
                                autoComplete="username"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPwd ? "text" : "password"}
                                    placeholder="••••••••"
                                    autoComplete="current-password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="pr-10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPwd((v) => !v)}
                                    className="absolute inset-y-0 right-0 px-3 flex items-center focus:outline-none"
                                    aria-label={showPwd ? "Hide password" : "Show password"}
                                >
                                    {showPwd ? <EyeOff className="h-5 w-5 opacity-70" /> : <Eye className="h-5 w-5 opacity-70" />}
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center justify-between text-sm">
                            <div className="text-muted-foreground">
                                {/* Add Remember Me later if needed */}
                            </div>
                            <button
                                type="button"
                                className="text-primary hover:underline"
                                onClick={() => toast("Forgot password? (to be implemented)")}
                            >
                                Forgot password?
                            </button>
                        </div>
                    </CardContent>

                    <CardFooter className="flex flex-col gap-2">
                        <Button type="submit" className="w-full">Sign In</Button>
                        <p className="text-xs text-muted-foreground text-center">
                            Use your admin/editor credentials provided by the system administrator.
                        </p>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
};

export default Login;
