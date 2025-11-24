import React, { createContext, useContext, useState } from 'react';

type LoadingContextType = {
    isLoading: boolean;
    setLoading: (v: boolean) => void;
};

export const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export const LoadingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isLoading, setIsLoading] = useState(false);
    return (
        <LoadingContext.Provider value={{ isLoading, setLoading: setIsLoading }}>
            {children}
        </LoadingContext.Provider>
    );
};

export const useLoading = () => {
    const ctx = useContext(LoadingContext)
    if (!ctx) throw new Error('useLoading must be used inside LoadingProvider');
    return ctx;
} 