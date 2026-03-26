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
 
function PowerBar({ style, sliderPos, active }) {
  const probs = PROBS[style];
  return (
    <div style={{ position: "relative", width: "100%", maxWidth: 500, margin: "0 auto" }}>
      <div style={{ display: "flex", height: 38, borderRadius: 8, overflow: "hidden", border: "2px solid #333", position: "relative" }}>
        {probs.map((seg, i) => (
          <div key={i} style={{
            width: `${seg.prob * 100}%`, background: seg.color,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: seg.prob < 0.06 ? 9 : 12, fontWeight: 700, color: "#fff",
            textShadow: "0 1px 2px rgba(0,0,0,0.6)",
            borderRight: i < probs.length - 1 ? "1px solid rgba(0,0,0,0.3)" : "none",
          }}>
            {seg.label}
          </div>
        ))}
        <div style={{
          position: "absolute", left: `${sliderPos * 100}%`, top: -6, bottom: -6, width: 3,
          background: "#fff", boxShadow: "0 0 8px rgba(255,255,255,0.8), 0 0 3px #000",
          transition: active ? "none" : "left 0.1s", zIndex: 10,
        }} />
        <div style={{
          position: "absolute", left: `calc(${sliderPos * 100}% - 6px)`, top: -12,
          width: 0, height: 0, borderLeft: "6px solid transparent", borderRight: "6px solid transparent",
          borderTop: "8px solid #fff", filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.5))", zIndex: 10,
        }} />
      </div>
      <div style={{ display: "flex", marginTop: 4 }}>
        {probs.map((seg, i) => (
          <div key={i} style={{ width: `${seg.prob * 100}%`, textAlign: "center", fontSize: 9, color: "#aaa", fontFamily: "monospace" }}>
            {(seg.prob * 100).toFixed(0)}%
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Game ───
export default function CricketGame() {
  const [runs, setRuns] = useState(0);
  const [wickets, setWickets] = useState(0);
  const [ballsBowled, setBallsBowled] = useState(0);
  const [battingStyle, setBattingStyle] = useState("aggressive");
  const [phase, setPhase] = useState("idle");
  const [sliderPos, setSliderPos] = useState(0);
  const [sliderActive, setSliderActive] = useState(true);
  const [ballProgress, setBallProgress] = useState(0);
  const [batSwing, setBatSwing] = useState(0);
  const [lastResult, setLastResult] = useState(null);
  const [hitBallPos, setHitBallPos] = useState(null);
  const [stumpsHit, setStumpsHit] = useState(null);
  const [commentary, setCommentary] = useState("Choose your batting style and play a shot!");
  const [bestScore, setBestScore] = useState(0);
  const [ballLog, setBallLog] = useState([]);
 
  const sliderRef = useRef(null);
  const animRef = useRef(null);
 
  const gameOver = wickets >= TOTAL_WICKETS || ballsBowled >= TOTAL_BALLS;
 
  // Slider oscillation
  useEffect(() => {
    if (phase !== "idle" || gameOver) {
      if (sliderRef.current) cancelAnimationFrame(sliderRef.current);
      return;
    }
    let dir = 1, pos = 0;
    const speed = 0.007;
    const animate = () => {
      pos += speed * dir;
      if (pos >= 1) { pos = 1; dir = -1; }
      if (pos <= 0) { pos = 0; dir = 1; }
      setSliderPos(pos);
      sliderRef.current = requestAnimationFrame(animate);
    };
    sliderRef.current = requestAnimationFrame(animate);
    setSliderActive(true);
    return () => { if (sliderRef.current) cancelAnimationFrame(sliderRef.current); };
  }, [phase, gameOver]);
 
  const playShot = useCallback(() => {
    if (phase !== "idle" || gameOver) return;
    const currentPos = sliderPos;
    setSliderActive(false);
    setHitBallPos(null);
    setStumpsHit(null);
 
    // PHASE 1: Bowling (ball travels from bowler to batsman)
    setPhase("bowling");
    let frame = 0;
    const bowlDuration = 60;
 
    const bowlAnim = () => {
      frame++;
      const t = frame / bowlDuration;
      const progress = t * t * (3 - 2 * t); // smoothstep easing
      setBallProgress(progress);
 
      if (frame < bowlDuration) {
        animRef.current = requestAnimationFrame(bowlAnim);
      } else {
        // PHASE 2: Bat swing
        setPhase("batting");
        let swing = 0;
        const swingAnim = () => {
          swing += 0.08;
          setBatSwing(swing);
          if (swing < 1.2) {
            animRef.current = requestAnimationFrame(swingAnim);
          } else {
            const outcome = getOutcome(battingStyle, currentPos);
            setLastResult(outcome);
            const key = outcome.runs === -1 ? "W" : String(outcome.runs);
            const msgs = COMMENTARY[key];
            setCommentary(msgs[Math.floor(Math.random() * msgs.length)]);
 
            if (outcome.runs === -1) {
              setWickets(w => w + 1);
            } else {
              setRuns(r => r + outcome.runs);
            }
            setBallsBowled(b => b + 1);
            setBallLog(log => [...log, { ball: ballsBowled + 1, style: battingStyle, result: key }]);
 
            // PHASE 3: Post-hit animation
            if (outcome.runs === -1) {
              // Stumps flying
              setPhase("hitanim");
              let st = 0;
              const stumpAnim = () => {
                st += 0.04;
                setStumpsHit(st);
                if (st < 1) {
                  animRef.current = requestAnimationFrame(stumpAnim);
                } else {
                  setPhase("result");
                  finishBall(outcome);
                }
              };
              animRef.current = requestAnimationFrame(stumpAnim);
            } else if (outcome.runs >= 4) {
              // Boundary hit: ball flies to fence / over stands
              setPhase("hitanim");
              const angle = outcome.runs === 6
                ? -Math.PI * 0.5 + (Math.random() - 0.5) * 0.6
                : -Math.PI * 0.3 + (Math.random() - 0.5) * 1.2;
              let bf = 0;
              const trail = [];
              const hitAnim = () => {
                bf += 0.025;
                const dist = bf * 300;
                const bx = 250 + 18 + Math.cos(angle) * dist;
                const by_base = 312 + Math.sin(angle) * dist;
                const arc = outcome.runs === 6 ? -Math.sin(bf * Math.PI) * 120 : 0;
                const ballSize = outcome.runs === 6 ? 5 + bf * 3 : 5 - bf * 2;
                trail.push({ x: bx, y: by_base + arc });
                if (trail.length > 8) trail.shift();
                setHitBallPos({ x: bx, y: by_base + arc, size: Math.max(2, ballSize), trail: [...trail] });
                if (bf < 1) {
                  animRef.current = requestAnimationFrame(hitAnim);
                } else {
                  setPhase("result");
                  finishBall(outcome);
                }
              };
              animRef.current = requestAnimationFrame(hitAnim);
            } else {
              // Dot / singles / doubles: ball rolls on ground
              setPhase("hitanim");
              let rf = 0;
              const rollAngle = -Math.PI * 0.4 + Math.random() * 0.8;
              const rollDist = outcome.runs === 0 ? 40 : 60 + outcome.runs * 30;
              const trail = [];
              const rollAnim = () => {
                rf += 0.04;
                const d = rf * rollDist;
                const rx = 250 + 18 + Math.cos(rollAngle) * d;
                const ry = 312 + Math.sin(rollAngle) * d;
                trail.push({ x: rx, y: ry });
                if (trail.length > 6) trail.shift();
                setHitBallPos({ x: rx, y: ry, size: 4, trail: [...trail] });
                if (rf < 1) {
                  animRef.current = requestAnimationFrame(rollAnim);
                } else {
                  setPhase("result");
                  finishBall(outcome);
                }
              };
              animRef.current = requestAnimationFrame(rollAnim);
            }
          }
        };
        animRef.current = requestAnimationFrame(swingAnim);
      }
    };
    animRef.current = requestAnimationFrame(bowlAnim);
 
    function finishBall(outcome) {
      setTimeout(() => {
        setBatSwing(0);
        setBallProgress(0);
        setHitBallPos(null);
        setStumpsHit(null);
        setLastResult(null);
        const newW = wickets + (outcome.runs === -1 ? 1 : 0);
        const newB = ballsBowled + 1;
        if (newW >= TOTAL_WICKETS || newB >= TOTAL_BALLS) {
          setPhase("gameover");
          const finalR = runs + (outcome.runs > 0 ? outcome.runs : 0);
          setBestScore(b => Math.max(b, finalR));
        } else {
          setPhase("idle");
        }
      }, 1400);
    }
  }, [phase, gameOver, sliderPos, battingStyle, wickets, ballsBowled, runs]);
 
  const restartGame = () => {
    setRuns(0); setWickets(0); setBallsBowled(0); setBattingStyle("aggressive");
    setPhase("idle"); setSliderPos(0); setSliderActive(true);
    setBallProgress(0); setBatSwing(0); setLastResult(null);
    setHitBallPos(null); setStumpsHit(null);
    setCommentary("Choose your batting style and play a shot!"); setBallLog([]);
  };
 
  const strikeRate = ballsBowled > 0 ? ((runs / ballsBowled) * 100).toFixed(1) : "0.0";
 
  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #0a1628 0%, #1a2d4a 40%, #0d2233 100%)",
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      color: "#e8e8e8", padding: "12px 8px",
      display: "flex", flexDirection: "column", alignItems: "center",
    }}>
      {/* Header */}
      <div style={{
        textAlign: "center", marginBottom: 12, padding: "8px 24px",
        background: "linear-gradient(90deg, transparent, rgba(45,138,78,0.3), transparent)",
        borderBottom: "2px solid #2d8a4e",
      }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, letterSpacing: 2, color: "#4ade80", textShadow: "0 0 20px rgba(74,222,128,0.3)" }}>
          🏏 CRICKET CHAMPION
        </h1>
        <div style={{ fontSize: 10, color: "#6b9e7a", letterSpacing: 4, marginTop: 2 }}>2D BATTING SIMULATOR</div>
      </div>
 
      {/* Scoreboard */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, width: "100%", maxWidth: 500, marginBottom: 12 }}>
        {[
          { label: "RUNS", value: runs, color: "#4ade80" },
          { label: "WICKETS", value: `${wickets}/${TOTAL_WICKETS}`, color: "#f87171" },
          { label: "OVERS", value: formatOvers(ballsBowled), color: "#60a5fa" },
          { label: "SR", value: strikeRate, color: "#fbbf24" },
        ].map(item => (
          <div key={item.label} style={{
            background: "rgba(255,255,255,0.05)", borderRadius: 8, padding: "8px 4px",
            textAlign: "center", border: "1px solid rgba(255,255,255,0.1)",
          }}>
            <div style={{ fontSize: 9, color: "#888", letterSpacing: 1, marginBottom: 2 }}>{item.label}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: item.color }}>{item.value}</div>
          </div>
        ))}
      </div>
 
      {/* Cricket Field */}
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
        <CricketField phase={phase} ballProgress={ballProgress} batSwing={batSwing} lastResult={lastResult} hitBallPos={hitBallPos} stumpsHit={stumpsHit} />
      </div>
 
      {/* Commentary */}
      <div style={{
        width: "100%", maxWidth: 500, background: "rgba(0,0,0,0.4)", borderRadius: 8,
        padding: "8px 14px", marginBottom: 12, textAlign: "center", fontSize: 13,
        fontStyle: "italic", color: "#fbbf24", borderLeft: "3px solid #fbbf24",
        minHeight: 36, display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {commentary}
      </div>
 
      {/* Power Bar */}
      {!gameOver && (
        <div style={{ width: "100%", maxWidth: 500, marginBottom: 12 }}>
          <div style={{ fontSize: 10, color: "#888", marginBottom: 4, textAlign: "center", letterSpacing: 1 }}>
            POWER BAR — {battingStyle.toUpperCase()} MODE
          </div>
          <PowerBar style={battingStyle} sliderPos={sliderPos} active={sliderActive} />
        </div>
      )}
 
      {/* Controls */}
      {!gameOver ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, width: "100%", maxWidth: 500 }}>
          <div style={{ display: "flex", gap: 8 }}>
            {["aggressive", "defensive"].map(s => (
              <button key={s} onClick={() => phase === "idle" && setBattingStyle(s)} disabled={phase !== "idle"}
                style={{
                  padding: "8px 20px", borderRadius: 8,
                  border: battingStyle === s ? "2px solid" : "2px solid rgba(255,255,255,0.15)",
                  borderColor: battingStyle === s ? (s === "aggressive" ? "#ef4444" : "#3b82f6") : "rgba(255,255,255,0.15)",
                  background: battingStyle === s ? (s === "aggressive" ? "rgba(239,68,68,0.2)" : "rgba(59,130,246,0.2)") : "rgba(255,255,255,0.05)",
                  color: battingStyle === s ? "#fff" : "#888",
                  fontSize: 13, fontWeight: 700, cursor: phase === "idle" ? "pointer" : "not-allowed",
                  letterSpacing: 1, textTransform: "uppercase", opacity: phase !== "idle" ? 0.5 : 1,
                }}>
                {s === "aggressive" ? "⚡ Aggressive" : "🛡️ Defensive"}
              </button>
            ))}
          </div>
          <button onClick={playShot} disabled={phase !== "idle"}
            style={{
              padding: "14px 48px", borderRadius: 12, border: "none",
              background: phase === "idle" ? "linear-gradient(135deg, #16a34a, #22c55e)" : "rgba(255,255,255,0.1)",
              color: "#fff", fontSize: 16, fontWeight: 800, cursor: phase === "idle" ? "pointer" : "not-allowed",
              letterSpacing: 2, boxShadow: phase === "idle" ? "0 4px 20px rgba(34,197,94,0.4)" : "none",
              textTransform: "uppercase", opacity: phase !== "idle" ? 0.5 : 1,
            }}>
            {phase === "idle" ? "🏏 PLAY SHOT" : phase === "bowling" ? "⏳ BOWLING..." : phase === "result" ? "✨ RESULT" : "🏏 HITTING..."}
          </button>
        </div>
      ) : (
        <div style={{
          textAlign: "center", padding: 20, background: "rgba(0,0,0,0.5)", borderRadius: 16,
          border: "2px solid rgba(255,255,255,0.1)", width: "100%", maxWidth: 500,
        }}>
          <div style={{ fontSize: 28, fontWeight: 900, color: "#fbbf24", marginBottom: 8, textShadow: "0 0 20px rgba(251,191,36,0.4)" }}>
            🏁 INNINGS OVER
          </div>
          <div style={{ fontSize: 16, color: "#ccc", marginBottom: 4 }}>
            Final Score: <span style={{ color: "#4ade80", fontWeight: 800, fontSize: 24 }}>{runs}</span> / {wickets}
          </div>
          <div style={{ fontSize: 13, color: "#888", marginBottom: 4 }}>
            Overs: {formatOvers(ballsBowled)} &nbsp;|&nbsp; Strike Rate: {strikeRate}
          </div>
          <div style={{ fontSize: 13, color: "#888", marginBottom: 16 }}>Best Score: {bestScore}</div>
          {ballLog.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 10, color: "#888", marginBottom: 6, letterSpacing: 1 }}>BALL-BY-BALL</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4, justifyContent: "center" }}>
                {ballLog.map((b, i) => (
                  <div key={i} style={{
                    width: 28, height: 28, borderRadius: "50%",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 11, fontWeight: 700,
                    background: b.result === "W" ? "#dc2626" : b.result === "4" || b.result === "6" ? "#16a34a" : b.result === "0" ? "#4b5563" : "#2563eb",
                    color: "#fff", border: b.style === "aggressive" ? "2px solid #ef4444" : "2px solid #3b82f6",
                  }}>
                    {b.result}
                  </div>
                ))}
              </div>
            </div>
          )}
          <button onClick={restartGame} style={{
            padding: "12px 36px", borderRadius: 10, border: "none",
            background: "linear-gradient(135deg, #2563eb, #3b82f6)", color: "#fff",
            fontSize: 15, fontWeight: 700, cursor: "pointer", letterSpacing: 1,
            boxShadow: "0 4px 16px rgba(37,99,235,0.4)",
          }}>
            🔄 RESTART GAME
          </button>
        </div>
      )}
 
      {/* Probability Tables */}
      <div style={{ width: "100%", maxWidth: 500, marginTop: 16, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        {["aggressive", "defensive"].map(s => (
          <div key={s} style={{
            background: "rgba(255,255,255,0.03)", borderRadius: 8, padding: 8,
            border: `1px solid ${s === "aggressive" ? "rgba(239,68,68,0.2)" : "rgba(59,130,246,0.2)"}`,
          }}>
            <div style={{
              fontSize: 10, fontWeight: 700,
              color: s === "aggressive" ? "#f87171" : "#60a5fa",
              letterSpacing: 1, marginBottom: 6, textAlign: "center", textTransform: "uppercase",
            }}>
              {s === "aggressive" ? "⚡ Aggressive" : "🛡️ Defensive"}
            </div>
            {PROBS[s].map(seg => (
              <div key={seg.label} style={{ display: "flex", justifyContent: "space-between", fontSize: 10, padding: "2px 4px", color: "#aaa" }}>
                <span>
                  <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: 2, background: seg.color, marginRight: 4, verticalAlign: "middle" }} />
                  {seg.label === "W" ? "Wicket" : `${seg.label} Run${seg.runs !== 1 ? "s" : ""}`}
                </span>
                <span style={{ fontFamily: "monospace" }}>{(seg.prob * 100).toFixed(0)}%</span>
              </div>
            ))}
          </div>
        ))}
      </div>
      <div style={{ fontSize: 9, color: "#444", marginTop: 12, textAlign: "center" }}>
        2 Overs • {TOTAL_WICKETS} Wickets • Probability-Based Power Bar System
      </div>
    </div>
  );
}
 