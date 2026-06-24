import Image from "next/image";
import { ExternalLink } from "lucide-react";

export default function Header() {
  return (
    <header className="bg-primary text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <div className="flex items-center gap-5">
            <Image
              src="/logos/samusocial.png"
              alt="Samusocial Brussels"
              width={180}
              height={56}
              className="h-12 w-auto brightness-0 invert"
              priority
            />
            <div className="hidden sm:block h-10 w-px bg-white/20" />
            <Image
              src="/logos/adfinitas.png"
              alt="Adfinitas"
              width={140}
              height={44}
              className="hidden sm:block h-10 w-auto rounded-md"
              priority
            />
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden md:inline text-xs text-white/50">
              Reporting Dashboard
            </span>
            <a
              href="https://www.samusocial.be"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs text-white/70 hover:text-white transition-colors"
            >
              samusocial.be
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    </header>
  );
}
