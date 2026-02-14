/**
 * Apply a text watermark to a canvas.
 */
export function applyWatermark(ctx, canvasW, canvasH, settings) {
  if (!settings.enabled || !settings.text) return;

  const fontSize = settings.fontSize || 24;
  const fontFamily = settings.fontFamily || 'Arial';
  const opacity = (settings.opacity ?? 50) / 100;

  ctx.save();
  ctx.globalAlpha = opacity;
  ctx.font = `${fontSize}px "${fontFamily}"`;
  ctx.fillStyle = settings.color || '#ffffff';

  // Text shadow for readability
  ctx.shadowColor = 'rgba(0,0,0,0.5)';
  ctx.shadowBlur = 4;
  ctx.shadowOffsetX = 1;
  ctx.shadowOffsetY = 1;

  const metrics = ctx.measureText(settings.text);
  const textW = metrics.width;
  const textH = fontSize;
  const padding = Math.max(10, fontSize * 0.5);

  const pos = getPosition(settings.position, canvasW, canvasH, textW, textH, padding);

  ctx.textBaseline = 'top';
  ctx.fillText(settings.text, pos.x, pos.y);
  ctx.restore();
}

function getPosition(position, canvasW, canvasH, textW, textH, padding) {
  const positions = {
    'top-left':      { x: padding, y: padding },
    'top-center':    { x: (canvasW - textW) / 2, y: padding },
    'top-right':     { x: canvasW - textW - padding, y: padding },
    'center-left':   { x: padding, y: (canvasH - textH) / 2 },
    'center':        { x: (canvasW - textW) / 2, y: (canvasH - textH) / 2 },
    'center-right':  { x: canvasW - textW - padding, y: (canvasH - textH) / 2 },
    'bottom-left':   { x: padding, y: canvasH - textH - padding },
    'bottom-center': { x: (canvasW - textW) / 2, y: canvasH - textH - padding },
    'bottom-right':  { x: canvasW - textW - padding, y: canvasH - textH - padding },
  };
  return positions[position] || positions['bottom-right'];
}
