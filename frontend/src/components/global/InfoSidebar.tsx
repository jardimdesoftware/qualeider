import Link from "next/link";
import Image from "next/image";
import { LOGO_SIZES } from "@/constants/ui";

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
    <div className="hidden md:flex w-full md:w-1/2 bg-green-background p-12 flex-col justify-start relative">
      <div className="flex-1 flex flex-col justify-center">
        <div className="text-center mb-8">
          <h1 className="text-3xl text-white font-bold mb-4">{title}</h1>
          <p className="text-white text-base opacity-90">{subtitle}</p>
        </div>

        <div className="text-white space-y-6">
          {items.map((item, index) => (
            <div key={index} className="flex items-start space-x-3">
              <div className="bg-white bg-opacity-20 rounded-full p-2 mt-1 flex-shrink-0">
                <svg
                  className="w-4 h-4 text-white"
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
                <p className="text-sm opacity-90">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Logo no canto inferior direito */}
      <div className="mt-auto flex justify-end pt-8">
        <Image src="/logo_icon.svg" alt="Logo QualeIDer" className="w-20 h-20" width={LOGO_SIZES.XL} height={LOGO_SIZES.XL} />
      </div>
    </div>
  );
}
