export const AaharSetuLogo = ({ className = "w-8 h-8" }: { className?: string }) => (
  <svg
    viewBox="0 0 64 64"
    className={className}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Leaf shape - custom AaharSetu logo */}
    <g stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      {/* Main leaf outline */}
      <path d="M 32 12 Q 48 16 48 32 Q 48 48 32 52 Q 16 48 16 32 Q 16 16 32 12 Z" />
      
      {/* Leaf vein detail */}
      <path d="M 32 12 Q 32 32 32 52" />
      
      {/* Leaf texture curves */}
      <path d="M 24 22 Q 28 28 32 32" />
      <path d="M 40 22 Q 36 28 32 32" />
    </g>
  </svg>
)
