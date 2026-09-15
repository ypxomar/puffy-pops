"use client";

import { useEffect, useState } from "react";
import { branches as fallbackBranches, type Branch } from "../catalog";
import { BRANCH_KEY } from "../cart";
import SiteFooter from "../components/SiteFooter";
import SiteHeader from "../components/SiteHeader";
import { distanceKm, nearestBranch } from "../location";

type PublicBranch = Branch & { manager: string; employeeCount: number };

export default function LocationsPage() {
  const [branches, setBranches] = useState<PublicBranch[]>(fallbackBranches.map((branch) => ({ ...branch, manager: "Manager Placeholder", employeeCount: 0 })));
  const [selectedId, setSelectedId] = useState("kafr-abdo");
  const [message, setMessage] = useState("Choose a branch or let us find the nearest one.");
  const [locating, setLocating] = useState(false);
  useEffect(() => {
    const saved = window.localStorage.getItem(BRANCH_KEY);
    // Restore the customer's device-local branch after hydration.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (saved) setSelectedId(saved);
    fetch("/api/branches", { cache: "no-store" }).then(async (response) => await response.json() as { branches?: PublicBranch[] }).then((data) => { if (data.branches?.length) setBranches(data.branches); }).catch(() => undefined);
  }, []);
  const select = (branch: PublicBranch) => { setSelectedId(branch.id); window.localStorage.setItem(BRANCH_KEY, branch.id); setMessage(`${branch.name} selected. Its local menu will open when you order.`); };
  const locate = () => {
    if (!navigator.geolocation) return setMessage("Location is unavailable in this browser.");
    setLocating(true);
    navigator.geolocation.getCurrentPosition((position) => {
      const point = { latitude: position.coords.latitude, longitude: position.coords.longitude };
      const nearest = nearestBranch(point);
      const branch = branches.find((entry) => entry.id === nearest.id) ?? branches[0];
      select(branch); setMessage(`${branch.name} is about ${distanceKm(point, branch).toFixed(1)} km from you.`); setLocating(false);
    }, () => { setMessage("We could not read your location. Choose a branch below."); setLocating(false); }, { enableHighAccuracy: true, timeout: 10000 });
  };
  return <main><SiteHeader /><section className="subpage-hero locations-hero"><p className="eyebrow">Good vibes nearby</p><h1>Find your <em>Puffy place.</em></h1><p>Every branch has its own team, local menu, and counter. Pick one manually or use your location.</p><button type="button" onClick={locate} disabled={locating}>{locating ? "Finding you…" : "Use my location"}</button><span>{message}</span></section><section className="locations-page-list">{(["Alexandria", "Cairo"] as const).map((city, cityIndex) => <div className="location-city" key={city}><div className="city-label"><span>0{cityIndex + 1}</span><h2>{city}</h2><i /></div><div className={`location-grid ${city === "Cairo" ? "cairo-grid" : ""}`}>{branches.filter((branch) => branch.city === city).map((branch) => <article className={`location-card expanded ${selectedId === branch.id ? "selected" : ""}`} key={branch.id}><div className="location-pin" aria-hidden="true"><i /></div><div><small>{branch.city}</small><h3>{branch.name}</h3><p>{branch.address}</p><a href={`tel:${branch.phone}`}>{branch.phone}</a><div className="branch-manager"><span>Branch manager</span><strong>{branch.manager}</strong><small>{branch.employeeCount || 3} listed team members</small></div></div><button type="button" onClick={() => select(branch)}>{selectedId === branch.id ? "Selected" : "Choose branch"}</button><a href={branch.map} target="_blank" rel="noreferrer" aria-label={`Open ${branch.name} in Google Maps`}>Map ↗</a></article>)}</div></div>)}</section><section className="order-banner"><div><p className="eyebrow light">Found your branch?</p><h2>Let’s order something <em>puffy.</em></h2></div><a href="/menu">Open its menu <span>↗</span></a></section><SiteFooter /></main>;
}
