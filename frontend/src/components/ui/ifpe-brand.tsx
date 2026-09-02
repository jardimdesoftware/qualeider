interface IfpeBrandProps {
  compact?: boolean;
  inverse?: boolean;
  subtitle?: string;
  className?: string;
}

export default function IfpeBrand({
  compact = false,
  inverse = false,
  subtitle = "Pernambuco",
  className = "",
}: IfpeBrandProps) {
  const wordColor = inverse ? "text-white" : "text-black";
  const subtitleColor = inverse ? "text-white/75" : "text-[#3b3b3b]";

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <div
        aria-hidden="true"
        className={`grid shrink-0 grid-cols-3 grid-rows-4 gap-0.5 ${
          compact ? "h-8 w-8" : "h-10 w-10"
        }`}
      >
        <span className="rounded-full bg-brand-secondary" />
        <span className="rounded-sm bg-brand-primary" />
        <span className="rounded-sm bg-brand-primary" />
        <span className="rounded-sm bg-brand-primary" />
        <span className="rounded-sm bg-brand-primary" />
        <span />
        <span className="rounded-sm bg-brand-primary" />
        <span className="rounded-sm bg-brand-primary" />
        <span className="rounded-sm bg-brand-primary" />
        <span className="rounded-sm bg-brand-primary" />
        <span className="rounded-sm bg-brand-primary" />
        <span />
      </div>
      <div className="leading-none">
        <div
          className={`font-extrabold uppercase leading-[0.98] tracking-normal ${wordColor} ${
            compact ? "text-[13px]" : "text-base"
          }`}
        >
          Instituto
          <br />
          Federal
        </div>
        <div className={`mt-0.5 text-[11px] leading-none ${subtitleColor}`}>
          {subtitle}
        </div>
      </div>
    </div>
  );
}
