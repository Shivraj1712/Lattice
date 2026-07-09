import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 relative overflow-hidden">

      {/* Background grid texture */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage:
            "linear-gradient(#181616 1px, transparent 1px), linear-gradient(90deg, #181616 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      {/* Big 404 backdrop number */}
      <span
        className="pointer-events-none absolute select-none font-sans font-black text-[22vw] leading-none tracking-tighter text-brand-black opacity-[0.04]"
        aria-hidden="true"
      >
        404
      </span>

      {/* Card */}
      <div className="relative awwwards-card px-10 py-12 max-w-lg w-full text-center">

        {/* Top label */}
        <p className="font-mono text-xs font-semibold uppercase tracking-widest text-brand-rose mb-6">
          Error 404
        </p>

        {/* Headline */}
        <h1 className="font-sans font-black text-5xl sm:text-6xl uppercase tracking-tight text-brand-black leading-none mb-4">
          Page<br />Not Found
        </h1>

        {/* Divider */}
        <div className="awwwards-border-t w-16 mx-auto my-6" />

        {/* Sub-copy */}
        <p className="font-sans text-base text-brand-black/70 mb-10 leading-relaxed">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
          Head back to explore projects on Lattice.
        </p>

        {/* CTA */}
        <Link
          href="/"
          className="awwwards-btn-primary inline-block px-8 py-3 text-sm"
        >
          ← Back to Lattice
        </Link>
      </div>

      {/* Bottom decoration */}
      <p className="relative mt-8 font-mono text-[11px] uppercase tracking-widest text-brand-black/30">
        Lattice — Developer Project Showcase
      </p>
    </div>
  );
}
