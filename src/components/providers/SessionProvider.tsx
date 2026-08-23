"use client";

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react";
import React from "react";

export default function SessionProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextAuthSessionProvider>) {
  return <NextAuthSessionProvider {...props}>{children}</NextAuthSessionProvider>;
}
