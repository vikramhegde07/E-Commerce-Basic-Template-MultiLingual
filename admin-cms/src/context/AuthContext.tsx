import React, { createContext, useContext, useEffect, useState } from 'react';

type User = {
    id: number;
    username: string;
    email?: string;
    role?: string;
};

type AuthContextType = {
    user: User | null;
    loading: boolean;
    login: ({ token, userData }: { token: string, userData: User }) => void;
    logout: () => void;
    userToken?: string | null;
};

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [userToken, setUserToken] = useState<string | null>(null);

    useEffect(() => {
        const token = localStorage.getItem('user_token');
        const userString = localStorage.getItem('userData');
        if (token && userString) {
            try {
                const userData = JSON.parse(userString);
                setUser(userData);
                setUserToken(token);
            } catch (err) {
                console.warn('Failed to parse stored userData, clearing it.');
                localStorage.removeItem('userData');
                localStorage.removeItem('user_token');
            }
        }

        setLoading(false);
    }, []);

    const login = ({ token, userData }: { token: string, userData: User }) => {
        localStorage.setItem('user_token', token);
        localStorage.setItem('userData', JSON.stringify(userData));
        setUserToken(token);
        setUser(userData);
    };

    const logout = async () => {
        setUser(null);
        setUserToken(null);
        localStorage.removeItem('user_token');
        localStorage.removeItem('userData');
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, logout, userToken }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const ctx = useContext(AuthContext)
    if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
    return ctx;
} 