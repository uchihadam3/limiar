// Símbolos gravados nas portas. Cada um é desenhado em canvas 2D.
export const SYMBOL_NAMES = {
  sol: 'Sol', lua: 'Lua', olho: 'Olho', estrela: 'Estrela', chave: 'Chave', espiral: 'Espiral',
  mao: 'Mão', coroa: 'Coroa', peixe: 'Peixe', ampulheta: 'Ampulheta', arvore: 'Árvore', sino: 'Sino',
  passaro: 'Pássaro', olhoFechado: 'Olho fechado', escada: 'Escada', mascara: 'Máscara',
};

export function drawSymbol(ctx, name, cx, cy, r, color = '#2a1a08', lw = null) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.strokeStyle = color; ctx.fillStyle = color;
  ctx.lineWidth = lw ?? Math.max(2, r * 0.09);
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  const P = Math.PI;
  const circle = (x, y, rr, fill = false) => { ctx.beginPath(); ctx.arc(x, y, rr, 0, P * 2); fill ? ctx.fill() : ctx.stroke(); };
  switch (name) {
    case 'sol':
      circle(0, 0, r * 0.38);
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * P * 2;
        ctx.beginPath(); ctx.moveTo(Math.cos(a) * r * 0.52, Math.sin(a) * r * 0.52);
        ctx.lineTo(Math.cos(a) * r * (i % 2 ? 0.75 : 0.92), Math.sin(a) * r * (i % 2 ? 0.75 : 0.92)); ctx.stroke();
      }
      break;
    case 'lua':
      ctx.beginPath(); ctx.arc(0, 0, r * 0.75, P * 0.3, P * 1.7, false);
      ctx.arc(r * 0.32, 0, r * 0.6, P * 1.62, P * 0.38, true); ctx.closePath(); ctx.fill();
      break;
    case 'olho':
    case 'olhoFechado': {
      ctx.beginPath(); ctx.moveTo(-r * 0.9, 0); ctx.quadraticCurveTo(0, -r * 0.75, r * 0.9, 0);
      if (name === 'olho') { ctx.quadraticCurveTo(0, r * 0.75, -r * 0.9, 0); ctx.stroke(); circle(0, 0, r * 0.28, true); ctx.fillStyle = '#d8c79c'; circle(-r * 0.08, -r * 0.08, r * 0.07, true); }
      else {
        ctx.stroke();
        ctx.beginPath(); ctx.moveTo(-r * 0.9, 0); ctx.quadraticCurveTo(0, r * 0.35, r * 0.9, 0); ctx.stroke();
        for (let i = -3; i <= 3; i++) { ctx.beginPath(); ctx.moveTo(i * r * 0.22, r * 0.2 - Math.abs(i) * r * 0.03); ctx.lineTo(i * r * 0.3, r * 0.45); ctx.stroke(); }
      }
      break;
    }
    case 'estrela':
      ctx.beginPath();
      for (let i = 0; i < 10; i++) {
        const a = -P / 2 + (i / 10) * P * 2, rr = i % 2 ? r * 0.36 : r * 0.88;
        i ? ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr) : ctx.moveTo(Math.cos(a) * rr, Math.sin(a) * rr);
      }
      ctx.closePath(); ctx.stroke();
      break;
    case 'chave':
      circle(0, -r * 0.48, r * 0.3);
      ctx.beginPath(); ctx.moveTo(0, -r * 0.18); ctx.lineTo(0, r * 0.85);
      ctx.moveTo(0, r * 0.5); ctx.lineTo(r * 0.3, r * 0.5); ctx.moveTo(0, r * 0.75); ctx.lineTo(r * 0.24, r * 0.75); ctx.stroke();
      break;
    case 'espiral':
      ctx.beginPath();
      for (let i = 0; i < 200; i++) { const a = i * 0.11, rr = (i / 200) * r * 0.9; i ? ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr) : ctx.moveTo(0, 0); }
      ctx.stroke();
      break;
    case 'mao':
      ctx.beginPath();
      ctx.moveTo(-r * 0.45, r * 0.85); ctx.lineTo(-r * 0.5, -r * 0.1);
      for (let i = 0; i < 4; i++) { const x = -r * 0.42 + i * r * 0.26; ctx.lineTo(x, -r * (0.75 + (i === 1 || i === 2 ? 0.15 : 0))); ctx.lineTo(x + r * 0.16, -r * (0.75 + (i === 1 || i === 2 ? 0.15 : 0))); ctx.lineTo(x + r * 0.16, -r * 0.15); }
      ctx.lineTo(r * 0.7, -r * 0.05); ctx.lineTo(r * 0.45, r * 0.85); ctx.closePath(); ctx.stroke();
      circle(0, r * 0.35, r * 0.12, true);
      break;
    case 'coroa':
      ctx.beginPath(); ctx.moveTo(-r * 0.8, r * 0.5); ctx.lineTo(-r * 0.8, -r * 0.4); ctx.lineTo(-r * 0.4, r * 0.05);
      ctx.lineTo(0, -r * 0.6); ctx.lineTo(r * 0.4, r * 0.05); ctx.lineTo(r * 0.8, -r * 0.4); ctx.lineTo(r * 0.8, r * 0.5); ctx.closePath(); ctx.stroke();
      break;
    case 'peixe':
      ctx.beginPath(); ctx.moveTo(-r * 0.7, 0); ctx.quadraticCurveTo(0, -r * 0.65, r * 0.55, 0); ctx.quadraticCurveTo(0, r * 0.65, -r * 0.7, 0);
      ctx.moveTo(r * 0.55, 0); ctx.lineTo(r * 0.9, -r * 0.4); ctx.lineTo(r * 0.9, r * 0.4); ctx.closePath(); ctx.stroke();
      circle(-r * 0.35, -r * 0.08, r * 0.07, true);
      break;
    case 'ampulheta':
      ctx.beginPath(); ctx.moveTo(-r * 0.5, -r * 0.8); ctx.lineTo(r * 0.5, -r * 0.8); ctx.lineTo(-r * 0.5, r * 0.8); ctx.lineTo(r * 0.5, r * 0.8); ctx.closePath(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-r * 0.22, r * 0.6); ctx.lineTo(r * 0.22, r * 0.6); ctx.lineTo(0, r * 0.3); ctx.fill();
      break;
    case 'arvore':
      ctx.beginPath(); ctx.moveTo(0, r * 0.9); ctx.lineTo(0, -r * 0.2);
      for (const s of [-1, 1]) { ctx.moveTo(0, r * 0.2); ctx.lineTo(s * r * 0.6, -r * 0.4); ctx.moveTo(0, -r * 0.1); ctx.lineTo(s * r * 0.35, -r * 0.75); ctx.moveTo(s * r * 0.3, -r * 0.05); ctx.lineTo(s * r * 0.75, -r * 0.05); }
      ctx.moveTo(0, r * 0.9); ctx.lineTo(-r * 0.35, r * 0.95); ctx.moveTo(0, r * 0.9); ctx.lineTo(r * 0.35, r * 0.95);
      ctx.stroke();
      break;
    case 'sino':
      ctx.beginPath(); ctx.moveTo(-r * 0.65, r * 0.5); ctx.quadraticCurveTo(-r * 0.5, -r * 0.7, 0, -r * 0.72); ctx.quadraticCurveTo(r * 0.5, -r * 0.7, r * 0.65, r * 0.5); ctx.closePath(); ctx.stroke();
      circle(0, r * 0.68, r * 0.13, true); circle(0, -r * 0.82, r * 0.08);
      break;
    case 'passaro':
      ctx.beginPath(); ctx.moveTo(-r * 0.9, -r * 0.1); ctx.quadraticCurveTo(-r * 0.45, -r * 0.6, 0, 0); ctx.quadraticCurveTo(r * 0.45, -r * 0.6, r * 0.9, -r * 0.1); ctx.stroke();
      break;
    case 'escada':
      ctx.beginPath();
      for (let i = 0; i < 4; i++) { const y = r * 0.7 - i * r * 0.4, x = -r * 0.7 + i * r * 0.4; ctx.moveTo(x, y); ctx.lineTo(x, y - r * 0.4); ctx.lineTo(x + r * 0.4, y - r * 0.4); }
      ctx.stroke();
      break;
    case 'mascara':
      ctx.beginPath(); ctx.moveTo(-r * 0.7, -r * 0.6); ctx.quadraticCurveTo(0, -r * 0.8, r * 0.7, -r * 0.6); ctx.quadraticCurveTo(r * 0.7, r * 0.6, 0, r * 0.85); ctx.quadraticCurveTo(-r * 0.7, r * 0.6, -r * 0.7, -r * 0.6); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(-r * 0.28, -r * 0.15, r * 0.15, r * 0.08, 0.2, 0, P * 2); ctx.ellipse(r * 0.28, -r * 0.15, r * 0.15, r * 0.08, -0.2, 0, P * 2); ctx.fill();
      ctx.beginPath(); ctx.moveTo(-r * 0.25, r * 0.4); ctx.quadraticCurveTo(0, r * 0.25, r * 0.25, r * 0.4); ctx.stroke();
      break;
    default:
      circle(0, 0, r * 0.5);
  }
  ctx.restore();
}
