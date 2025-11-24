import React, { createContext, useContext, useState } from 'react';

type ErrorContextType = {
    error: string | null;
    setError: (msg: string | null) => void;
};

export const ErrorContext = createContext<ErrorContextType | undefined>(undefined);

export const ErrorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [error, setError] = useState<string | null>(null);
    return (
        <ErrorContext.Provider value={{ error, setError }}>
            {children}
            {error && (
                <div className="fixed bottom-4 right-4 z-50">
                    <div className="bg-red-600 text-white px-4 py-2 rounded shadow">
                        {error}
                        <button className="ml-4 underline" onClick={() => setError(null)}>Dismiss</button>
                    </div>
                </div>
            )}
        </ErrorContext.Provider>
    );
};
export const useError = () => {
    const ctx = useContext(ErrorContext)
    if (!ctx) throw new Error('useError must be used inside ErrorProvider');
    return ctx;
} 