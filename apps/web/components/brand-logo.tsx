interface BrandLogoProps {
  size?: number;
  className?: string;
}

export function BrandLogo({ size = 32, className }: BrandLogoProps) {
  const id = 'brand-logo-gradient';
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 32 32"
      width={size}
      height={size}
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={id} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="hsl(250 85% 60%)" />
          <stop offset="100%" stopColor="hsl(200 100% 50%)" />
        </linearGradient>
      </defs>
      <path
        d="M16 3l2.47 7.6h7.99l-6.47 4.7 2.47 7.6L16 18.2l-6.46 4.7 2.47-7.6-6.47-4.7h7.99z"
        fill={`url(#${id})`}
      />
    </svg>
  );
}
