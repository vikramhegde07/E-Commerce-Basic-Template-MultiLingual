import React, { useEffect, useMemo, useState } from "react";
import client from "@/lib/api";
import toast from "react-hot-toast";
import { useLoading } from "@/context/LoadingContext";
import {
    UserPlus,
    Trash2,
    Search,
    Eye,
    ChevronLeft,
    ChevronRight,
    Shield,
} from "lucide-react";

// shadcn/ui
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type UserRow = {
    id: number;
    name: string;
    email: string;
    role: "admin" | "editor";
    created_at?: string | null;
    updated_at?: string | null;
};

type UsersIndexResponse = {
    data: UserRow[];
    total: number;
    page: number;
    limit: number;
};

const Users: React.FC = () => {
    const { setLoading } = useLoading();

    // table state
    const [rows, setRows] = useState<UserRow[]>([]);
    const [total, setTotal] = useState(0);
    const [q, setQ] = useState("");
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(10);
    const [sortBy, setSortBy] = useState<"created_at" | "name" | "email">("created_at");
    const [order, setOrder] = useState<"ASC" | "DESC">("DESC");

    // view modal
    const [viewOpen, setViewOpen] = useState(false);
    const [viewUser, setViewUser] = useState<UserRow | null>(null);

    // create modal
    const [createOpen, setCreateOpen] = useState(false);
    const [cName, setCName] = useState("");
    const [cEmail, setCEmail] = useState("");
    const [cRole, setCRole] = useState<"admin" | "editor">("editor");
    const [cPassword, setCPassword] = useState("");

    const pages = useMemo(() => Math.max(1, Math.ceil(total / perPage)), [total, perPage]);

    const loadUsers = async () => {
        try {
            setLoading(true);
            const res = await client.get<UsersIndexResponse>("/api/users", {
                params: { q, page, limit: perPage, sortBy, order },
            });
            setRows(res.data.data || []);
            setTotal(res.data.total || 0);
        } catch (err: any) {
            const msg = err?.response?.data?.error || "Failed to load users";
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadUsers();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, perPage, sortBy, order]);

    const onSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        setPage(1);
        loadUsers();
    };

    const openView = async (u: UserRow) => {
        try {
            setLoading(true);
            const res = await client.get<UserRow>(`/api/users/${u.id}`);
            setViewUser(res.data);
            setViewOpen(true);
        } catch (err: any) {
            const msg = err?.response?.data?.error || "Failed to fetch user";
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    const onDelete = async (u: UserRow) => {
        const ok = confirm(`Delete user "${u.name}"? This cannot be undone.`);
        if (!ok) return;
        try {
            setLoading(true);
            await client.delete(`/api/users/${u.id}`);
            toast.success("User deleted");
            // reload current page (adjust if page now empty)
            const newTotal = total - 1;
            const lastPage = Math.max(1, Math.ceil(newTotal / perPage));
            if (page > lastPage) setPage(lastPage);
            else loadUsers();
        } catch (err: any) {
            const msg = err?.response?.data?.error || "Failed to delete user";
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    const resetCreateForm = () => {
        setCName("");
        setCEmail("");
        setCRole("editor");
        setCPassword("");
    };

    const submitCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!cName || !cEmail || !cPassword) {
            toast.error("Name, Email and Password are required");
            return;
        }
        try {
            setLoading(true);
            await client.post("/api/users", {
                name: cName,
                email: cEmail,
                role: cRole,
                password: cPassword,
            });
            toast.success("User created");
            setCreateOpen(false);
            resetCreateForm();
            setPage(1);
            loadUsers();
        } catch (err: any) {
            const msg = err?.response?.data?.error || "Failed to create user";
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-6xl mx-auto p-4 md:p-6 space-y-4">
            <Card>
                <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div>
                        <CardTitle>Users</CardTitle>
                        <CardDescription>Manage admin/editor accounts.</CardDescription>
                    </div>

                    <div className="flex gap-2">
                        <form onSubmit={onSearch} className="flex items-center gap-2">
                            <div className="relative">
                                <Input
                                    placeholder="Search name/email…"
                                    value={q}
                                    onChange={(e) => setQ(e.target.value)}
                                    className="pr-10 w-56"
                                />
                                <Search className="h-4 w-4 absolute right-3 top-1/2 -translate-y-1/2 opacity-60" />
                            </div>
                            <Button type="submit" variant="outline">Search</Button>
                        </form>

                        <Button onClick={() => setCreateOpen(true)}>
                            <UserPlus className="h-4 w-4 mr-2" />
                            Add User
                        </Button>
                    </div>
                </CardHeader>

                <CardContent className="space-y-3">
                    {/* Sort & page controls */}
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-2">
                            <Label className="text-sm">Sort By</Label>
                            <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
                                <SelectTrigger className="w-[140px]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="created_at">Created</SelectItem>
                                    <SelectItem value="name">Name</SelectItem>
                                    <SelectItem value="email">Email</SelectItem>
                                </SelectContent>
                            </Select>
                            <Select value={order} onValueChange={(v) => setOrder(v as any)}>
                                <SelectTrigger className="w-[120px]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="DESC">Desc</SelectItem>
                                    <SelectItem value="ASC">Asc</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="ml-auto flex items-center gap-2">
                            <Label className="text-sm">Per Page</Label>
                            <Select value={String(perPage)} onValueChange={(v) => { setPerPage(parseInt(v)); setPage(1); }}>
                                <SelectTrigger className="w-[100px]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="10">10</SelectItem>
                                    <SelectItem value="20">20</SelectItem>
                                    <SelectItem value="50">50</SelectItem>
                                </SelectContent>
                            </Select>
                            <div className="flex items-center gap-1">
                                <Button variant="outline" size="icon" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}>
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <div className="px-2 text-sm">Page {page} / {pages}</div>
                                <Button variant="outline" size="icon" onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page >= pages}>
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </div>

                    <Table>
                        <TableCaption>{total} user(s) total</TableCaption>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[60px]">ID</TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {rows.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center text-sm text-muted-foreground">
                                        No users found.
                                    </TableCell>
                                </TableRow>
                            ) : rows.map((u) => (
                                <TableRow key={u.id}>
                                    <TableCell>{u.id}</TableCell>
                                    <TableCell>{u.name}</TableCell>
                                    <TableCell>{u.email}</TableCell>
                                    <TableCell className="capitalize flex items-center gap-1">
                                        <Shield className="h-4 w-4 opacity-70" />
                                        {u.role}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button variant="outline" size="sm" onClick={() => openView(u)}>
                                                <Eye className="h-4 w-4 mr-1" /> Profile
                                            </Button>
                                            <Button variant="destructive" size="sm" onClick={() => onDelete(u)}>
                                                <Trash2 className="h-4 w-4 mr-1" /> Delete
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* View User Modal */}
            <Dialog open={viewOpen} onOpenChange={setViewOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>User Profile</DialogTitle>
                        <DialogDescription>Basic read-only details.</DialogDescription>
                    </DialogHeader>
                    {viewUser ? (
                        <div className="space-y-3">
                            <div className="grid grid-cols-3 gap-2">
                                <div className="text-sm text-muted-foreground">ID</div>
                                <div className="col-span-2 text-sm">{viewUser.id}</div>

                                <div className="text-sm text-muted-foreground">Name</div>
                                <div className="col-span-2 text-sm">{viewUser.name}</div>

                                <div className="text-sm text-muted-foreground">Email</div>
                                <div className="col-span-2 text-sm">{viewUser.email}</div>

                                <div className="text-sm text-muted-foreground">Role</div>
                                <div className="col-span-2 text-sm capitalize">{viewUser.role}</div>

                                <div className="text-sm text-muted-foreground">Created</div>
                                <div className="col-span-2 text-sm">{viewUser.created_at || "-"}</div>

                                <div className="text-sm text-muted-foreground">Updated</div>
                                <div className="col-span-2 text-sm">{viewUser.updated_at || "-"}</div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-sm text-muted-foreground">Loading…</div>
                    )}
                    <DialogFooter>
                        <Button onClick={() => setViewOpen(false)}>Close</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Create User Modal */}
            <Dialog open={createOpen} onOpenChange={(o) => { setCreateOpen(o); if (!o) resetCreateForm(); }}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Add New User</DialogTitle>
                        <DialogDescription>Create an admin or editor account.</DialogDescription>
                    </DialogHeader>

                    <form onSubmit={submitCreate} className="space-y-3">
                        <div className="space-y-1">
                            <Label htmlFor="cname">Name</Label>
                            <Input id="cname" value={cName} onChange={(e) => setCName(e.target.value)} placeholder="Jane Doe" required />
                        </div>

                        <div className="space-y-1">
                            <Label htmlFor="cemail">Email</Label>
                            <Input id="cemail" type="email" value={cEmail} onChange={(e) => setCEmail(e.target.value)} placeholder="jane@example.com" required />
                        </div>

                        <div className="space-y-1">
                            <Label>Role</Label>
                            <Select value={cRole} onValueChange={(v) => setCRole(v as "admin" | "editor")}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select role" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="editor">Editor</SelectItem>
                                    <SelectItem value="admin">Admin</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1">
                            <Label htmlFor="cpassword">Password</Label>
                            <Input id="cpassword" type="password" value={cPassword} onChange={(e) => setCPassword(e.target.value)} placeholder="••••••••" required />
                            <p className="text-xs text-muted-foreground">Minimum 6 characters.</p>
                        </div>

                        <DialogFooter className="gap-2">
                            <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
                            <Button type="submit">Create</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default Users;
