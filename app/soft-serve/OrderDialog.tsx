"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, Check, MapPin, MessageCircle, Minus, Plus, X } from "lucide-react";
import { SITE_LINKS, branches, flavours, whatsappHref } from "./landing-data";
import type { City, Flavour } from "./landing-data";
import { ProductImage } from "./Product";

export default function OrderDialog({ open, onClose, flavour, onFlavourChange }: { open: boolean; onClose: () => void; flavour: Flavour; onFlavourChange: (id: string) => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [city, setCity] = useState<City>("Alexandria");
  const [branchId, setBranchId] = useState(branches[0].id);
  const [quantity, setQuantity] = useState(1);
  const selectedBranch = branches.find((branch) => branch.id === branchId) || branches[0];
  const message = `Hi Puffy Pops! I'd love to order ${quantity} ${flavour.name} soft serve${quantity > 1 ? "s" : ""} for pickup at ${selectedBranch.name}, ${selectedBranch.city}. Could you confirm availability and pricing? Thank you!`;
  const whatsappUrl = whatsappHref(message);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previousOverflow; };
  }, [open]);

  const changeCity = (nextCity: City) => {
    setCity(nextCity);
    setBranchId((branches.find((branch) => branch.city === nextCity) || branches[0]).id);
  };

  return (
    <dialog ref={dialogRef} className="ss-order-dialog" aria-labelledby="order-title" onCancel={onClose} onClose={onClose} onClick={(event) => {
      if (event.target !== event.currentTarget) return;
      const bounds = event.currentTarget.getBoundingClientRect();
      if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) onClose();
    }}>
      <div className="ss-order-panel">
        <div className="ss-order-topline"><span className="ss-eyebrow">YOUR NEXT HAPPY MOMENT</span><button className="ss-icon-button" onClick={onClose} aria-label="Close order details" autoFocus><X size={23} /></button></div>
        <h2 id="order-title">A little joy,<br />coming right up.</h2>
        <p className="ss-order-intro">Pick your swirl and your Puffy place. Order this soft serve on the website, or send it straight to the branch on WhatsApp.</p>
        <div className="ss-order-product">
          <ProductImage flavour={flavour} decorative />
          <div className="ss-order-product-controls">
            <label htmlFor="order-flavour">YOUR SOFT SERVE</label>
            <select id="order-flavour" value={flavour.id} onChange={(event) => onFlavourChange(event.target.value)}>{flavours.map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}</select>
            <div className="ss-quantity-picker" role="group" aria-label="Quantity"><button type="button" aria-label="Decrease quantity" onClick={() => setQuantity((value) => Math.max(1, value - 1))} disabled={quantity === 1}><Minus size={16} /></button><output aria-live="polite" aria-label="Selected quantity">{quantity}</output><button type="button" aria-label="Increase quantity" onClick={() => setQuantity((value) => Math.min(12, value + 1))} disabled={quantity === 12}><Plus size={16} /></button></div>
          </div>
        </div>
        <fieldset className="ss-order-branches">
          <legend><MapPin size={17} /> Pick your Puffy place</legend>
          <div className="ss-city-tabs" role="group" aria-label="Choose a city for pickup">{(['Alexandria', 'Cairo'] as City[]).map((option) => <button type="button" key={option} className={city === option ? 'ss-is-active' : ''} aria-pressed={city === option} onClick={() => changeCity(option)}>{option}</button>)}</div>
          <div className="ss-order-branch-list">
            {branches.filter((branch) => branch.city === city).map((branch) => (
              <label className={`ss-order-branch ${branchId === branch.id ? 'ss-is-selected' : ''}`} key={branch.id}>
                <input type="radio" name="pickup-branch" value={branch.id} checked={branchId === branch.id} onChange={() => setBranchId(branch.id)} />
                <span><strong>{branch.name}</strong><small>{branch.address}</small></span><span className="ss-branch-radio" aria-hidden="true">{branchId === branch.id && <Check size={13} />}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <div className="ss-order-handoff">
          <a className="ss-button ss-button-primary" href={SITE_LINKS.menu}><MessageCircle size={18} /><span>Order {quantity} {flavour.name}{quantity > 1 ? "s" : ""} on the menu</span><ArrowUpRight size={18} /></a>
          <a className="ss-text-link ss-order-handoff-link" href={whatsappUrl} target="_blank" rel="noopener noreferrer"><span>Ask {selectedBranch.name} on WhatsApp</span><ArrowUpRight size={16} /></a>
          <p>Your branch will confirm availability and pricing.<br />Have an allergy? Please let our team know before ordering.</p>
        </div>
      </div>
    </dialog>
  );
}
