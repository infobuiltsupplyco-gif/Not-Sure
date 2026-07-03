"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Inline script that applies the saved theme before hydration to avoid a
 * flash of the wrong theme. Defaults to dark — the BuiltFit brand look.
 */
export function ThemeScript() {
  const code = `(function(){try{var t=localStorage.getItem("bf-theme");if(t==="light"){document.documentElement.classList.remove("dark")}else{document.documentElement.classList.add("dark")}}catch(e){document.documentElement.classList.add("dark")}})();`;
  return <script dangerouslySetInnerHTML={{ __html: code }} />;
}

export function ThemeToggle() {
  const [isDark, setIsDark] = React.useState<boolean | null>(null);

  React.useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  const toggle = () => {
    const next = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("bf-theme", next ? "dark" : "light");
    } catch {
      // storage unavailable; theme just won't persist
    }
    setIsDark(next);
  };

  return (
    <Button variant="ghost" size="icon" onClick={toggle} aria-label="Toggle theme">
      {isDark === false ? <Moon /> : <Sun />}
    </Button>
  );
}
