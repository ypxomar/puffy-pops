import type { Metadata } from "next";
import SoftServeLanding from "./soft-serve/SoftServeLanding";

export const metadata: Metadata = {
  title: "Puffy Pops | Your New Soft Spot",
  description:
    "Meet your new soft spot. Discover Puffy Pops soft serve in Strawberry Kiss, Chocolate Crush, Pistachio Dream, and Vanilla Cloud. Find your swirl in Alexandria and Cairo.",
  openGraph: {
    title: "Puffy Pops | Your New Soft Spot",
    description:
      "A little swirl. A whole lot of joy. Say hello to the softer side of Puffy Pops.",
  },
};

export default function HomePage() {
  return <SoftServeLanding />;
}
