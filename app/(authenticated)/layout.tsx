import { hasEnvVars } from "@/utils/supabase/check-env-vars";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { EnvVarWarning } from "@/components/env-var-warning";
import HeaderAuth from "@/components/header-auth";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

export default async function AuthenticatedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  return (
    <main className="min-h-screen flex flex-col items-center">
      <div className="flex-1 w-full flex flex-col items-center">
        <nav className="w-full flex justify-center border-b border-b-foreground/10 h-16">
          <div className="w-full max-w-7xl flex justify-between items-center p-3 px-5 text-sm">
            <div className="flex gap-5 items-center font-semibold">
              <Link
                href={"/"}
                className="text-primary text-lg flex items-center gap-2"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-6 h-6"
                >
                  <path
                    fillRule="evenodd"
                    d="M12 1.5a5.25 5.25 0 00-5.25 5.25v3a3 3 0 00-3 3v6.75a3 3 0 003 3h10.5a3 3 0 003-3v-6.75a3 3 0 00-3-3v-3c0-2.9-2.35-5.25-5.25-5.25zm3.75 8.25v-3a3.75 3.75 0 10-7.5 0v3h7.5z"
                    clipRule="evenodd"
                  />
                </svg>
                OxyFlow
              </Link>
              <div className="hidden md:flex gap-4">
                <Link href="/dashboard" className="hover:text-primary">
                  Dashboard
                </Link>
                <Link href="/tank-manager" className="hover:text-primary">
                  Tank Manager
                </Link>
                <Link href="/borrow" className="hover:text-primary">
                  Borrow
                </Link>
                <Link href="/return" className="hover:text-primary">
                  Return
                </Link>
                <Link href="/scan" className="hover:text-primary">
                  Scan
                </Link>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {!hasEnvVars ? <EnvVarWarning /> : <HeaderAuth />}
              <ThemeSwitcher />
            </div>
          </div>
        </nav>
        <div className="flex-1 flex flex-col gap-20 p-5 w-full">{children}</div>

        <footer className="w-full mt-auto border-t border-t-foreground/10 p-8 flex justify-center text-center text-xs">
          <div className="max-w-7xl w-full">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-primary font-semibold">OxyFlow</span>
                <span>
                  © {new Date().getFullYear()} - Nonprofit Oxygen Tank
                  Management
                </span>
              </div>
              <div>
                <p>
                  Powered by{" "}
                  <a
                    href="https://supabase.com"
                    target="_blank"
                    className="font-bold hover:underline text-primary"
                    rel="noreferrer"
                  >
                    Supabase
                  </a>
                </p>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </main>
  );
}
