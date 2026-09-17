"use client";

import { useEffect } from "react";

/**
 * The router only applies the layout's metadata to the not-found route, so the
 * tab title is set here after hydration. The server-rendered markup keeps the
 * single <title> the layout provides.
 */
export default function NotFoundTitle() {
  useEffect(() => {
    document.title = "Page not found | Puffy Pops Egypt";
  }, []);
  return null;
}
