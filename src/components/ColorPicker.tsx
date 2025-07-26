import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Palette } from "lucide-react";

interface ColorPickerProps {
  color: string;
  onChange: (color: string) => void;
}

export const ColorPicker = ({ color, onChange }: ColorPickerProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const colors = [
    "#000000", "#ffffff", "#ff0000", "#00ff00", "#0000ff", "#ffff00", 
    "#ff00ff", "#00ffff", "#800000", "#008000", "#000080", "#808000",
    "#800080", "#008080", "#c0c0c0", "#808080", "#ffa500", "#a52a2a",
    "#dda0dd", "#98fb98", "#f0e68c", "#fa8072", "#87ceeb", "#ffd700"
  ];

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="w-10 h-10 p-0 border-2"
          style={{ backgroundColor: color }}
        >
          <span className="sr-only">Selecionar cor</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3">
        <div className="grid grid-cols-6 gap-2">
          {colors.map((c) => (
            <button
              key={c}
              onClick={() => {
                onChange(c);
                setIsOpen(false);
              }}
              className="w-8 h-8 rounded border border-gray-300 hover:scale-110 transition-transform"
              style={{ backgroundColor: c }}
              title={c}
            />
          ))}
        </div>
        <div className="mt-3">
          <input
            type="color"
            value={color}
            onChange={(e) => onChange(e.target.value)}
            className="w-full h-8 rounded border border-gray-300"
          />
        </div>
      </PopoverContent>
    </Popover>
  );
};