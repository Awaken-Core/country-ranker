"use client";

import { useEffect } from "react";
import { Toaster } from "./ui/sonner";
import QueryProvider from "./query-client";
import { ThemeProvider } from "./theme-provider";

const AuthInitializer = () => {
    return null;
};

const Providers = ({ children }: { children: React.ReactNode }) => {
    return (
        <QueryProvider>
            <SmoothScroll />
            <ThemeProvider
                attribute="class"
                defaultTheme="light"
                forcedTheme="light"
                enableSystem={false}
                disableTransitionOnChange
            >
                {children}
                <Toaster position="top-center" />
            </ThemeProvider>
        </QueryProvider>
    );
};

export default Providers;
