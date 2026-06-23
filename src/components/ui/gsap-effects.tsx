import { useRef, type ReactNode, type ElementType } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger, useGSAP);

/* ---------- GsapReveal: scroll-triggered reveal with stagger ---------- */

interface GsapRevealProps {
  children: ReactNode;
  className?: string;
  /** animation flavor */
  variant?: "up" | "scale" | "left" | "right" | "blur";
  /** stagger children that have the .gsap-child class */
  stagger?: boolean;
  delay?: number;
  as?: ElementType;
}

export function GsapReveal({
  children,
  className = "",
  variant = "up",
  stagger = false,
  delay = 0,
  as: Tag = "div",
}: GsapRevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!ref.current) return;

      const fromVars: gsap.TweenVars = { opacity: 0 };
      if (variant === "up") fromVars.y = 60;
      if (variant === "scale") fromVars.scale = 0.85;
      if (variant === "left") fromVars.x = -60;
      if (variant === "right") fromVars.x = 60;
      if (variant === "blur") fromVars.filter = "blur(14px)";

      const toVars: gsap.TweenVars = {
        opacity: 1,
        y: 0,
        x: 0,
        scale: 1,
        filter: "blur(0px)",
        duration: 1,
        delay,
        ease: "power3.out",
        scrollTrigger: {
          trigger: ref.current,
          start: "top 85%",
          once: true,
        },
      };

      if (stagger) {
        const kids = ref.current.querySelectorAll(".gsap-child");
        if (kids.length) {
          gsap.fromTo(kids, fromVars, { ...toVars, stagger: 0.12 });
          return;
        }
      }
      gsap.fromTo(ref.current, fromVars, toVars);
    },
    { scope: ref },
  );

  return (
    <Tag ref={ref} className={className}>
      {children}
    </Tag>
  );
}

/* ---------- GsapParallax: moves element on scroll ---------- */

export function GsapParallax({
  children,
  className = "",
  speed = 0.3,
}: {
  children: ReactNode;
  className?: string;
  speed?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!ref.current) return;
      gsap.to(ref.current, {
        yPercent: -speed * 100,
        ease: "none",
        scrollTrigger: {
          trigger: ref.current,
          start: "top bottom",
          end: "bottom top",
          scrub: true,
        },
      });
    },
    { scope: ref },
  );

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}

/* ---------- Animated colorful gradient mesh background ---------- */

export function GradientMesh({ className = "" }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!ref.current) return;
      const blobs = ref.current.querySelectorAll(".mesh-blob");
      blobs.forEach((blob, i) => {
        gsap.to(blob, {
          x: () => gsap.utils.random(-120, 120),
          y: () => gsap.utils.random(-120, 120),
          scale: () => gsap.utils.random(0.8, 1.3),
          duration: gsap.utils.random(8, 14),
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
          delay: i * 0.5,
        });
      });
    },
    { scope: ref },
  );

  return (
    <div ref={ref} aria-hidden className={`pointer-events-none absolute inset-0 -z-10 overflow-hidden ${className}`}>
      <div className="mesh-blob absolute left-[5%] top-[10%] h-[420px] w-[420px] rounded-full bg-primary/30 blur-[110px]" />
      <div className="mesh-blob absolute right-[8%] top-[20%] h-[380px] w-[380px] rounded-full bg-saffron/35 blur-[120px]" />
      <div className="mesh-blob absolute left-[35%] bottom-[5%] h-[400px] w-[400px] rounded-full bg-herb/25 blur-[130px]" />
      <div className="mesh-blob absolute right-[25%] bottom-[15%] h-[320px] w-[320px] rounded-full bg-berry/25 blur-[120px]" />
    </div>
  );
}
