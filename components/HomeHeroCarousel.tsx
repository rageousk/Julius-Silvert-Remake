"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

type Slide = {
  id: string;
  image: string;
  title: string;
  subtitle: string;
  cta: string;
  href: string;
  theme: "light" | "dark";
};

const SLIDES: Slide[] = [
  {
    id: "spring",
    image:
      "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=2400&q=85",
    title: "Spring menus await",
    subtitle:
      "Fresh ingredients, specialty imports, and chef-driven staples to bring your spring menu to life.",
    cta: "Start ordering",
    href: "/whats-new",
    theme: "light",
  },
  {
    id: "carved",
    image:
      "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=2400&q=85",
    title: "All-natural. All flavor.",
    subtitle: "Premium beef cuts built for consistency, transparency, and center-of-the-plate performance.",
    cta: "Discover Carved Meat Co.",
    href: "/brands/carved-meat-co",
    theme: "dark",
  },
  {
    id: "delivery",
    image:
      "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=2400&q=85",
    title: "Philadelphia & beyond",
    subtitle: "Next-day delivery and a dedicated team supporting restaurants, hotels, and institutions since 1915.",
    cta: "Browse catalog",
    href: "/catalog/meat-poultry",
    theme: "dark",
  },
  {
    id: "exclusives",
    image:
      "https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=2400&q=85",
    title: "Silvert exclusives",
    subtitle: "Products and programs you won’t find anywhere else — curated for serious kitchens.",
    cta: "Shop exclusives",
    href: "/catalog/meat-poultry",
    theme: "dark",
  },
];

/** Auto-advance interval (ms). Capped at 8s per product request. */
const AUTO_MS = 8000;
const WHEEL_DEBOUNCE_MS = 480;
const SWIPE_PX = 56;

export function HomeHeroCarousel() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const n = SLIDES.length;

  const viewportRef = useRef<HTMLDivElement>(null);
  const lastWheelRef = useRef(0);
  const pointerStartX = useRef<number | null>(null);

  const go = useCallback(
    (dir: -1 | 1) => {
      setIndex((i) => (i + dir + n) % n);
    },
    [n]
  );

  const goTo = useCallback((i: number) => {
    setIndex(i);
  }, []);

  useEffect(() => {
    if (paused) return undefined;
    const t = setInterval(() => {
      setIndex((i) => (i + 1) % n);
    }, AUTO_MS);
    return () => clearInterval(t);
  }, [n, paused]);

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      const horizontal = Math.abs(e.deltaX) > Math.abs(e.deltaY);
      const intentX = horizontal ? e.deltaX : e.shiftKey ? e.deltaY : 0;
      if (intentX === 0) return;

      e.preventDefault();
      const now = Date.now();
      if (now - lastWheelRef.current < WHEEL_DEBOUNCE_MS) return;
      lastWheelRef.current = now;
      go(intentX > 0 ? 1 : -1);
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [go]);

  function onPointerDown(e: React.PointerEvent) {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    const t = e.target as HTMLElement;
    if (t.closest("a, button")) return;
    pointerStartX.current = e.clientX;
  }

  function onPointerUp(e: React.PointerEvent) {
    const start = pointerStartX.current;
    pointerStartX.current = null;
    if (start == null) return;
    const dx = e.clientX - start;
    if (dx > SWIPE_PX) go(-1);
    else if (dx < -SWIPE_PX) go(1);
  }

  return (
    <div
      className="home-hero-carousel"
      aria-roledescription="carousel"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div
        ref={viewportRef}
        className="home-hero-viewport"
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerCancel={() => {
          pointerStartX.current = null;
        }}
        role="region"
        aria-label="Featured highlights. Scroll horizontally or drag to change slide."
      >
        <div
          className="home-hero-track"
          style={{
            width: `${n * 100}%`,
            transform: `translate3d(-${(index * 100) / n}%, 0, 0)`,
          }}
        >
          {SLIDES.map((slide, i) => (
            <div
              key={slide.id}
              className={`home-hero-slide home-hero-slide--${slide.theme}`}
              style={{ width: `${100 / n}%` }}
              aria-hidden={i !== index}
            >
              <Image
                src={slide.image}
                alt=""
                fill
                className="home-hero-slide-img"
                sizes="(max-width: 1200px) 100vw, 1180px"
                priority={i === 0}
              />
              <div className="home-hero-slide-scrim" aria-hidden />
              <div className="home-hero-slide-inner">
                <h2 className="home-hero-slide-title">{slide.title}</h2>
                <p className="home-hero-slide-sub">{slide.subtitle}</p>
                <Link
                  href={slide.href}
                  className="home-hero-slide-cta"
                  tabIndex={i === index ? undefined : -1}
                >
                  {slide.cta}
                </Link>
              </div>
            </div>
          ))}
        </div>

        <div className="home-hero-controls">
          <button
            type="button"
            className="home-hero-arrow"
            onClick={() => go(-1)}
            aria-label="Previous slide"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <div className="home-hero-dots" role="tablist" aria-label="Hero slides">
            {SLIDES.map((s, i) => (
              <button
                key={s.id}
                type="button"
                role="tab"
                aria-selected={i === index}
                aria-label={`Slide ${i + 1}: ${s.title}`}
                className={`home-hero-dot${i === index ? " home-hero-dot--active" : ""}`}
                onClick={() => goTo(i)}
              />
            ))}
          </div>
          <button
            type="button"
            className="home-hero-arrow"
            onClick={() => go(1)}
            aria-label="Next slide"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
