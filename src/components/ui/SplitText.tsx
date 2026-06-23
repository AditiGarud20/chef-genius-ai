import { useRef, useEffect, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(ScrollTrigger, useGSAP);

interface SplitTextProps {
  text: string;
  className?: string;
  delay?: number;
  duration?: number;
  ease?: string;
  splitType?: string;
  from?: Record<string, unknown>;
  to?: Record<string, unknown>;
  threshold?: number;
  rootMargin?: string;
  textAlign?: string;
  tag?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span';
  onLetterAnimationComplete?: () => void;
}

/**
 * SplitText — animates text per character/word on scroll using plain GSAP.
 * Does NOT require the premium gsap/SplitText Club plugin: it splits the text
 * manually into <span> elements and animates them.
 */
const SplitText = ({
  text,
  className = '',
  delay = 50,
  duration = 1.25,
  ease = 'power3.out',
  splitType = 'chars',
  from = { opacity: 0, y: 40 },
  to = { opacity: 1, y: 0 },
  threshold = 0.1,
  rootMargin = '-100px',
  textAlign = 'center',
  tag = 'p',
  onLetterAnimationComplete,
}: SplitTextProps) => {
  const ref = useRef<HTMLElement>(null);
  const animationCompletedRef = useRef(false);
  const onCompleteRef = useRef(onLetterAnimationComplete);
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    onCompleteRef.current = onLetterAnimationComplete;
  }, [onLetterAnimationComplete]);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (document.fonts && document.fonts.status === 'loaded') {
      setFontsLoaded(true);
    } else if (document.fonts) {
      document.fonts.ready.then(() => setFontsLoaded(true));
    } else {
      setFontsLoaded(true);
    }
  }, []);

  useGSAP(
    () => {
      if (!ref.current || !text || !fontsLoaded) return;
      if (animationCompletedRef.current) return;

      const el = ref.current;
      const useWords = splitType.includes('words') && !splitType.includes('chars');

      // Build the split markup manually
      el.innerHTML = '';
      const targets: HTMLElement[] = [];

      const makeSpan = (content: string) => {
        const span = document.createElement('span');
        span.style.display = 'inline-block';
        span.style.willChange = 'transform, opacity';
        span.textContent = content;
        return span;
      };

      if (useWords) {
        const words = text.split(' ');
        words.forEach((word, idx) => {
          const span = makeSpan(word);
          el.appendChild(span);
          targets.push(span);
          if (idx < words.length - 1) {
            el.appendChild(document.createTextNode('\u00A0'));
          }
        });
      } else {
        // chars
        for (const ch of text) {
          const span = makeSpan(ch === ' ' ? '\u00A0' : ch);
          el.appendChild(span);
          targets.push(span);
        }
      }

      const startPct = (1 - threshold) * 100;
      const marginMatch = /^(-?\d+(?:\.\d+)?)(px|em|rem|%)?$/.exec(rootMargin);
      const marginValue = marginMatch ? parseFloat(marginMatch[1]) : 0;
      const marginUnit = marginMatch ? marginMatch[2] || 'px' : 'px';
      const sign =
        marginValue === 0 ? ''
          : marginValue < 0 ? `-=${Math.abs(marginValue)}${marginUnit}`
            : `+=${marginValue}${marginUnit}`;
      const start = `top ${startPct}%${sign}`;

      gsap.fromTo(
        targets,
        { ...from },
        {
          ...to,
          duration,
          ease,
          stagger: delay / 1000,
          scrollTrigger: {
            trigger: el,
            start,
            once: true,
            fastScrollEnd: true,
          },
          onComplete: () => {
            animationCompletedRef.current = true;
            onCompleteRef.current?.();
          },
          force3D: true,
        }
      );
    },
    {
      dependencies: [text, delay, duration, ease, splitType, JSON.stringify(from), JSON.stringify(to), threshold, rootMargin, fontsLoaded],
      scope: ref,
    }
  );

  const style: React.CSSProperties = {
    textAlign: textAlign as React.CSSProperties['textAlign'],
    overflow: 'hidden',
    display: 'inline-block',
    whiteSpace: 'normal',
    wordWrap: 'break-word',
    willChange: 'transform, opacity',
  };

  const Tag = (tag || 'p') as React.ElementType;

  return (
    <Tag ref={ref} style={style} className={`split-parent ${className}`}>
      {text}
    </Tag>
  );
};

export default SplitText;
