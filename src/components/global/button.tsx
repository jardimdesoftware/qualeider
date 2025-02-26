"use client";

import Link from "next/link";
import { ButtonHTMLAttributes } from "react";
import clsx from "clsx";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  text: string;
  href?: string;
  bgColor?: string;
  textColor?: string;
  hoverColor?: string;
  className?: string;
}

export default function Button({
  text,
  href,
  bgColor = "bg-primary",
  textColor = "text-primary-foreground",
  hoverColor = "hover:bg-primary/90",
  className = "",
  disabled,
  ...props
}: ButtonProps) {
  const classNames = clsx(
    "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 px-4 py-2",
    bgColor,
    textColor,
    hoverColor,
    disabled && "opacity-50 cursor-not-allowed",
    className
  );

  if (href) {
    return (
      <Link href={href} className={classNames} aria-disabled={disabled}>
        {text}
      </Link>
    );
  }

  return (
    <button type="button" disabled={disabled} className={classNames} {...props}>
      {text}
    </button>
  );
}
