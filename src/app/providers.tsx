"use client";

import { apiFetcher } from "@/lib/api/fetcher";
import { SWRConfig } from "swr";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SWRConfig
      value={{
        fetcher: apiFetcher,
        revalidateOnFocus: true,
        revalidateOnReconnect: true,
        shouldRetryOnError: true,
        errorRetryCount: 2,
      }}
    >
      {children}
    </SWRConfig>
  );
}
