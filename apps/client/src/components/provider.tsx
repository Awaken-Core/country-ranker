"use client";

import { Toaster } from "./ui/sonner";
import QueryProvider from "./query-client";
import { ThemeProvider } from "./theme-provider";

const Providers = ({ children }: { children: React.ReactNode }) => {
    return (
        <QueryProvider>
            <ThemeProvider
                attribute="class"
                defaultTheme="dark"
                forcedTheme="dark"
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
