import { Video, Phone, MessageSquare } from "lucide-react";

interface SessionFormatSelectorProps {
  value: string;
  onChange: (format: string) => void;
}

const formats = [
  {
    id: "video",
    label: "Video Call",
    description: "HD video session",
    icon: Video,
  },
  {
    id: "voice",
    label: "Voice Call",
    description: "Audio-only session",
    icon: Phone,
  },
  {
    id: "chat",
    label: "Chat",
    description: "Text-based consultation",
    icon: MessageSquare,
  },
];

export const SessionFormatSelector = ({
  value,
  onChange,
}: SessionFormatSelectorProps) => {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">Session Format</p>
      <div className="grid grid-cols-3 gap-3">
        {formats.map((format) => {
          const Icon = format.icon;
          const isSelected = value === format.id;
          return (
            <button
              key={format.id}
              type="button"
              onClick={() => onChange(format.id)}
              className={`flex flex-col items-center gap-2 rounded-lg border-2 p-3 transition-all text-center ${
                isSelected
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-muted hover:border-muted-foreground/30 text-muted-foreground"
              }`}
            >
              <Icon
                className={`h-6 w-6 ${
                  isSelected ? "text-primary" : "text-muted-foreground"
                }`}
              />
              <div>
                <p
                  className={`text-sm font-medium ${
                    isSelected ? "text-primary" : "text-foreground"
                  }`}
                >
                  {format.label}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {format.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default SessionFormatSelector;
