import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
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
            </div>
          </div>
        </nav>
        <div className="flex-1 flex flex-col gap-20 p-5 w-full">
          <div className="flex-1 flex flex-col w-full px-4 sm:px-8 py-8">
            {/* Hero Section */}
            <section className="w-full max-w-7xl mx-auto py-12 md:py-24 flex flex-col items-center text-center">
              <div className="space-y-4 mb-8">
                <h1 className="text-4xl md:text-6xl font-bold tracking-tighter">
                  <span className="text-primary">OxyFlow</span> - Oxygen Tank
                  Management
                </h1>
                <p className="text-xl text-muted-foreground max-w-[700px] mx-auto">
                  Simplifying oxygen cylinder tracking, loans, and maintenance
                  for nonprofit organizations.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 mt-6">
                <Link href="/borrow">
                  <Button size="lg" className="rounded-xl">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 mr-2"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Borrow Cylinder
                  </Button>
                </Link>
                <Link href="/return">
                  <Button size="lg" variant="outline" className="rounded-xl">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 mr-2"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Return Cylinder
                  </Button>
                </Link>
              </div>
            </section>

            {/* Features Section */}
            <section className="w-full max-w-7xl mx-auto py-12 md:py-24">
              <h2 className="text-3xl font-bold text-center mb-12">
                How It Works
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="flex flex-col items-center text-center p-6 rounded-2xl border bg-card">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6 text-primary"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                      />
                    </svg>
                  </div>
                  <h3 className="text-xl font-medium mb-2">
                    1. Request a Cylinder
                  </h3>
                  <p className="text-muted-foreground">
                    Fill out the borrow form with your details and we'll find
                    the nearest available oxygen cylinder for you.
                  </p>
                </div>

                <div className="flex flex-col items-center text-center p-6 rounded-2xl border bg-card">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6 text-primary"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                      />
                    </svg>
                  </div>
                  <h3 className="text-xl font-medium mb-2">2. Pickup & Use</h3>
                  <p className="text-muted-foreground">
                    Once approved, pick up your cylinder from the assigned
                    warehouse and use it for your needs.
                  </p>
                </div>

                <div className="flex flex-col items-center text-center p-6 rounded-2xl border bg-card">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6 text-primary"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-xl font-medium mb-2">
                    3. Return When Done
                  </h3>
                  <p className="text-muted-foreground">
                    Use the return form to initiate the return process and bring
                    the cylinder back to the warehouse.
                  </p>
                </div>
              </div>
            </section>

            {/* Staff Section */}
            <section className="w-full max-w-7xl mx-auto py-12 md:py-24 text-center">
              <h2 className="text-3xl font-bold mb-6">For Staff Members</h2>
              <p className="text-xl text-muted-foreground max-w-[700px] mx-auto mb-8">
                Access the dashboard to manage cylinders, approve loans, and
                track maintenance.
              </p>
              <Link href="/dashboard">
                <Button size="lg" variant="secondary" className="rounded-xl">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 mr-2"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M3 5a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2h-2.22l.123.489.804.804A1 1 0 0113 18H7a1 1 0 01-.707-1.707l.804-.804L7.22 15H5a2 2 0 01-2-2V5zm5.771 7H5V5h10v7H8.771z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Staff Dashboard
                </Button>
              </Link>
            </section>
          </div>
        </div>

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
