'use client';

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { CustomEase } from 'gsap/CustomEase';

// Register GSAP plugins
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger, CustomEase);

  // DEYA brand eases (shared design system)
  CustomEase.create('deyaSmooth', 'M0,0 C0.25,0.1 0.25,1 1,1');
  CustomEase.create('deyaSnap', 'M0,0 C0.5,0 0.2,1 1,1');
  CustomEase.create('deyaBounce', 'M0,0 C0.2,0 0.3,1.4 1,1');
  CustomEase.create('deyaElastic', 'M0,0 C0.25,0 0.3,1.2 0.5,1 0.7,0.95 0.85,1 1,1');

  // DP4-specific eases — slow, luxurious, premium motion
  CustomEase.create('dp4Luxe', 'M0,0 C0.15,0 0.1,1 1,1');       // Ultra-smooth deceleration for question transitions (1.0-1.2s)
  CustomEase.create('dp4Slide', 'M0,0 C0.4,0 0.2,1 1,1');        // Smooth horizontal slides (0.8s)
  CustomEase.create('dp4Reveal', 'M0,0 C0.05,0 0.15,1 1,1');     // Ultra-slow reveal for scores (1.5s)
  CustomEase.create('dp4Float', 'M0,0 C0.25,0.1 0.25,1 1,1');    // Floating background elements (2s+)
  CustomEase.create('dp4Breathe', 'M0,0 C0.4,0 0.6,1 1,1');      // Background breathing glow (8s cycles)

  // Global GSAP defaults — slower than DEYA for premium form feel
  gsap.defaults({
    ease: 'dp4Luxe',
    duration: 0.8,
  });
}

export { gsap, ScrollTrigger, CustomEase };
