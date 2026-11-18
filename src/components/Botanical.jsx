export default function Botanical({ className = "" }) {
  return (
    <svg
      className={`botanical ${className}`}
      viewBox="0 0 120 180"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.3"
      aria-hidden="true"
    >
      <path d="M50 170Q100 90 48 12M71 119Q20 119 25 87Q59 87 71 119M73 83Q111 65 100 41Q72 46 73 83M59 43Q30 44 32 18Q56 15 59 43M64 142Q102 143 108 113Q80 102 64 142" />
      <path d="M49 14q-16-12-8-17m8 17q15-17 20-5" />
    </svg>
  );
}
