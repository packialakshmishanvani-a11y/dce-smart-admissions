export function LogoMark({ className = "" }: { className?: string }) {
  return (
    <span
      role="img"
      aria-label="Dhanalakshmi College of Engineering Logo"
      className={`relative inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-navy-950 via-navy-900 to-navy-800 text-white shadow-md ring-1 ring-white/20 ${className}`}
    >
      <svg
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="size-7"
        aria-hidden="true"
      >
        <path
          d="M20 4L7 9V19C7 26.5 12.5 33.5 20 36C27.5 33.5 33 26.5 33 19V9L20 4Z"
          fill="url(#shield-gradient)"
          stroke="#0891b2"
          strokeWidth="1.2"
        />
        {/* Book of knowledge */}
        <path
          d="M14 23C16 22 18.5 22.5 20 24C21.5 22.5 24 22 26 23V16C24 15 21.5 15.5 20 17C18.5 15.5 16 15 14 16V23Z"
          fill="#ffffff"
          opacity="0.95"
        />
        {/* Academic Star / Torch flame */}
        <path
          d="M20 10.5L21.2 13.5L24 14L21.8 15.8L22.5 18.5L20 17L17.5 18.5L18.2 15.8L16 14L18.8 13.5L20 10.5Z"
          fill="#38bdf8"
        />
        <defs>
          <linearGradient id="shield-gradient" x1="7" y1="4" x2="33" y2="36" gradientUnits="userSpaceOnUse">
            <stop stopColor="#0a2342" />
            <stop offset="1" stopColor="#061630" />
          </linearGradient>
        </defs>
      </svg>
    </span>
  );
}
