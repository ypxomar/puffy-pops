"use client";

/* eslint-disable @next/next/no-img-element -- The isolated soft-serve art is a runtime canvas data URL. */

import { useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import type { Flavour } from "./landing-data";

const imageCache = new Map<string, Promise<string>>();
const resolvedImages = new Map<string, string>();

function isolateProduct(src: string): Promise<string> {
  const cached = imageCache.get(src);
  if (cached) return cached;

  const result = new Promise<string>((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      try {
        const ratio = Math.min(1, 1100 / image.naturalHeight);
        const width = Math.round(image.naturalWidth * ratio);
        const height = Math.round(image.naturalHeight * ratio);
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext("2d", { willReadFrequently: true });
        if (!context) throw new Error("Canvas is not available");
        context.drawImage(image, 0, 0, width, height);
        const imageData = context.getImageData(0, 0, width, height);
        const pixels = imageData.data;
        const count = width * height;
        const background = new Uint8Array(count);
        const queue = new Int32Array(count);
        let head = 0;
        let tail = 0;

        // Only remove edge-connected black, preserving the dark sauce and cup logo.
        const visit = (index: number) => {
          if (background[index]) return;
          const p = index * 4;
          if (Math.max(pixels[p], pixels[p + 1], pixels[p + 2]) > 54) return;
          background[index] = 1;
          queue[tail++] = index;
        };
        for (let x = 0; x < width; x++) {
          visit(x);
          visit((height - 1) * width + x);
        }
        for (let y = 0; y < height; y++) {
          visit(y * width);
          visit(y * width + width - 1);
        }
        while (head < tail) {
          const index = queue[head++];
          const x = index % width;
          if (x > 0) visit(index - 1);
          if (x < width - 1) visit(index + 1);
          if (index >= width) visit(index - width);
          if (index < count - width) visit(index + width);
        }

        let minX = width;
        let minY = height;
        let maxX = 0;
        let maxY = 0;
        for (let index = 0; index < count; index++) {
          const p = index * 4;
          if (background[index]) {
            pixels[p + 3] = 0;
            continue;
          }
          const x = index % width;
          const y = Math.floor(index / width);
          minX = Math.min(minX, x);
          minY = Math.min(minY, y);
          maxX = Math.max(maxX, x);
          maxY = Math.max(maxY, y);
          const touchesBackground =
            (x > 0 && background[index - 1]) ||
            (x < width - 1 && background[index + 1]) ||
            (index >= width && background[index - width]) ||
            (index < count - width && background[index + width]);
          if (touchesBackground) {
            const brightness = Math.max(pixels[p], pixels[p + 1], pixels[p + 2]);
            const alpha = Math.min(1, Math.max(0.1, (brightness - 40) / 85));
            pixels[p + 3] = Math.round(255 * alpha);
            if (alpha < 1) {
              pixels[p] = Math.min(255, pixels[p] / alpha);
              pixels[p + 1] = Math.min(255, pixels[p + 1] / alpha);
              pixels[p + 2] = Math.min(255, pixels[p + 2] / alpha);
            }
          }
        }

        context.putImageData(imageData, 0, 0);
        const output = document.createElement("canvas");
        output.width = 800;
        output.height = 1000;
        const outputContext = output.getContext("2d");
        if (!outputContext || maxX <= minX || maxY <= minY) throw new Error("Unable to isolate the product");
        const cropWidth = maxX - minX + 1;
        const cropHeight = maxY - minY + 1;
        const fit = Math.min(720 / cropWidth, 930 / cropHeight);
        const targetWidth = cropWidth * fit;
        const targetHeight = cropHeight * fit;
        outputContext.drawImage(canvas, minX, minY, cropWidth, cropHeight, (800 - targetWidth) / 2, (1000 - targetHeight) / 2, targetWidth, targetHeight);
        const url = output.toDataURL("image/png");
        resolvedImages.set(src, url);
        resolve(url);
      } catch (error) {
        reject(error);
      }
    };
    image.onerror = () => reject(new Error(`Unable to load product image: ${src}`));
    image.src = src;
  });
  imageCache.set(src, result);
  return result;
}

export function preloadProducts(list: Flavour[]) {
  list.forEach((flavour) => { void isolateProduct(flavour.image).catch(() => undefined); });
}

function ProductFallback({ colour }: { colour: string }) {
  const gradientId = useId();
  return (
    <svg viewBox="0 0 400 500" className="ss-product-fallback" aria-hidden="true">
      <defs><linearGradient id={gradientId} x1="0" x2="1"><stop stopColor="#e4d1b3" /><stop offset=".5" stopColor="#fff9e9" /><stop offset="1" stopColor="#e8d8bd" /></linearGradient></defs>
      <g fill={`url(#${gradientId})`}>
        <path d="M105 296C47 259 113 231 128 230C91 199 148 172 158 172C132 144 177 120 181 104C188 84 185 65 198 53C192 89 235 106 225 142C269 156 264 187 246 195C293 202 313 241 281 261C325 274 295 310 270 313Z" />
        <path d="M73 292Q200 278 327 292L302 441Q200 480 99 441Z" /><ellipse cx="200" cy="295" rx="129" ry="17" />
      </g>
      <g fill="none" stroke={colour} strokeWidth="12" strokeLinecap="round"><path d="M198 79C188 126 245 138 195 177S257 213 242 254" /><path d="M145 190C107 223 170 230 140 273" /></g>
      <text x="200" y="382" textAnchor="middle" fill="#ad392b" fontFamily="Georgia, serif" fontStyle="italic" fontWeight="bold" fontSize="39">Puffy Pops</text>
      <path d="M132 397Q203 412 272 395" stroke="#ad392b" strokeWidth="4" fill="none" />
    </svg>
  );
}

export function ProductImage({ flavour, className = "", decorative = false }: { flavour: Flavour; className?: string; decorative?: boolean }) {
  const [src, setSrc] = useState<string | undefined>(resolvedImages.get(flavour.image));
  useEffect(() => {
    let active = true;
    // Pick up a product image the preload already isolated after hydration.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSrc(resolvedImages.get(flavour.image));
    void isolateProduct(flavour.image).then((url) => { if (active) setSrc(url); }).catch(() => undefined);
    return () => { active = false; };
  }, [flavour.image]);
  return (
    <div className={`ss-product-image ${className}`} role={decorative ? undefined : "img"} aria-label={decorative ? undefined : `${flavour.name} soft serve in a Puffy Pops cup`} aria-hidden={decorative || undefined}>
      {src ? <img src={src} alt="" draggable={false} /> : <ProductFallback colour={flavour.swatch} />}
    </div>
  );
}

export function ProductDisplay({ flavour }: { flavour: Flavour }) {
  return (
    <div className="ss-product-display">
      <AnimatePresence initial={false}>
        <motion.div key={flavour.id} className="ss-product-variant" initial={{ opacity: 0, rotate: 5, scale: 0.96 }} animate={{ opacity: 1, rotate: 0, scale: 1 }} exit={{ opacity: 0, rotate: -5, scale: 0.96 }} transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}>
          <ProductImage flavour={flavour} />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export function LocalProduct({ flavour, className = "" }: { flavour: Flavour; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const rotate = useTransform(scrollYProgress, [0, 1], [-8, 8]);
  return (
    <div ref={ref} className={`ss-local-product ${className}`}><motion.div className="ss-local-product-inner" style={{ rotate: reduceMotion ? 0 : rotate }}><ProductDisplay flavour={flavour} /></motion.div></div>
  );
}
