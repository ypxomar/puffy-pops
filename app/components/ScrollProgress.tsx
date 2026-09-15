"use client";

import { motion, useReducedMotion, useScroll, useSpring } from "motion/react";

export default function ScrollProgress() {
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 170, damping: 30, mass: 0.25 });

  if (reduceMotion) return null;
  return <motion.div className="scroll-progress" style={{ scaleX }} aria-hidden="true" />;
}
