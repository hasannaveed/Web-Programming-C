import { useState, useEffect, useRef, useCallback } from "react";
 
// ─── Probability distributions ───
const PROBS = {
  aggressive: [
    { label: "W", runs: -1, prob: 0.40, color: "#DC2626" },
    { label: "0", runs: 0, prob: 0.10, color: "#6B7280" },
    { label: "1", runs: 1, prob: 0.10, color: "#2563EB" },
    { label: "2", runs: 2, prob: 0.10, color: "#7C3AED" },
    { label: "3", runs: 3, prob: 0.05, color: "#D97706" },
    { label: "4", runs: 4, prob: 0.10, color: "#059669" },
    { label: "6", runs: 6, prob: 0.15, color: "#E11D48" },
  ],
  defensive: [
    { label: "W", runs: -1, prob: 0.15, color: "#DC2626" },
    { label: "0", runs: 0, prob: 0.30, color: "#6B7280" },
    { label: "1", runs: 1, prob: 0.25, color: "#2563EB" },
    { label: "2", runs: 2, prob: 0.15, color: "#7C3AED" },
    { label: "3", runs: 3, prob: 0.05, color: "#D97706" },
    { label: "4", runs: 4, prob: 0.07, color: "#059669" },
    { label: "6", runs: 6, prob: 0.03, color: "#E11D48" },
  ],
};
 
const TOTAL_BALLS = 12;
const TOTAL_WICKETS = 2;
 
const COMMENTARY = {
  W: [
    "BOWLED HIM! The stumps are shattered!",
    "CAUGHT! That's a terrible shot, walks back!",
    "OUT! Edged and taken behind the stumps!",
    "GONE! The batsman departs, what a delivery!",
  ],
  0: [
    "Dot ball. Good tight bowling.",
    "Defended solidly, no run.",
    "Played and missed! Lucky escape.",
  ],
  1: [
    "Quick single taken, good running!",
    "Pushed into the gap for one.",
    "Tapped to mid-on, easy single.",
  ],
  2: [
    "Nicely placed! Two runs taken.",
    "Good running between the wickets, two!",
    "Driven through the covers for a couple.",
  ],
  3: [
    "Three runs! Great placement!",
    "Misfield at the boundary, three taken!",
    "Excellent shot, they come back for three!",
  ],
  4: [
    "FOUR! Crashing through the covers!",
    "BOUNDARY! That raced to the fence!",
    "Glorious drive for FOUR!",
    "FOUR! Timed to perfection!",
  ],
  6: [
    "SIX! That's gone into the stands!",
    "MASSIVE SIX! Out of the ground!",
    "SIX! What a shot, incredible power!",
    "LAUNCHED for SIX! The crowd goes wild!",
  ],
};
 
function getOutcome(style, pos) {
  const probs = PROBS[style];
  let cumulative = 0;
  for (const seg of probs) {
    cumulative += seg.prob;
    if (pos < cumulative) return seg;
  }
  return probs[probs.length - 1];
}
 
function formatOvers(balls) {
  return `${Math.floor(balls / 6)}.${balls % 6}`;
}
 
