import Image from "next/image";
import { LOGO_SIZES } from "@/constants/ui";
import { IfpeBrand } from "@/components/ui";

interface InfoItem {
  title: string;
  description: string;
}

interface InfoSidebarProps {
  title: string;
  subtitle: string;
  items: InfoItem[];
}

export default function InfoSidebar({
  title,
  subtitle,
  items,
}: InfoSidebarProps) {
  return (
    <div className="relative hidden w-full flex-col justify-start border-r border-brand-border bg-white p-12 md:flex md:w-1/2">
      <div className="flex-1 flex flex-col justify-center">
        <div className="mb-8">
          <IfpeBrand className="mb-8" />
          <h1 className="mb-4 text-3xl font-extrabold text-gray-950">{title}</h1>
          <p className="text-base text-brand-muted">{subtitle}</p>
        </div>

        <div className="space-y-6 text-gray-800">
          {items.map((item, index) => (
            <div key={index} className="flex items-start space-x-3">
              <div className="mt-1 flex-shrink-0 rounded-full bg-brand-accent p-2 text-brand-primary">
                <svg
                  className="h-4 w-4"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold mb-1 text-base">{item.title}</h3>
                <p className="text-sm text-brand-muted">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Logo no canto inferior direito */}
      <div className="mt-auto flex justify-end pt-8">
        <Image
          src="/logo_icon.svg"
          alt="Logo QualeIDer"
          className="h-20 w-20 rounded-md border border-brand-border bg-white p-2"
          width={LOGO_SIZES.XL}
          height={LOGO_SIZES.XL}
        />
      </div>
    </div>
  );
}
