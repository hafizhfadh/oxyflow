import { signInAction } from "@/app/actions";
import { FormMessage, Message } from "@/components/form-message";
import { PasswordInput } from "@/components/password-input";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import Image from 'next/image';

export default async function Login(props: { searchParams: Promise<Message> }) {
  const message = await props.searchParams;

  return (
    <main className="min-h-screen w-screen flex">
      {/* 1/2: BG image */}
      <div className="hidden md:block md:flex-1 relative">
        <Image
          src="/images/auth-bg.png"
          alt="Auth illustration"
          fill
          className="object-cover"
          priority
        />
      </div>
      <div className="flex-1 flex items-center justify-center p-8 sm:p-12 w-full h-screen bg-gradient-to-br from-primary/10 to-secondary/10">
        <form
          action={signInAction}
          className="bg-white dark:bg-card rounded-2xl shadow-2xl overflow-hidden
                   w-full max-w-xl md:flex md:flex-row "
        >
          {/* 3️⃣ Left side: illustrative panel on md+ */}
          <div
            className="hidden md:block md:flex-1 bg-cover bg-center bg-[#F5F5F5]"
            style={{
              backgroundImage: "url('/images/logo.png')",
              backgroundPosition: "center",
              backgroundSize: "contain",
              backgroundRepeat: "no-repeat",
            }}
          />

          {/* 4️⃣ Right side: actual form, flex-1 so it fills half */}
          <div className="flex-1 p-8 sm:p-12">
            <h2 className="text-3xl font-extrabold text-center mb-2">
              Welcome Back
            </h2>
            <p className="text-sm text-center text-muted-foreground mb-6">
              Don’t have an account?{" "}
              <Link
                href="/sign-up"
                className="text-primary font-medium hover:underline"
              >
                Sign up
              </Link>
            </p>

            <div className="space-y-6">
              <div>
                <Label htmlFor="email" className="sr-only">
                  Email
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="you@example.com"
                  className="w-full transition-all duration-200 focus:border-primary"
                  autoFocus
                />
              </div>

              <div>
                <div className="flex justify-between items-center">
                  <Label htmlFor="password" className="sr-only">
                    Password
                  </Label>
                  <Link
                    href="/forgot-password"
                    className="text-sm text-primary hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <PasswordInput
                  id="password"
                  name="password"
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="w-full transition-all duration-200"
                />
              </div>

              <div className="flex items-center justify-between text-sm">
                <label className="inline-flex items-center">
                  <Input
                    id="remember"
                    name="remember"
                    type="checkbox"
                    className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary"
                  />
                  <span className="ml-2">Remember me</span>
                </label>
              </div>

              <div>
                <SubmitButton
                  type="submit"
                  pendingText="Signing in..."
                  className="w-full py-3 text-sm font-medium rounded-md
                           bg-primary text-white hover:bg-primary/90
                           focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary
                           transition-all duration-200"
                >
                  Sign in
                </SubmitButton>
              </div>

              <FormMessage message={message} />
            </div>
          </div>
        </form>
      </div>
    </main>
  );
}
