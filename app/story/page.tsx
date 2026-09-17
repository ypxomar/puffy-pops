"use client";

/* eslint-disable @next/next/no-img-element */

import { motion, useReducedMotion, useScroll, useSpring, useTransform } from "motion/react";
import { useRef } from "react";
import ScrollProgress from "../components/ScrollProgress";
import SiteFooter from "../components/SiteFooter";
import SiteHeader from "../components/SiteHeader";

const premiumEase = [0.22, 1, 0.36, 1] as const;

export default function StoryPage() {
  const reduceMotion = useReducedMotion();
  const heroRef = useRef<HTMLElement>(null);
  const chapterRef = useRef<HTMLElement>(null);
  const { scrollYProgress: heroProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroScale = useSpring(useTransform(heroProgress, [0, 1], [1, 1.08]), { stiffness: 110, damping: 30, mass: 0.35 });
  const heroY = useSpring(useTransform(heroProgress, [0, 1], [0, 86]), { stiffness: 110, damping: 30, mass: 0.35 });
  const heroCopyOpacity = useTransform(heroProgress, [0, 0.72], [1, 0]);

  const { scrollYProgress: chapterProgress } = useScroll({ target: chapterRef, offset: ["start start", "end end"] });
  const frameScale = useTransform(chapterProgress, [0, 0.3, 0.76, 1], [0.82, 1, 1, 0.9]);
  const frameClip = useTransform(chapterProgress, [0, 0.3, 0.78, 1], ["inset(9% 12% round 52px)", "inset(0% round 42px)", "inset(0% round 42px)", "inset(9% 12% round 52px)"]);
  const firstOpacity = useTransform(chapterProgress, [0, 0.24, 0.37], [1, 1, 0]);
  const secondOpacity = useTransform(chapterProgress, [0.29, 0.43, 0.61, 0.72], [0, 1, 1, 0]);
  const thirdOpacity = useTransform(chapterProgress, [0.66, 0.8, 1], [0, 1, 1]);
  const firstY = useTransform(chapterProgress, [0, 0.37], [0, -32]);
  const secondY = useTransform(chapterProgress, [0.29, 0.5, 0.72], [30, 0, -28]);
  const thirdY = useTransform(chapterProgress, [0.66, 0.84], [30, 0]);

  return <main className="cinema-home cinema-story">
    <ScrollProgress />
    <SiteHeader />

    <section className="story-cinema-hero" ref={heroRef}>
      <motion.div className="story-cinema-copy" style={reduceMotion ? undefined : { opacity: heroCopyOpacity }}>
        <p className="cinema-kicker">Born in Alexandria</p>
        <h1>Small bites.<br /><em>A whole mood.</em></h1>
        <p>Puffy Pops turns soft dough, generous fillings, and playful flavors into boxes made to pass around.</p>
      </motion.div>
      <motion.figure className="story-cinema-media">
        <motion.img src="/api/media?slot=story-main" alt="An assortment of Puffy Pops boxes" style={reduceMotion ? undefined : { scale: heroScale, y: heroY }} />
        <div className="story-cinema-shade" />
        <figcaption><span>The Puffy idea</span><strong>Opening the box<br />is part of the joy.</strong></figcaption>
      </motion.figure>
    </section>

    <section className="story-cinema-belief">
      <motion.p className="cinema-kicker" initial={reduceMotion ? false : { opacity: 0, x: -22 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, amount: 0.7 }} transition={{ duration: 0.65, ease: premiumEase }}>Why Puffy exists</motion.p>
      <motion.h2 initial={reduceMotion ? false : { opacity: 0, y: 46, clipPath: "inset(0 0 100% 0)" }} whileInView={{ opacity: 1, y: 0, clipPath: "inset(0)" }} viewport={{ once: true, amount: 0.4 }} transition={{ duration: 1, ease: premiumEase }}>Joy tastes better<br />when it’s <em>shared.</em></motion.h2>
      <motion.p initial={reduceMotion ? false : { opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true, amount: 0.8 }} transition={{ duration: 0.75, delay: 0.16 }}>The menu has grown beyond the original bite, but the idea stays simple: make every sweet moment feel playful, generous, and unmistakably Puffy.</motion.p>
    </section>

    <section className="story-cinema-chapter" ref={chapterRef} aria-label="The Puffy Pops story in three chapters">
      <div className="story-cinema-sticky">
        <div className="cinema-chapter-heading"><span>From one bite to two cities</span><strong>01—03</strong></div>
        <motion.div className="story-cinema-frame" style={reduceMotion ? undefined : { scale: frameScale, clipPath: frameClip }}>
          <img src="/api/media?slot=story-secondary" alt="Puffy Pops with a generous filling" loading="lazy" />
          <div />
        </motion.div>
        <div className="story-cinema-beats">
          <motion.article className="story-cinema-beat story-beat-one" style={reduceMotion ? undefined : { opacity: firstOpacity, y: firstY }}><span>01 · The original</span><h2>Soft dough.<br />Big personality.</h2><p>The original Puffy Pops made a small dessert feel like the whole occasion.</p></motion.article>
          <motion.article className="story-cinema-beat story-beat-two" style={reduceMotion ? undefined : { opacity: secondOpacity, y: secondY }}><span>02 · The menu</span><h2>More ways<br />to get Puffy.</h2><p>Cookies, brownies, matcha, coffee, fresh drinks, and boxes made to share.</p></motion.article>
          <motion.article className="story-cinema-beat story-beat-three" style={reduceMotion ? undefined : { opacity: thirdOpacity, y: thirdY }}><span>03 · The cities</span><h2>Alexandria roots.<br />Cairo energy.</h2><p>Each city keeps its supplied menu and pricing while the nearest branch handles the order.</p></motion.article>
        </div>
        <div className="cinema-chapter-progress" aria-hidden="true"><motion.i style={{ scaleX: chapterProgress }} /></div>
      </div>
    </section>

    <section className="story-cinema-values">
      <div className="cinema-section-heading"><div><p className="cinema-kicker">What makes it Puffy</p><h2>Three ideas.<br /><em>One feeling.</em></h2></div></div>
      <div className="story-value-grid">
        {[{ number: "01", title: "Playful", copy: "Color, texture, and flavors that never feel ordinary.", tone: "orange" }, { number: "02", title: "Shareable", copy: "Boxes made for friends, families, and sweet moments.", tone: "cream" }, { number: "03", title: "Local", copy: "Five branches, two city menus, and teams you can meet.", tone: "green" }].map((value, index) => <motion.article className={value.tone} key={value.title} initial={reduceMotion ? false : { opacity: 0, y: 36, scale: 0.97 }} whileInView={{ opacity: 1, y: 0, scale: 1 }} viewport={{ once: true, amount: 0.35 }} transition={{ duration: 0.75, delay: index * 0.08, ease: premiumEase }}><span>{value.number}</span><h3>{value.title}</h3><p>{value.copy}</p></motion.article>)}
      </div>
    </section>

    <section className="cinema-closing story-cinema-closing">
      <motion.div initial={reduceMotion ? false : { opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true, amount: 0.4 }} transition={{ duration: 0.9, ease: premiumEase }}><p className="cinema-kicker">Taste the story</p><h2>Pick your next<br /><em>favorite.</em></h2><div className="cinema-actions"><a href="/menu" className="cinema-button light">Explore the menu <span>↗</span></a><a href="/locations" className="cinema-button ghost">Find a branch <span>→</span></a></div></motion.div>
    </section>

    <SiteFooter />
  </main>;
}
