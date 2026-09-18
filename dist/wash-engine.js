/* Canvas-only cleaning model. No DOM or network; shared by the playground and validation. */
(function (root) {
  'use strict';
  const NOZZLES = {
    precision: { radius: 0.026, squash: 0.64, label: 'Precision' },
    fan: { radius: 0.067, squash: 0.60, label: 'Wide fan' },
    ridiculous: { radius: 0.14, squash: 0.70, label: 'Ridiculous' }
  };
  function createModel({ clean, dirty, createCanvas }) {
    const width = clean.width, height = clean.height;
    const layer = createCanvas(width, height);
    const ctx = layer.getContext('2d');
    const sample = createCanvas(120, 90);
    const sampleContext = sample.getContext('2d', { willReadFrequently: true });
    const weights = new Float32Array(120 * 90);
    sampleContext.drawImage(clean, 0, 0, 120, 90);
    const original = sampleContext.getImageData(0, 0, 120, 90).data;
    sampleContext.clearRect(0, 0, 120, 90);
    sampleContext.drawImage(dirty, 0, 0, 120, 90);
    const stained = sampleContext.getImageData(0, 0, 120, 90).data;
    let totalWeight = 0;
    for (let y = 0; y < 90; y++) {
      for (let x = 0; x < 120; x++) {
        const nx = x / 120, ny = y / 90, i = y * 120 + x, p = i * 4;
        // Score darkened house/driveway pixels; unchanged sky and foliage aren't chores.
        const house = false;
        const driveway = ny >= 0.59 && nx > Math.max(0, 0.22 - (ny - 0.59) * 0.6);
        if (!house && !driveway) continue;
        const delta = (original[p] + original[p + 1] + original[p + 2] - stained[p] - stained[p + 1] - stained[p + 2]) / 3;
        if (delta > 16) { weights[i] = Math.min(100, delta); totalWeight += weights[i]; }
      }
    }
    // A valid illustrative asset still remains playable if its color difference is small.
    if (!totalWeight) {
      for (let y = 54; y < 90; y++) for (let x = 0; x < 120; x++) { weights[y * 120 + x] = 1; totalWeight++; }
    }
    function reset() {
      ctx.globalCompositeOperation = 'source-over';
      ctx.clearRect(0, 0, width, height);
      ctx.save();
      // Keep the house and sky clean. Only the illustrated driveway is the animated job.
      ctx.beginPath();
      [[0.245,0.58],[0.65,0.566],[0.84,0.60],[0.93,0.66],[1,0.79],[1,1],[0,1],[0.045,0.80],[0.17,0.635]].forEach(([x,y],i) => i ? ctx.lineTo(x*width,y*height) : ctx.moveTo(x*width,y*height));
      ctx.closePath(); ctx.clip(); ctx.drawImage(dirty, 0, 0, width, height); ctx.restore();
    }
    function stamp(x, y, nozzle) {
      const r = width * nozzle.radius;
      ctx.save(); ctx.globalCompositeOperation = 'destination-out';
      ctx.translate(x, y); ctx.scale(1, nozzle.squash);
      const brush = ctx.createRadialGradient(0, 0, r * 0.64, 0, 0, r);
      brush.addColorStop(0, 'rgba(0,0,0,1)'); brush.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = brush; ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    }
    function wash(from, to, mode = 'fan') {
      const nozzle = NOZZLES[mode];
      if (!nozzle || !from || !to || ![from.x, from.y, to.x, to.y].every(Number.isFinite)) return;
      const dx = to.x - from.x, dy = to.y - from.y;
      const steps = Math.max(1, Math.ceil(Math.hypot(dx, dy) / (width * nozzle.radius * 0.16)));
      for (let i = 0; i <= steps; i++) stamp(from.x + dx * i / steps, from.y + dy * i / steps, nozzle);
    }
    function progress() {
      sampleContext.clearRect(0, 0, 120, 90); sampleContext.drawImage(layer, 0, 0, 120, 90);
      const alpha = sampleContext.getImageData(0, 0, 120, 90).data;
      let remaining = 0;
      for (let i = 0; i < weights.length; i++) remaining += weights[i] * alpha[i * 4 + 3] / 255;
      return Math.max(0, Math.min(100, (1 - remaining / totalWeight) * 100));
    }
    function clear() { ctx.clearRect(0, 0, width, height); }
    function autoPath() {
      const points = [], step = width * NOZZLES.fan.radius * NOZZLES.fan.squash * 0.86;
      let row = 0;
      for (let y = height * 0.29; y <= height + step; y += step) {
        points.push({ x: row % 2 ? width + 10 : -10, y });
        points.push({ x: row % 2 ? -10 : width + 10, y });
        row++;
      }
      return points;
    }
    reset();
    sampleContext.clearRect(0, 0, 120, 90); sampleContext.drawImage(layer, 0, 0, 120, 90);
    const initial = sampleContext.getImageData(0, 0, 120, 90).data;
    totalWeight = 0;
    for (let i = 0; i < weights.length; i++) { if (initial[i * 4 + 3] < 250) weights[i] = 0; totalWeight += weights[i]; }
    return { width, height, layer, reset, wash, progress, clear, autoPath, targetWeight: totalWeight };
  }
  const api = { createModel, NOZZLES };
  root.LEWashEngine = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
