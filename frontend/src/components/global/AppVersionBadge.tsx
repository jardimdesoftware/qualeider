const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION || "dev";
const REPO_RELEASES_URL = "https://github.com/jardimdesoftware/qualeider/releases/tag/";

interface AppVersionBadgeProps {
  className?: string;
}

export default function AppVersionBadge({ className = "" }: AppVersionBadgeProps) {
  const isTaggedRelease = /^v?\d+\.\d+\.\d+/.test(APP_VERSION);
  const label = `v${APP_VERSION.replace(/^v/, "")}`;

  if (isTaggedRelease) {
    return (
      <a
        href={`${REPO_RELEASES_URL}${APP_VERSION}`}
        target="_blank"
        rel="noopener noreferrer"
        className={`hover:underline ${className}`}
        title="Ver release no GitHub"
      >
        {label}
      </a>
    );
  }

  return <span className={className}>{label}</span>;
}
