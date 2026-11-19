import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/server/session";
import { LoginForm } from "./login-form";

export const metadata = { title: "Sign in" };

export default async function LoginPage() {
  if (await getSessionUser()) redirect("/");
  return (
    <main className="min-h-dvh flex items-center justify-center px-4 py-10">
      <LoginForm />
    </main>
  );
}
