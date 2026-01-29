import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { SketchPicker } from "react-color";
import type { ColorResult } from "react-color";
import { Button } from "@/components/ui/button";

const DEFAULT_COLOR = "#f28c28";

// Definimos la interfaz para las props
interface EnhancedColorPickerProps {
    selectedColor: string;
    setSelectedColor: (color: string) => void;
    isPickerOpen?: boolean;
    setIsPickerOpen?: (open: boolean) => void;
    // Cambiamos el tipo para permitir | null
    pickerRef?: React.RefObject<HTMLDivElement | null>; 
  }

export default function EnhancedColorPicker({
  selectedColor,
  setSelectedColor,
  isPickerOpen,
  setIsPickerOpen,
  pickerRef,
}: EnhancedColorPickerProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  
  // Determinamos si el componente es controlado o no
  const open = typeof isPickerOpen === "boolean" ? isPickerOpen : internalOpen;
  const setOpen = typeof setIsPickerOpen === "function" ? setIsPickerOpen : setInternalOpen;
  
  const [position, setPosition] = useState({ top: 0, left: 0 });

  // Tipamos la referencia del contenedor
  const internalRef = useRef<HTMLDivElement>(null);
  const containerRef = pickerRef || internalRef;

  useEffect(() => {
    if (open && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      // Ajuste de posición (puedes ajustar los offsets según necesites)
      setPosition({ top: rect.bottom + window.scrollY + 5, left: rect.left + window.scrollX - 60 });
    }
  }, [open, containerRef]);

  // Tipamos el evento de cambio de color
  const handleColorChangeComplete = (color: ColorResult) => {
    setSelectedColor(color.hex);
  };

  const togglePicker = () => {
    setOpen(!open);
  };

  return (
    <div className="relative inline-block" ref={containerRef}>
      <Button
        variant="outline"
        className="h-8 w-12 p-0 border-gray-300" 
        onClick={togglePicker}
        aria-label="Open color picker"
        type="button" // Evita submits accidentales si está en un form
      >
        <div
          className="h-full w-full rounded-sm overflow-hidden"
          style={{ backgroundColor: selectedColor || DEFAULT_COLOR }}
          aria-hidden="true" 
        />
      </Button>
      
      {open &&
        createPortal(
          <div
            className="fixed z-[9999]" // Usamos fixed para portales para evitar problemas de scroll
            style={{ top: position.top, left: position.left }}
          >
            <SketchPicker
              color={selectedColor || DEFAULT_COLOR}
              onChangeComplete={handleColorChangeComplete}
            />
          </div>,
          document.body 
        )}
    </div>
  );
}