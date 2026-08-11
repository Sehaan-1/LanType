export default function Logo({ size = 40 }: { size?: number }) {
  return (
    <div
      className="relative flex items-center justify-center rounded-2xl shadow-lg shadow-cyan-500/30"
      style={{ width: size, height: size }}
    >
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-cyan-400 via-violet-500 to-pink-500" />
      <div className="absolute inset-[2px] rounded-[14px] bg-slate-950" />
      <svg
        className="relative z-10"
        width={size * 0.6}
        height={size * 0.6}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="logoGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#22d3ee" />
            <stop offset="100%" stopColor="#a855f7" />
          </linearGradient>
        </defs>
        <path
          d="M12 2L2 7l10 5 10-5-10-5z"
          stroke="url(#logoGrad)"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <path
          d="M2 17l10 5 10-5M2 12l10 5 10-5"
          stroke="url(#logoGrad)"
          strokeWidth="1.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}
