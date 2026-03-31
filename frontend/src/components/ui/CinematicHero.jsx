"use client";
import React, { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useNavigate } from "react-router-dom";
import "./CinematicHero.css";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const INJECTED_STYLES = `
  .gsap-reveal { visibility: hidden; }

  /* Environment Overlays */
  .film-grain {
      position: absolute; inset: 0; width: 100%; height: 100%;
      pointer-events: none; z-index: 50; opacity: 0.05; mix-blend-mode: overlay;
      background: url('data:image/svg+xml;utf8,<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><filter id="noiseFilter"><feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" stitchTiles="stitch"/></filter><rect width="100%" height="100%" filter="url(%23noiseFilter)"/></svg>');
  }

  .bg-grid-theme {
      background-size: 60px 60px;
      background-image: 
          linear-gradient(to right, color-mix(in srgb, var(--text-primary) 5%, transparent) 1px, transparent 1px),
          linear-gradient(to bottom, color-mix(in srgb, var(--text-primary) 5%, transparent) 1px, transparent 1px);
      mask-image: radial-gradient(ellipse at center, black 0%, transparent 70%);
      -webkit-mask-image: radial-gradient(ellipse at center, black 0%, transparent 70%);
  }

  /* PHYSICAL SKEUOMORPHIC MATERIALS */
  
  .text-3d-matte {
      color: var(--text-primary);
      text-shadow: 
          0 10px 30px color-mix(in srgb, var(--text-primary) 20%, transparent), 
          0 2px 4px color-mix(in srgb, var(--text-primary) 10%, transparent);
  }

  .text-silver-matte {
      background: linear-gradient(180deg, var(--text-primary) 0%, color-mix(in srgb, var(--text-primary) 40%, transparent) 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      transform: translateZ(0); 
      filter: 
          drop-shadow(0px 10px 20px color-mix(in srgb, var(--text-primary) 15%, transparent)) 
          drop-shadow(0px 2px 4px color-mix(in srgb, var(--text-primary) 10%, transparent));
  }

  .text-card-silver-matte {
      background: linear-gradient(180deg, #FFFFFF 0%, #A1A1AA 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      transform: translateZ(0);
      filter: 
          drop-shadow(0px 12px 24px rgba(0,0,0,0.8)) 
          drop-shadow(0px 4px 8px rgba(0,0,0,0.6));
  }

  .premium-depth-card {
      background: linear-gradient(145deg, #1A284A 0%, #0A101D 100%);
      box-shadow: 
          0 40px 100px -20px rgba(0, 0, 0, 0.9),
          0 20px 40px -20px rgba(0, 0, 0, 0.8),
          inset 0 1px 2px rgba(255, 255, 255, 0.2),
          inset 0 -2px 4px rgba(0, 0, 0, 0.8);
      border: 1px solid rgba(255, 255, 255, 0.04);
      position: relative;
  }

  .card-sheen {
      position: absolute; inset: 0; border-radius: inherit; pointer-events: none; z-index: 50;
      background: radial-gradient(800px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(255,255,255,0.06) 0%, transparent 40%);
      mix-blend-mode: screen; transition: opacity 0.3s ease;
  }

  .iphone-bezel {
      background-color: #111;
      box-shadow: 
          inset 0 0 0 2px #52525B, 
          inset 0 0 0 7px #000, 
          0 40px 80px -15px rgba(0,0,0,0.9),
          0 15px 25px -5px rgba(0,0,0,0.7);
      transform-style: preserve-3d;
  }

  .hardware-btn {
      background: linear-gradient(90deg, #404040 0%, #171717 100%);
      box-shadow: 
          -2px 0 5px rgba(0,0,0,0.8),
          inset -1px 0 1px rgba(255,255,255,0.15),
          inset 1px 0 2px rgba(0,0,0,0.8);
      border-left: 1px solid rgba(255,255,255,0.05);
  }
  
  .screen-glare {
      background: linear-gradient(110deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0) 45%);
  }

  .widget-depth {
      background: linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%);
      box-shadow: 
          0 10px 20px rgba(0,0,0,0.3),
          inset 0 1px 1px rgba(255,255,255,0.05),
          inset 0 -1px 1px rgba(0,0,0,0.5);
      border: 1px solid rgba(255,255,255,0.03);
  }

  .floating-ui-badge {
      background: linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.01) 100%);
      backdrop-filter: blur(24px); 
      -webkit-backdrop-filter: blur(24px);
      box-shadow: 
          0 0 0 1px rgba(255, 255, 255, 0.1),
          0 25px 50px -12px rgba(0, 0, 0, 0.8),
          inset 0 1px 1px rgba(255,255,255,0.2),
          inset 0 -1px 1px rgba(0,0,0,0.5);
  }

  .btn-modern-light, .btn-modern-dark {
      transition: all 0.4s cubic-bezier(0.25, 1, 0.5, 1);
      cursor: pointer;
  }
  .btn-modern-light {
      background: linear-gradient(180deg, #FFFFFF 0%, #F1F5F9 100%);
      color: #0F172A;
      box-shadow: 0 0 0 1px rgba(0,0,0,0.05), 0 2px 4px rgba(0,0,0,0.1), 0 12px 24px -4px rgba(0,0,0,0.3), inset 0 1px 1px rgba(255,255,255,1), inset 0 -3px 6px rgba(0,0,0,0.06);
  }
  .btn-modern-light:hover {
      transform: translateY(-3px);
      box-shadow: 0 0 0 1px rgba(0,0,0,0.05), 0 6px 12px -2px rgba(0,0,0,0.15), 0 20px 32px -6px rgba(0,0,0,0.4), inset 0 1px 1px rgba(255,255,255,1), inset 0 -3px 6px rgba(0,0,0,0.06);
  }
  .btn-modern-light:active {
      transform: translateY(1px);
      background: linear-gradient(180deg, #F1F5F9 0%, #E2E8F0 100%);
      box-shadow: 0 0 0 1px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.1), inset 0 3px 6px rgba(0,0,0,0.1), inset 0 0 0 1px rgba(0,0,0,0.02);
  }
  .btn-modern-dark {
      background: linear-gradient(180deg, #3086FF 0%, #1753B2 100%);
      color: #FFFFFF;
      box-shadow: 0 0 0 1px rgba(255,255,255,0.1), 0 2px 4px rgba(0,0,0,0.6), 0 12px 24px -4px rgba(0,0,0,0.9), inset 0 1px 1px rgba(255,255,255,0.15), inset 0 -3px 6px rgba(0,0,0,0.8);
      border: none;
  }
  .btn-modern-dark:hover {
      transform: translateY(-3px);
      background: linear-gradient(180deg, #4da4ff 0%, #206AE0 100%);
      box-shadow: 0 0 0 1px rgba(255,255,255,0.15), 0 6px 12px -2px rgba(0,0,0,0.7), 0 20px 32px -6px rgba(0,0,0,1), inset 0 1px 1px rgba(255,255,255,0.2), inset 0 -3px 6px rgba(0,0,0,0.8);
  }
  .btn-modern-dark:active {
      transform: translateY(1px);
      background: #1753B2;
      box-shadow: 0 0 0 1px rgba(255,255,255,0.05), inset 0 3px 8px rgba(0,0,0,0.9), inset 0 0 0 1px rgba(0,0,0,0.5);
  }

  .progress-ring {
      transform: rotate(-90deg);
      transform-origin: center;
      stroke-dasharray: 402;
      stroke-dashoffset: 402;
      stroke-linecap: round;
  }

  .will-change-transform {
      will-change: transform;
  }
  .transform-style-3d {
      transform-style: preserve-3d;
  }
`;

