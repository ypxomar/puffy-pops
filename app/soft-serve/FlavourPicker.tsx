"use client";

import { Check } from "lucide-react";
import { flavours } from "./landing-data";
import type { CSSProperties, KeyboardEvent } from "react";

export default function FlavourPicker({ selected, onSelect, compact = false }: { selected: string; onSelect: (id: string) => void; compact?: boolean }) {
  const handleKeyboard = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const buttons = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>("button"));
    const current = Math.max(0, buttons.indexOf(document.activeElement as HTMLButtonElement));
    let next = current;
    if (event.key === "Home") next = 0;
    else if (event.key === "End") next = flavours.length - 1;
    else next = (current + (["ArrowLeft", "ArrowUp"].includes(event.key) ? -1 : 1) + flavours.length) % flavours.length;
    onSelect(flavours[next].id);
    buttons[next]?.focus();
  };

  return (
    <div className={`ss-flavour-picker ${compact ? "ss-flavour-picker-compact" : ""}`} role="group" aria-label="Choose your soft-serve flavour" onKeyDown={handleKeyboard}>
      {flavours.map((flavour) => (
        <button type="button" key={flavour.id} className={`ss-flavour-option ${selected === flavour.id ? "ss-is-selected" : ""}`} aria-pressed={selected === flavour.id} onClick={() => onSelect(flavour.id)} style={{ "--ss-swatch": flavour.swatch } as CSSProperties}>
          <span className="ss-flavour-swatch" aria-hidden="true"><svg viewBox="0 0 40 40" fill="none"><path d="M9 24C9 11 31 7 31 21C31 31 16 32 15 23C14 16 24 15 24 21" stroke="currentColor" strokeWidth="3" strokeLinecap="round" /></svg></span>
          <span className="ss-flavour-option-label">{flavour.shortName}</span>
          {!compact && <span className="ss-flavour-check">{selected === flavour.id && <Check size={14} strokeWidth={2} />}</span>}
        </button>
      ))}
    </div>
  );
}
