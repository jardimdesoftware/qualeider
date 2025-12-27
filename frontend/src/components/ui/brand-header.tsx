import Image from "next/image";
import { LOGO_SIZES } from "@/constants/ui";

interface BrandHeaderProps {
  title: string;
  subtitle: string;
  logoSrc?: string;
  className?: string;
}

export default function BrandHeader({
  title,
  subtitle,
  logoSrc = "/logo_icon.svg",
  className = "bg-brand-primary", // Default color
}: BrandHeaderProps) {
  return (
    <div className={`${className} pt-12 pb-8 px-8 relative`}>
      <div className="flex justify-center mb-6">
        <Image
          src={logoSrc}
          alt={`${title} Logo`}
          className="w-24 h-24"
          width={LOGO_SIZES.XXL}
          height={LOGO_SIZES.XXL}
        />
      </div>

      <h1 className="text-white text-4xl font-bold text-center mb-2">
        {title}
      </h1>

      <p className="text-brand-accent text-center text-sm font-semibold tracking-wide">
        {subtitle}
      </p>

      <div className="absolute bottom-0 left-0 right-0 h-1 bg-brand-secondary"></div>
    </div>
  );
}
