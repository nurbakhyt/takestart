/** Линейные иконки витрины: штрих currentColor, сетка 24. */
function Base({
  children,
  className = "h-5 w-5",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`shrink-0 ${className}`}
    >
      {children}
    </svg>
  );
}

export function BagIcon({ className }: { className?: string }) {
  return (
    <Base className={className}>
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
      <path d="M3 6h18" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </Base>
  );
}

export function PlusIcon({ className }: { className?: string }) {
  return (
    <Base className={className}>
      <path d="M12 5v14M5 12h14" />
    </Base>
  );
}

export function MinusIcon({ className }: { className?: string }) {
  return (
    <Base className={className}>
      <path d="M5 12h14" />
    </Base>
  );
}

export function CloseIcon({ className }: { className?: string }) {
  return (
    <Base className={className}>
      <path d="M18 6 6 18M6 6l12 12" />
    </Base>
  );
}

export function ZoomIcon({ className }: { className?: string }) {
  return (
    <Base className={className}>
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" />
      <path d="M11 8v6M8 11h6" />
    </Base>
  );
}

export function PhoneIcon({ className }: { className?: string }) {
  return (
    <Base className={className}>
      <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.13.96.36 1.9.7 2.8a2 2 0 0 1-.45 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.45c.9.34 1.84.57 2.8.7A2 2 0 0 1 22 16.9z" />
    </Base>
  );
}
