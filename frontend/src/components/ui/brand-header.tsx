import Image from "next/image";
import { LOGO_SIZES } from "@/constants/ui";
import IfpeBrand from "./ifpe-brand";

interface BrandHeaderProps {
  title: string;
  subtitle: string;
  logoSrc?: string;
  className?: string;
}

export default function BrandHeader({
  title,
  subtitle,
  logoSrc = "/logo_cow.png",
  className = "bg-white",
}: BrandHeaderProps) {
  return (
    <div className={`${className} relative border-t-4 border-brand-primary px-6 pb-7 pt-8 md:px-8`}>
      <div className="mb-6 flex items-center justify-between gap-4">
        <IfpeBrand />
        <Image
          src={logoSrc}
          alt={`${title} Logo`}
          className="h-14 w-14 rounded-md border border-brand-border bg-white p-1"
          width={LOGO_SIZES.LG}
          height={LOGO_SIZES.LG}
        />
      </div>

      <h1 className="mb-2 text-left text-2xl font-extrabold text-gray-950 md:text-3xl">
        {title}
      </h1>

      <p className="text-left text-sm font-semibold text-brand-muted">
        {subtitle}
      </p>

      <div className="absolute bottom-0 left-0 h-1 w-[6%] bg-brand-secondary" />
      <div className="absolute bottom-0 left-[6%] right-0 h-1 bg-brand-primary" />
    </div>
  );
}
