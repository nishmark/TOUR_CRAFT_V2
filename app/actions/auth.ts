"use server";

import { signIn, signOut } from "@/auth";
import { redirect } from "next/navigation";

export async function signInWithGoogle(redirectTo?: string) {
  await signIn("google", { redirectTo });
}

export async function signInWithGoogleToDashboard() {
  await signIn("google", { redirectTo: "/DashboardPage" });
}

export async function signOutUser() {
  await signOut();
  redirect("/");
}
