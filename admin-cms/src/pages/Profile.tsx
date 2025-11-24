import React, { useEffect, useState } from "react";
import client from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useLoading } from "@/context/LoadingContext";
import toast from "react-hot-toast";
import { Eye, EyeOff, Shield, User2 } from "lucide-react";

// shadcn/ui
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

type MeResponse = {
    id: number;
    name: string;
    email: string;
    role: "admin" | "editor";
    created_at?: string | null;
    updated_at?: string | null;
};

const Profile: React.FC = () => {
    const { user, userToken, login } = useAuth();
    const { setLoading } = useLoading();

    // profile state
    const [profile, setProfile] = useState<MeResponse | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [formName, setFormName] = useState("");
    const [formEmail, setFormEmail] = useState("");

    // password state
    const [currentPwd, setCurrentPwd] = useState("");
    const [newPwd, setNewPwd] = useState("");
    const [confirmPwd, setConfirmPwd] = useState("");
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    // Load my profile
    useEffect(() => {
        const fetchMe = async () => {
            try {
                setLoading(true);
                const res = await client.get<MeResponse>("/api/me");
                setProfile(res.data);
                setFormName(res.data.name || "");
                setFormEmail(res.data.email || "");
            } catch (err: any) {
                const msg = err?.response?.data?.error || "Failed to load profile";
                toast.error(msg);
            } finally {
                setLoading(false);
            }
        };
        fetchMe();
    }, [setLoading]);

    const startEdit = () => {
        if (!profile) return;
        setFormName(profile.name || "");
        setFormEmail(profile.email || "");
        setIsEditing(true);
    };

    const cancelEdit = () => {
        if (!profile) return;
        setFormName(profile.name || "");
        setFormEmail(profile.email || "");
        setIsEditing(false);
    };

    const saveProfile = async () => {
        if (!formName || !formEmail) {
            toast.error("Name and Email are required");
            return;
        }
        try {
            setLoading(true);
            const res = await client.put<MeResponse>("/api/me", {
                name: formName,
                email: formEmail,
            });
            setProfile(res.data);
            setIsEditing(false);
            toast.success("Profile updated");

            // Update AuthContext user cache with the existing token
            if (userToken) {
                login({
                    token: userToken,
                    userData: {
                        id: res.data.id,
                        username: res.data.name,
                        email: res.data.email,
                        role: res.data.role,
                    },
                });
            }
        } catch (err: any) {
            const msg = err?.response?.data?.error || "Failed to update profile";
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    const updatePassword = async () => {
        if (!currentPwd || !newPwd || !confirmPwd) {
            toast.error("Please fill all password fields");
            return;
        }
        if (newPwd.length < 6) {
            toast.error("New password must be at least 6 characters");
            return;
        }
        if (newPwd !== confirmPwd) {
            toast.error("New passwords do not match");
            return;
        }
        try {
            setLoading(true);
            await client.put("/api/me/password", {
                current_password: currentPwd,
                new_password: newPwd,
            });
            toast.success("Password updated");
            setCurrentPwd("");
            setNewPwd("");
            setConfirmPwd("");
            setShowCurrent(false);
            setShowNew(false);
            setShowConfirm(false);
        } catch (err: any) {
            const msg = err?.response?.data?.error || "Failed to update password";
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-5xl mx-auto p-4 md:p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Profile Card */}
                <Card className="shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <User2 className="h-5 w-5" />
                            My Profile
                        </CardTitle>
                        <CardDescription>View and update your personal information.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Name</Label>
                                <Input
                                    id="name"
                                    value={isEditing ? formName : (profile?.name || "")}
                                    onChange={(e) => setFormName(e.target.value)}
                                    disabled={!isEditing}
                                    placeholder="Your name"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={isEditing ? formEmail : (profile?.email || "")}
                                    onChange={(e) => setFormEmail(e.target.value)}
                                    disabled={!isEditing}
                                    placeholder="you@example.com"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="role">Role</Label>
                                <Input id="role" value={profile?.role || user?.role || ""} disabled />
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="flex items-center gap-3">
                        {!isEditing ? (
                            <Button onClick={startEdit}>Edit</Button>
                        ) : (
                            <>
                                <Button onClick={saveProfile}>Save</Button>
                                <Button variant="outline" onClick={cancelEdit}>
                                    Cancel
                                </Button>
                            </>
                        )}
                    </CardFooter>
                </Card>

                {/* Password Card */}
                <Card className="shadow-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Shield className="h-5 w-5" />
                            Change Password
                        </CardTitle>
                        <CardDescription>Update your account password securely.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="current">Current Password</Label>
                            <div className="relative">
                                <Input
                                    id="current"
                                    type={showCurrent ? "text" : "password"}
                                    value={currentPwd}
                                    onChange={(e) => setCurrentPwd(e.target.value)}
                                    placeholder="••••••••"
                                    className="pr-10"
                                />
                                <button
                                    type="button"
                                    className="absolute inset-y-0 right-0 px-3 flex items-center"
                                    onClick={() => setShowCurrent((v) => !v)}
                                    aria-label={showCurrent ? "Hide password" : "Show password"}
                                >
                                    {showCurrent ? <EyeOff className="h-5 w-5 opacity-70" /> : <Eye className="h-5 w-5 opacity-70" />}
                                </button>
                            </div>
                        </div>

                        <Separator />

                        <div className="space-y-2">
                            <Label htmlFor="new">New Password</Label>
                            <div className="relative">
                                <Input
                                    id="new"
                                    type={showNew ? "text" : "password"}
                                    value={newPwd}
                                    onChange={(e) => setNewPwd(e.target.value)}
                                    placeholder="••••••••"
                                    className="pr-10"
                                />
                                <button
                                    type="button"
                                    className="absolute inset-y-0 right-0 px-3 flex items-center"
                                    onClick={() => setShowNew((v) => !v)}
                                    aria-label={showNew ? "Hide password" : "Show password"}
                                >
                                    {showNew ? <EyeOff className="h-5 w-5 opacity-70" /> : <Eye className="h-5 w-5 opacity-70" />}
                                </button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="confirm">Confirm New Password</Label>
                            <div className="relative">
                                <Input
                                    id="confirm"
                                    type={showConfirm ? "text" : "password"}
                                    value={confirmPwd}
                                    onChange={(e) => setConfirmPwd(e.target.value)}
                                    placeholder="••••••••"
                                    className="pr-10"
                                />
                                <button
                                    type="button"
                                    className="absolute inset-y-0 right-0 px-3 flex items-center"
                                    onClick={() => setShowConfirm((v) => !v)}
                                    aria-label={showConfirm ? "Hide password" : "Show password"}
                                >
                                    {showConfirm ? <EyeOff className="h-5 w-5 opacity-70" /> : <Eye className="h-5 w-5 opacity-70" />}
                                </button>
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button onClick={updatePassword} className="ml-auto">
                            Update Password
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
};

export default Profile;