export function CinematicHero({ 
  brandName = "FitPulse",
  tagline1 = "Track the gains,",
  tagline2 = "not just the scale.",
  cardHeading = "Fitness, redefined.",
  cardDescription = <><span className="ch-text-white ch-font-semibold">FitPulse</span> empowers members and trainers with structured accountability, precise progress tracking, and beautiful visual metrics.</>,
  metricValue = 120,
  metricLabel = "Workouts Logged",
  ctaHeading = "Start your journey.",
  ctaDescription = "Join thousands of others in the gym and take control of your fitness timeline today.",
  className 
}) {
  const navigate = useNavigate();
  const containerRef = useRef(null);
  const mainCardRef = useRef(null);
  const mockupRef = useRef(null);
  const requestRef = useRef(0);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (window.scrollY > window.innerHeight * 2) return;

      cancelAnimationFrame(requestRef.current);
      
      requestRef.current = requestAnimationFrame(() => {
        if (mainCardRef.current && mockupRef.current) {
          const rect = mainCardRef.current.getBoundingClientRect();
          const mouseX = e.clientX - rect.left;
          const mouseY = e.clientY - rect.top;
          
          mainCardRef.current.style.setProperty("--mouse-x", `${mouseX}px`);
          mainCardRef.current.style.setProperty("--mouse-y", `${mouseY}px`);

          const xVal = (e.clientX / window.innerWidth - 0.5) * 2;
          const yVal = (e.clientY / window.innerHeight - 0.5) * 2;

          gsap.to(mockupRef.current, {
            rotationY: xVal * 12,
            rotationX: -yVal * 12,
            ease: "power3.out",
            duration: 1.2,
          });
        }
      });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(requestRef.current);
    };
  }, []);

  useEffect(() => {
    const isMobile = window.innerWidth < 768;

    const ctx = gsap.context(() => {
      gsap.set(".text-track", { autoAlpha: 0, y: 60, scale: 0.85, filter: "blur(20px)", rotationX: -20 });
      gsap.set(".text-days", { autoAlpha: 1, clipPath: "inset(0 100% 0 0)" });
      gsap.set(".main-card", { y: window.innerHeight + 200, autoAlpha: 1 });
      gsap.set([".card-left-text", ".card-right-text", ".mockup-scroll-wrapper", ".floating-badge", ".phone-widget"], { autoAlpha: 0 });
      gsap.set(".cta-wrapper", { autoAlpha: 0, scale: 0.8, filter: "blur(30px)" });

      const introTl = gsap.timeline({ delay: 0.3 });
      introTl
        .to(".text-track", { duration: 1.8, autoAlpha: 1, y: 0, scale: 1, filter: "blur(0px)", rotationX: 0, ease: "expo.out" })
        .to(".text-days", { duration: 1.4, clipPath: "inset(0 0% 0 0)", ease: "power4.inOut" }, "-=1.0");

      const scrollTl = gsap.timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top top",
          end: "+=5000", /* reduced slightly for better UX pacing */
          pin: true,
          scrub: 1,
          anticipatePin: 1,
        },
      });

      scrollTl
        .to([".hero-text-wrapper", ".bg-grid-theme"], { scale: 1.15, filter: "blur(20px)", opacity: 0.2, ease: "power2.inOut", duration: 2 }, 0)
        .to(".main-card", { y: 0, ease: "power3.inOut", duration: 2 }, 0)
        .to(".main-card", { width: "100%", height: "100%", borderRadius: "0px", ease: "power3.inOut", duration: 1.5 })
        .fromTo(".mockup-scroll-wrapper",
          { y: 300, z: -500, rotationX: 50, rotationY: -30, autoAlpha: 0, scale: 0.6 },
          { y: 0, z: 0, rotationX: 0, rotationY: 0, autoAlpha: 1, scale: 1, ease: "expo.out", duration: 2.5 }, "-=0.8"
        )
        .fromTo(".phone-widget", { y: 40, autoAlpha: 0, scale: 0.95 }, { y: 0, autoAlpha: 1, scale: 1, stagger: 0.15, ease: "back.out(1.2)", duration: 1.5 }, "-=1.5")
        .to(".progress-ring", { strokeDashoffset: 60, duration: 2, ease: "power3.inOut" }, "-=1.2")
        .to(".counter-val", { innerHTML: metricValue, snap: { innerHTML: 1 }, duration: 2, ease: "expo.out" }, "-=2.0")
        .fromTo(".floating-badge", { y: 100, autoAlpha: 0, scale: 0.7, rotationZ: -10 }, { y: 0, autoAlpha: 1, scale: 1, rotationZ: 0, ease: "back.out(1.5)", duration: 1.5, stagger: 0.2 }, "-=2.0")
        .fromTo(".card-left-text", { x: -50, autoAlpha: 0 }, { x: 0, autoAlpha: 1, ease: "power4.out", duration: 1.5 }, "-=1.5")
        .fromTo(".card-right-text", { x: 50, autoAlpha: 0, scale: 0.8 }, { x: 0, autoAlpha: 1, scale: 1, ease: "expo.out", duration: 1.5 }, "<")
        .to({}, { duration: 2.5 })
        .set(".hero-text-wrapper", { autoAlpha: 0 })
        .set(".cta-wrapper", { autoAlpha: 1 }) 
        .to({}, { duration: 1.5 })
        .to([".mockup-scroll-wrapper", ".floating-badge", ".card-left-text", ".card-right-text"], {
          scale: 0.9, y: -40, z: -200, autoAlpha: 0, ease: "power3.in", duration: 1.2, stagger: 0.05,
        })
        .to(".main-card", { 
          width: isMobile ? "92vw" : "85vw", 
          height: isMobile ? "92vh" : "85vh", 
          borderRadius: isMobile ? "32px" : "40px", 
          ease: "expo.inOut", 
          duration: 1.8 
        }, "pullback") 
        .to(".cta-wrapper", { scale: 1, filter: "blur(0px)", ease: "expo.inOut", duration: 1.8 }, "pullback")
        .to(".main-card", { y: -window.innerHeight - 300, ease: "power3.in", duration: 1.5 });

    }, containerRef);

    return () => ctx.revert();
  }, [metricValue]); 

  return (
    <div
      ref={containerRef}
      className={`ch-container ${className || ""}`}
    >
      <style dangerouslySetInnerHTML={{ __html: INJECTED_STYLES }} />
      <div className="film-grain" aria-hidden="true" />
      <div className="bg-grid-theme ch-absolute-inset ch-z-0 ch-pointer-none ch-opacity-50" aria-hidden="true" />

      {/* BACKGROUND LAYER: Hero Texts */}
      <div className="hero-text-wrapper ch-absolute-inset ch-z-10 ch-flex ch-flex-col ch-items-center ch-justify-center ch-text-center ch-w-screen ch-px-4 will-change-transform transform-style-3d ch-pointer-none">
        <h1 className="text-track gsap-reveal text-3d-matte ch-text-5xl ch-md-text-7xl ch-lg-text-6rem ch-font-bold ch-tracking-tight ch-mb-2">
          {tagline1}
        </h1>
        <h1 className="text-days gsap-reveal text-silver-matte ch-text-5xl ch-md-text-7xl ch-lg-text-6rem ch-font-extrabold ch-tracking-tighter">
          {tagline2}
        </h1>
      </div>

      {/* BACKGROUND LAYER 2: Tactile CTA Buttons */}
      <div className="cta-wrapper ch-absolute-inset ch-z-10 ch-flex ch-flex-col ch-items-center ch-justify-center ch-text-center ch-w-screen ch-px-4 gsap-reveal ch-pointer-auto will-change-transform">
        <h2 className="ch-text-4xl ch-md-text-6xl ch-lg-text-7xl ch-font-bold ch-mb-6 ch-tracking-tight text-silver-matte">
          {ctaHeading}
        </h2>
        <p className="ch-text-muted-foreground ch-text-lg ch-md-text-xl ch-mb-12 ch-max-w-xl ch-mx-auto ch-font-light ch-leading-relaxed">
          {ctaDescription}
        </p>
        <div className="ch-flex ch-flex-col ch-md-flex-row ch-gap-6">
          <button onClick={() => navigate("/login")} className="btn-modern-dark ch-flex ch-items-center ch-justify-center ch-gap-3 ch-px-4 ch-py-4 ch-rounded-xl ch-font-bold">
            <svg className="ch-w-8 ch-h-8" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
            </svg>
            <div className="ch-text-left">
              <div className="ch-text-10px ch-text-blue-100 ch-uppercase ch-tracking-widest ch-mb-1">Access the portal</div>
              <div className="ch-text-xl ch-leading-none ch-tracking-tight ch-text-white">Sign In</div>
            </div>
          </button>
        </div>
      </div>

      {/* FOREGROUND LAYER: The Physical Card */}
      <div className="ch-absolute-inset ch-z-20 ch-flex ch-items-center ch-justify-center ch-pointer-none">
        <div
          ref={mainCardRef}
          className="main-card premium-depth-card ch-overflow-hidden gsap-reveal ch-flex ch-items-center ch-justify-center ch-pointer-auto ch-w-92vw ch-h-92vh ch-rounded-32px ch-md-w-85vw ch-md-h-85vh ch-md-rounded-40px"
        >
          <div className="card-sheen" aria-hidden="true" />

          {/* DYNAMIC RESPONSIVE GRID */}
          <div className="ch-absolute-inset ch-max-w-7xl ch-mx-auto ch-px-4 ch-lg-px-12 ch-flex ch-flex-col ch-justify-evenly ch-lg-grid ch-lg-grid-cols-3 ch-items-center ch-gap-8 ch-z-10 ch-py-6 ch-lg-py-0">
            
            {/* 1. TOP / RIGHT: BRAND NAME */}
            <div className="card-right-text gsap-reveal ch-order-1 ch-order-lg-3 ch-flex ch-justify-center ch-lg-justify-end ch-z-20 ch-w-full">
              <h2 className="ch-text-6xl ch-md-text-6rem ch-lg-text-8rem ch-font-black ch-uppercase ch-tracking-tighter text-card-silver-matte">
                {brandName}
              </h2>
            </div>

            {/* 2. MIDDLE: IPHONE MOCKUP */}
            <div className="mockup-scroll-wrapper ch-order-2 ch-order-lg-2 ch-w-full ch-flex ch-items-center ch-justify-center ch-z-10" style={{ perspective: "1000px" }}>
              
              <div className="ch-w-full ch-h-full ch-flex ch-items-center ch-justify-center ch-scale-wrapper">
                {/* iPhone Bezel */}
                <div
                  ref={mockupRef}
                  className="iphone-bezel ch-w-full ch-max-w-sm ch-h-full ch-flex ch-flex-col will-change-transform transform-style-3d" style={{ width: "280px", height: "580px", borderRadius: "3rem", position: "relative" }}
                >
                  {/* Hardware Buttons */}
                  <div className="hardware-btn ch-rounded-md ch-z-0" style={{ position: "absolute", top: "120px", left: "-3px", width: "3px", height: "25px" }} />
                  <div className="hardware-btn ch-rounded-md ch-z-0" style={{ position: "absolute", top: "160px", left: "-3px", width: "3px", height: "45px" }} />
                  <div className="hardware-btn ch-rounded-md ch-z-0" style={{ position: "absolute", top: "220px", left: "-3px", width: "3px", height: "45px" }} />
                  <div className="hardware-btn ch-rounded-md ch-z-0" style={{ position: "absolute", top: "170px", right: "-3px", width: "3px", height: "70px", transform: "scaleX(-1)" }} />

                  {/* Inside Screen */}
                  <div className="ch-bg-screen ch-text-white ch-z-10 ch-overflow-hidden" style={{ position: "absolute", inset: "7px", borderRadius: "2.5rem", boxShadow: "inset 0 0 15px rgba(0,0,0,1)" }}>
                    <div className="screen-glare ch-absolute-inset ch-z-40 ch-pointer-none" />

                    {/* Dynamic Island */}
                    <div className="ch-bg-black ch-rounded-full ch-z-50 ch-flex ch-items-center ch-justify-end ch-px-4" style={{ position: "absolute", top: "5px", left: "50%", transform: "translateX(-50%)", width: "100px", height: "28px", boxShadow: "inset 0 -1px 2px rgba(255,255,255,0.1)" }}>
                      <div className="ch-bg-green-500 ch-rounded-full" style={{ width: "6px", height: "6px", boxShadow: "0 0 8px rgba(34,197,94,0.8)" }} />
                    </div>

                    {/* App Interface */}
                    <div className="ch-w-full ch-h-full ch-pt-12 ch-px-5 ch-pb-8 ch-flex ch-flex-col" style={{ position: "relative" }}>
                      <div className="phone-widget ch-flex ch-justify-between ch-items-center ch-mb-8">
                        <div className="ch-flex ch-flex-col">
                          <span className="ch-text-10px ch-text-neutral-400 ch-uppercase ch-tracking-widest ch-font-bold ch-mb-1">Today</span>
                          <span className="ch-text-xl ch-font-bold ch-tracking-tight ch-text-white ch-drop-shadow-md">Journey</span>
                        </div>
                        <div className="ch-w-9 ch-h-9 ch-rounded-full ch-bg-white-5 ch-text-neutral-200 ch-flex ch-items-center ch-justify-center ch-font-bold ch-text-sm ch-border ch-border-white-10 ch-shadow-lg">JS</div>
                      </div>

                      <div className="phone-widget ch-w-44 ch-h-44 ch-mx-auto ch-flex ch-items-center ch-justify-center ch-mb-8 ch-drop-shadow-lg" style={{ position: "relative" }}>
                        <svg className="ch-absolute-inset ch-w-full ch-h-full">
                          <circle cx="88" cy="88" r="64" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="12" />
                          <circle className="progress-ring" cx="88" cy="88" r="64" fill="none" stroke="#3B82F6" strokeWidth="12" />
                        </svg>
                        <div className="ch-text-center ch-z-10 ch-flex ch-flex-col ch-items-center">
                          <span className="counter-val ch-text-4xl ch-font-extrabold ch-tracking-tighter ch-text-white">0</span>
                          <span className="ch-text-xs-force ch-text-blue-200 ch-uppercase ch-tracking-widest ch-font-bold ch-mt-0_5">{metricLabel}</span>
                        </div>
                      </div>

                      <div className="ch-flex ch-flex-col ch-gap-3">
                        <div className="phone-widget widget-depth ch-rounded-2xl ch-p-4 ch-flex ch-items-center ch-gap-3">
                          <div className="ch-w-10 ch-h-10 ch-rounded-xl ch-bg-grad-blue ch-flex ch-items-center ch-justify-center ch-border ch-border-blue-400-20 ch-shadow-inner">
                            <span className="ch-text-blue-100">🔥</span>
                          </div>
                          <div>
                            <div className="ch-h-1_5 ch-w-20 ch-bg-neutral-300 ch-rounded-full ch-mb-2 ch-shadow-inner" />
                            <div className="ch-h-1_5 ch-w-12 ch-bg-neutral-600 ch-rounded-full ch-shadow-inner" />
                          </div>
                        </div>
                        <div className="phone-widget widget-depth ch-rounded-2xl ch-p-4 ch-flex ch-items-center ch-gap-3">
                          <div className="ch-w-10 ch-h-10 ch-rounded-xl ch-bg-grad-emerald ch-flex ch-items-center ch-justify-center ch-border ch-border-emerald-400-20 ch-shadow-inner">
                            <span className="ch-text-neutral-200">💪</span>
                          </div>
                          <div>
                            <div className="ch-h-1_5 ch-w-16 ch-bg-neutral-300 ch-rounded-full ch-mb-2 ch-shadow-inner" />
                            <div className="ch-h-1_5 ch-w-24 ch-bg-neutral-600 ch-rounded-full ch-shadow-inner" />
                          </div>
                        </div>
                      </div>

                      <div className="ch-bg-white-20 ch-rounded-full" style={{ position: "absolute", bottom: "8px", left: "50%", transform: "translateX(-50%)", width: "120px", height: "4px", boxShadow: "0 1px 2px rgba(0,0,0,0.5)" }} />
                    </div>
                  </div>
                </div>

                {/* Floating Glass Badges */}
                <div className="floating-badge floating-ui-badge ch-badge ch-gap-3 ch-lg-top-12 ch-lg-left-neg-80 ch-lg-p-4" style={{ top: "24px", left: "-15px", zIndex: 30 }}>
                  <div className="ch-badge-icon ch-w-8 ch-h-8 ch-bg-grad-blue ch-border ch-border-blue-400-30">
                    <span className="ch-text-base ch-drop-shadow-lg">🏆</span>
                  </div>
                  <div>
                    <p className="ch-text-white ch-text-sm ch-font-bold ch-tracking-tight">Streak</p>
                    <p className="ch-text-blue-200 ch-text-10px ch-font-medium">Milestone hit</p>
                  </div>
                </div>

                <div className="floating-badge floating-ui-badge ch-badge ch-gap-3 ch-lg-bottom-20 ch-lg-right-neg-80 ch-lg-p-4" style={{ bottom: "48px", right: "-15px", zIndex: 30 }}>
                  <div className="ch-badge-icon ch-w-8 ch-h-8 ch-bg-grad-indigo ch-border ch-border-indigo-400-30">
                    <span className="ch-text-base ch-drop-shadow-lg">🎯</span>
                  </div>
                  <div>
                    <p className="ch-text-white ch-text-sm ch-font-bold ch-tracking-tight">Deadlift</p>
                    <p className="ch-text-blue-200 ch-text-10px ch-font-medium">PR broken</p>
                  </div>
                </div>

              </div>
            </div>

            {/* 3. BOTTOM / LEFT: TEXT */}
            <div className="card-left-text gsap-reveal ch-order-3 ch-order-lg-1 ch-flex ch-flex-col ch-justify-center ch-text-center ch-text-left ch-z-20 ch-w-full ch-px-4 ch-lg-px-0">
              <h3 className="ch-text-white ch-text-2xl ch-md-text-3xl ch-lg-text-4xl ch-font-bold ch-mb-6 ch-tracking-tight">
                {cardHeading}
              </h3>
              <p className="ch-md-block ch-md-hidden ch-text-blue-200 ch-text-opacity-70 ch-text-sm ch-md-text-base ch-lg-text-lg ch-font-normal ch-leading-relaxed ch-mx-auto ch-max-w-sm">
                {cardDescription}
              </p>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
