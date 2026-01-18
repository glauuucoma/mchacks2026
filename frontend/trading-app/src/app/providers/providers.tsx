"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Auth0Provider } from "@auth0/nextjs-auth0/client";
import { ReactNode } from "react";

const queryClient = new QueryClient();

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <Auth0Provider>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </Auth0Provider>
  );
}