// ─── Canvas Cricket Field with full animations ───
function CricketField({ phase, ballProgress, batSwing, lastResult, hitBallPos, stumpsHit }) {
  const canvasRef = useRef(null);
 
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = canvas.width;
    const H = canvas.height;
 
    ctx.clearRect(0, 0, W, H);
 
    // Sky gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, H * 0.35);
    skyGrad.addColorStop(0, "#0f2640");
    skyGrad.addColorStop(1, "#3a7bbf");
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, W, H * 0.35);
 
    // Ground
    const groundGrad = ctx.createLinearGradient(0, H * 0.35, 0, H);
    groundGrad.addColorStop(0, "#2d8a4e");
    groundGrad.addColorStop(0.5, "#238c3e");
    groundGrad.addColorStop(1, "#1a5c2e");
    ctx.fillStyle = groundGrad;
    ctx.fillRect(0, H * 0.35, W, H * 0.65);
 
    // Mowed stripe pattern
    ctx.globalAlpha = 0.06;
    for (let i = 0; i < 12; i++) {
      if (i % 2 === 0) {
        ctx.fillStyle = "#fff";
        const y1 = H * 0.35 + (H * 0.65 / 12) * i;
        ctx.fillRect(0, y1, W, H * 0.65 / 12);
      }
    }
    ctx.globalAlpha = 1;
 
    // Pitch strip (perspective)
    ctx.fillStyle = "#c4a55a";
    ctx.beginPath();
    ctx.moveTo(W * 0.44, H * 0.38);
    ctx.lineTo(W * 0.56, H * 0.38);
    ctx.lineTo(W * 0.545, H * 0.95);
    ctx.lineTo(W * 0.455, H * 0.95);
    ctx.closePath();
    ctx.fill();
 
    // Pitch wear marks
    ctx.globalAlpha = 0.15;
    ctx.fillStyle = "#8b7340";
    ctx.beginPath();
    ctx.ellipse(W * 0.5, H * 0.55, 8, 20, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(W * 0.49, H * 0.72, 6, 12, 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
 
    // Crease lines
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(W * 0.44, H * 0.85);
    ctx.lineTo(W * 0.56, H * 0.85);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(W * 0.45, H * 0.45);
    ctx.lineTo(W * 0.55, H * 0.45);
    ctx.stroke();
 
    // Crowd silhouette
    ctx.fillStyle = "#0a2015";
    for (let x = 0; x < W; x += 6) {
      const h = 14 + Math.sin(x * 0.12) * 6 + Math.cos(x * 0.07) * 4;
      ctx.beginPath();
      ctx.arc(x, H * 0.35, h, Math.PI, 0);
      ctx.fill();
    }
    // Crowd colour dots
    ctx.globalAlpha = 0.3;
    const cc = ["#22c55e", "#facc15", "#3b82f6", "#ef4444", "#fff"];
    for (let x = 5; x < W; x += 14) {
      ctx.fillStyle = cc[Math.floor(Math.sin(x) * 2.5 + 2.5)];
      ctx.beginPath();
      ctx.arc(x, H * 0.35 - 6 - Math.sin(x * 0.2) * 3, 2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
 
    // Boundary rope
    ctx.strokeStyle = "rgba(255,255,255,0.5)";
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 6]);
    ctx.beginPath();
    ctx.ellipse(W * 0.5, H * 0.6, W * 0.46, H * 0.32, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
 
    // Stumps at bowler's end
    for (let i = -1; i <= 1; i++) {
      ctx.fillStyle = "#f5e6c8";
      ctx.fillRect(W * 0.5 + i * 4 - 1, H * 0.42, 2, 14);
    }
    ctx.fillStyle = "#e8d5a0";
    ctx.fillRect(W * 0.5 - 6, H * 0.415, 12, 2);
 
    // Stumps at batsman's end
    if (stumpsHit) {
      ctx.save();
      const t = stumpsHit;
      for (let i = -1; i <= 1; i++) {
        ctx.save();
        ctx.translate(W * 0.5 + i * 6, H * 0.82);
        ctx.rotate(i * t * 0.8);
        ctx.translate(i * t * 8, -t * 15);
        ctx.fillStyle = "#f5e6c8";
        ctx.fillRect(-1.5, 0, 3, 18);
        ctx.restore();
      }
      ctx.save();
      ctx.translate(W * 0.5, H * 0.82 - t * 25);
      ctx.rotate(t * 3);
      ctx.fillStyle = "#e8d5a0";
      ctx.fillRect(-7, -1, 14, 2.5);
      ctx.restore();
      ctx.restore();
    } else {
      for (let i = -1; i <= 1; i++) {
        ctx.fillStyle = "#f5e6c8";
        ctx.fillRect(W * 0.5 + i * 5 - 1.5, H * 0.82, 3, 18);
      }
      ctx.fillStyle = "#e8d5a0";
      ctx.fillRect(W * 0.5 - 8, H * 0.815, 16, 2.5);
    }
 
    // ─── Bowler figure ───
    const bx = W * 0.5;
    const by = H * 0.43;
    ctx.fillStyle = "#eee";
    ctx.beginPath();
    ctx.arc(bx, by - 14, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ddd";
    ctx.fillRect(bx - 4, by - 8, 8, 16);
    ctx.fillStyle = "#ccc";
    ctx.fillRect(bx - 4, by + 8, 3, 10);
    ctx.fillRect(bx + 1, by + 8, 3, 10);
    // Bowling arm
    ctx.strokeStyle = "#eee";
    ctx.lineWidth = 2.5;
    const bowlArmAngle = phase === "bowling" ? -Math.PI * 0.3 + ballProgress * Math.PI * 0.7 : 0;
    ctx.beginPath();
    ctx.moveTo(bx + 4, by - 4);
    ctx.lineTo(bx + 4 + Math.cos(bowlArmAngle) * 14, by - 4 + Math.sin(bowlArmAngle) * 14);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(bx - 4, by - 2);
    ctx.lineTo(bx - 14, by + 6);
    ctx.stroke();
 
    // ─── Ball bowling animation ───
    if (phase === "bowling" && ballProgress !== undefined) {
      const startY = H * 0.44;
      const endY = H * 0.80;
      const t = ballProgress;
      const ballSize = 3 + t * 5;
      const ballX = W * 0.5 + Math.sin(t * Math.PI * 0.3) * 4;
      const ballYPos = startY + (endY - startY) * t;
 
      // Bounce effect at ~70%
      let bounceOffset = 0;
      if (t > 0.65 && t < 0.85) {
        const bt = (t - 0.65) / 0.2;
        bounceOffset = -Math.sin(bt * Math.PI) * 8;
      }
 
      // Ball shadow on pitch
      ctx.globalAlpha = 0.25 * t;
      ctx.fillStyle = "#000";
      ctx.beginPath();
      ctx.ellipse(ballX, ballYPos + ballSize + 2, ballSize * 1.2, ballSize * 0.4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
 
      // Ball trail (ghosting effect)
      for (let trail = 5; trail >= 1; trail--) {
        const tt = Math.max(0, t - trail * 0.03);
        const trailY = startY + (endY - startY) * tt;
        const trailX = W * 0.5 + Math.sin(tt * Math.PI * 0.3) * 4;
        const trailSize = 3 + tt * 5;
        ctx.globalAlpha = 0.08 * (6 - trail);
        ctx.fillStyle = "#ff4444";
        ctx.beginPath();
        ctx.arc(trailX, trailY, trailSize * 0.7, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
 
      // Ball with shading
      const gradient = ctx.createRadialGradient(ballX - 1, ballYPos + bounceOffset - 1, 1, ballX, ballYPos + bounceOffset, ballSize);
      gradient.addColorStop(0, "#ff5555");
      gradient.addColorStop(0.6, "#cc0000");
      gradient.addColorStop(1, "#880000");
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(ballX, ballYPos + bounceOffset, ballSize, 0, Math.PI * 2);
      ctx.fill();
 
      // Rotating seam
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.arc(ballX, ballYPos + bounceOffset, ballSize * 0.8, 0.2 + t * 8, 1.0 + t * 8);
      ctx.stroke();
 
      // Speed lines
      if (t < 0.5) {
        ctx.globalAlpha = 0.3 * (1 - t * 2);
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 1;
        for (let l = 0; l < 3; l++) {
          const lx = ballX - 6 + l * 6;
          ctx.beginPath();
          ctx.moveTo(lx, ballYPos + bounceOffset - ballSize - 3);
          ctx.lineTo(lx, ballYPos + bounceOffset - ballSize - 10 - l * 3);
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
      }
 
      // Pitch impact mark on bounce
      if (t > 0.65 && t < 0.9) {
        ctx.globalAlpha = 0.4 * (1 - (t - 0.65) / 0.25);
        ctx.fillStyle = "#8b7340";
        ctx.beginPath();
        const impactY = startY + (endY - startY) * 0.7;
        ctx.ellipse(W * 0.5, impactY, 6, 3, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }
    }
 
    // ─── Post-hit ball trajectory ───
    if ((phase === "hitanim" || phase === "result") && hitBallPos) {
      const hx = hitBallPos.x;
      const hy = hitBallPos.y;
      const hSize = hitBallPos.size || 5;
 
      // Trail
      if (hitBallPos.trail) {
        for (let i = 0; i < hitBallPos.trail.length; i++) {
          const tp = hitBallPos.trail[i];
          ctx.globalAlpha = 0.1 + (i / hitBallPos.trail.length) * 0.25;
          ctx.fillStyle = "#ff4444";
          ctx.beginPath();
          ctx.arc(tp.x, tp.y, hSize * 0.5, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
      }
 
      // Shadow
      ctx.globalAlpha = 0.2;
      ctx.fillStyle = "#000";
      ctx.beginPath();
      ctx.ellipse(hx, H * 0.9, hSize, hSize * 0.3, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
 
      // Ball
      const hGrad = ctx.createRadialGradient(hx - 1, hy - 1, 1, hx, hy, hSize);
      hGrad.addColorStop(0, "#ff5555");
      hGrad.addColorStop(0.6, "#cc0000");
      hGrad.addColorStop(1, "#880000");
      ctx.fillStyle = hGrad;
      ctx.beginPath();
      ctx.arc(hx, hy, hSize, 0, Math.PI * 2);
      ctx.fill();
    }
 
    // ─── Batsman ───
    const batX = W * 0.5 + 18;
    const batY = H * 0.78;
    ctx.fillStyle = "#1a6b2a";
    ctx.beginPath();
    ctx.arc(batX, batY - 18, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#333";
    ctx.beginPath();
    ctx.arc(batX, batY - 18, 7, -0.3, 0.8);
    ctx.lineTo(batX, batY - 18);
    ctx.fill();
    ctx.strokeStyle = "#666";
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(batX - 3, batY - 14);
    ctx.lineTo(batX + 5, batY - 14);
    ctx.stroke();
    ctx.fillStyle = "#1a6b2a";
    ctx.fillRect(batX - 5, batY - 11, 10, 18);
    ctx.fillStyle = "rgba(255,255,255,0.3)";
    ctx.font = "bold 8px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("7", batX, batY + 2);
    ctx.fillStyle = "#f5f5f5";
    ctx.fillRect(batX - 5, batY + 7, 4, 14);
    ctx.fillRect(batX + 1, batY + 7, 4, 14);
    ctx.fillStyle = "#e8e0d0";
    ctx.fillRect(batX - 6, batY + 10, 5, 10);
    ctx.fillRect(batX + 1, batY + 10, 5, 10);
    ctx.fillStyle = "#fff";
    ctx.fillRect(batX - 6, batY + 20, 5, 3);
    ctx.fillRect(batX + 1, batY + 20, 5, 3);
 
    // Bat with swing
    const swing = batSwing || 0;
    ctx.save();
    ctx.translate(batX - 8, batY - 4);
    ctx.rotate(-0.6 + swing);
    ctx.fillStyle = "#8B6914";
    ctx.fillRect(-1.5, -30, 3, 12);
    ctx.fillStyle = "#333";
    ctx.fillRect(-2, -30, 4, 5);
    ctx.fillStyle = "#d4a847";
    ctx.fillRect(-4, -20, 8, 18);
    ctx.fillStyle = "#f0d68a";
    ctx.fillRect(-4, -20, 2, 18);
    ctx.fillStyle = "#c49a3c";
    ctx.fillRect(-4, -2, 8, 3);
    ctx.restore();
 
    // ─── Result flash ───
    if (phase === "result" && lastResult) {
      ctx.save();
      const isWicket = lastResult.runs === -1;
      const text = isWicket ? "OUT!" : lastResult.runs === 0 ? "DOT BALL" : lastResult.runs >= 4 ? (lastResult.runs === 6 ? "SIX!" : "FOUR!") : `${lastResult.runs} RUN${lastResult.runs > 1 ? "S" : ""}`;
      ctx.shadowColor = isWicket ? "#ff0000" : lastResult.runs >= 4 ? "#ffd700" : "#fff";
      ctx.shadowBlur = 30;
      ctx.font = "bold 44px 'Georgia', serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.strokeStyle = "rgba(0,0,0,0.8)";
      ctx.lineWidth = 4;
      ctx.strokeText(text, W * 0.5, H * 0.5);
      ctx.fillStyle = isWicket ? "#ff3333" : lastResult.runs >= 4 ? "#ffd700" : "#fff";
      ctx.fillText(text, W * 0.5, H * 0.5);
      ctx.shadowBlur = 0;
      ctx.restore();
    }
  }, [phase, ballProgress, batSwing, lastResult, hitBallPos, stumpsHit]);
 
  return (
    <canvas
      ref={canvasRef}
      width={500}
      height={400}
      style={{ width: "100%", maxWidth: 500, borderRadius: 12, border: "3px solid #1a3a2a" }}
    />
  );
}
 