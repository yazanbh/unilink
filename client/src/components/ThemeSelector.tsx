import { Button } from "@/components/ui/button";
import { Palette } from "lucide-react";
import { useState } from "react";

export type ProfileTheme = "blue" | "purple" | "pink" | "green" | "orange";

interface ThemeSelectorProps {
  selectedTheme: ProfileTheme;
  onThemeChange: (theme: ProfileTheme) => void;
}

const THEMES: Array<{ id: ProfileTheme; name: string; color: string }> = [
  { id: "blue", name: "Blue", color: "bg-blue-500" },
  { id: "purple", name: "Purple", color: "bg-purple-500" },
  { id: "pink", name: "Pink", color: "bg-pink-500" },
  { id: "green", name: "Green", color: "bg-green-500" },
  { id: "orange", name: "Orange", color: "bg-orange-500" },
];

export function ThemeSelector({ selectedTheme, onThemeChange }: ThemeSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="space-y-3">
      <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
        <Palette className="w-4 h-4" />
        Profile Theme
      </label>
      <div className="grid grid-cols-5 gap-2">
        {THEMES.map((theme) => (
          <button
            key={theme.id}
            onClick={() => onThemeChange(theme.id)}
            className={`w-full h-12 rounded-lg transition-all ${theme.color} ${
              selectedTheme === theme.id
                ? "ring-2 ring-offset-2 ring-slate-400 scale-105"
                : "hover:scale-105"
            }`}
            title={theme.name}
          />
        ))}
      </div>
    </div>
  );
}
