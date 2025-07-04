// app/signin/page.tsx
import React from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { signInWithGoogleToDashboard } from "../actions/auth";

export default async function SignIn() {
  const session = await auth();

  if (session) {
    console.log(
      "------------------user already logged in-----------------------"
    );
    console.log("session", session);

    redirect("/DashboardPage");
  }

  return (
    <div className="flex justify-center items-center h-screen">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold">Sign in to your account</h2>
        </div>
        <form action={signInWithGoogleToDashboard}>
          <button
            className="w-full bg-blue-500 text-white p-3 rounded-md hover:bg-blue-600 transition-colors"
            type="submit"
          >
            Continue with Google
          </button>
        </form>
      </div>
    </div>
  );
}
