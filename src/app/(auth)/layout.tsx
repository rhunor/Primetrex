import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      {/* Left: Form area */}
      <div className="flex flex-1 flex-col justify-center px-6 py-12 lg:px-20">
        <div className="mx-auto w-full max-w-md">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 mb-10">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary">
              <span className="text-xl font-bold text-white font-heading">P</span>
            </div>
            <span className="text-xl font-bold font-heading text-primary-dark">
              Primetrex
            </span>
          </Link>

          {children}
        </div>
      </div>

      {/* Right: Brand panel (hidden on mobile) */}
      <div className="hidden lg:flex lg:flex-1 relative overflow-hidden gradient-hero">
        {/* Decorative elements */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center px-12">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm mx-auto mb-8">
              <span className="text-4xl font-bold text-white font-heading">P</span>
            </div>
            <h2 className="text-3xl font-bold text-white font-heading">
              Let the Experts Trade,<br />
              <span className="text-secondary">You Build the Business</span>
            </h2>
            <p className="mt-4 text-white/50 text-lg max-w-sm mx-auto">
              Join our affiliate program and earn recurring commissions every month.
            </p>
          </div>
        </div>

        {/* Floating orbs */}
        <div className="absolute top-1/4 right-1/4 h-64 w-64 rounded-full bg-primary/20 blur-[100px] animate-pulse" />
        <div className="absolute bottom-1/4 left-1/4 h-48 w-48 rounded-full bg-secondary-dark/20 blur-[80px] animate-pulse" />
      </div>
    </div>
  );
}
