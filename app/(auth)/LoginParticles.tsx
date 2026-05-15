"use client";

import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";

type ParticleDef = {
  leftPct: number;
  topPct: number;
  duration: number;
  delay: number;
};

function makeParticles(count: number): ParticleDef[] {
  // Use Math.random only on the client (this component is client-only).
  return Array.from({ length: count }, () => {
    const leftPct = Math.random() * 100;
    const topPct = Math.random() * 100;
    const duration = 3 + Math.random() * 4;
    const delay = Math.random() * 5;
    return { leftPct, topPct, duration, delay };
  });
}

export default function LoginParticles() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const particles = useMemo(() => {
    return makeParticles(20);
  }, []);

  if (!mounted) return null;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 rounded-full bg-yellow-400/30"
          style={{
            left: `${p.leftPct}%`,
            top: `${p.topPct}%`,
          }}
          animate={{
            y: [0, -30, 0],
            opacity: [0, 1, 0],
            scale: [0, 1.5, 0],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            delay: p.delay,
          }}
        />
      ))}
    </div>
  );
}


