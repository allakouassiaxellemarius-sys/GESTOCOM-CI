import sharp from 'sharp';
import { mkdir } from 'fs/promises';

await mkdir('C:/temp/play-store-assets', { recursive: true });

// --- ICON 512x512 ---
const iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#1e40af"/>
      <stop offset="50%" style="stop-color:#1e3a8a"/>
      <stop offset="100%" style="stop-color:#0f172a"/>
    </linearGradient>
    <linearGradient id="gold" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#f59e0b"/>
      <stop offset="100%" style="stop-color:#fbbf24"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="96" fill="url(#bg)"/>
  <!-- Decorative circles -->
  <circle cx="420" cy="80" r="120" fill="#1e40af" opacity="0.3"/>
  <circle cx="90" cy="430" r="100" fill="#fbbf24" opacity="0.08"/>
  <!-- G letter -->
  <text x="256" y="310" font-family="Arial, Helvetica, sans-serif" font-weight="900" font-size="260" fill="white" text-anchor="middle" dominant-baseline="central">G</text>
  <!-- Accent bar -->
  <rect x="120" y="370" width="272" height="8" rx="4" fill="url(#gold)"/>
  <!-- Text -->
  <text x="256" y="420" font-family="Arial, Helvetica, sans-serif" font-weight="700" font-size="52" fill="white" text-anchor="middle" letter-spacing="6">GESTOCOM</text>
  <text x="256" y="465" font-family="Arial, Helvetica, sans-serif" font-weight="400" font-size="32" fill="#93c5fd" text-anchor="middle" letter-spacing="12">C I</text>
</svg>`;

await sharp(Buffer.from(iconSvg)).resize(512, 512).png().toFile('C:/temp/play-store-assets/icon-512.png');
console.log('Icon created: C:/temp/play-store-assets/icon-512.png');

// --- FEATURE GRAPHIC 1024x500 ---
const featureSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="500" viewBox="0 0 1024 500">
  <defs>
    <linearGradient id="bg2" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#1e40af"/>
      <stop offset="40%" style="stop-color:#1e3a8a"/>
      <stop offset="100%" style="stop-color:#0f172a"/>
    </linearGradient>
    <linearGradient id="gold2" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#f59e0b"/>
      <stop offset="100%" style="stop-color:#fbbf24"/>
    </linearGradient>
  </defs>
  <rect width="1024" height="500" fill="url(#bg2)"/>
  
  <!-- Decorative elements -->
  <circle cx="850" cy="100" r="200" fill="#1e40af" opacity="0.25"/>
  <circle cx="900" cy="400" r="150" fill="#fbbf24" opacity="0.06"/>
  <circle cx="100" cy="450" r="120" fill="#3b82f6" opacity="0.08"/>
  
  <!-- Grid dots pattern -->
  <g opacity="0.05" fill="white">
    ${Array.from({length: 12}, (_, i) => Array.from({length: 6}, (_, j) => 
      `<circle cx="${80 + i * 80}" cy="${60 + j * 80}" r="3"/>`
    ).join('')).join('')}
  </g>
  
  <!-- Left side: G icon -->
  <rect x="80" y="120" width="200" height="200" rx="40" fill="white" opacity="0.1"/>
  <text x="180" y="255" font-family="Arial, Helvetica, sans-serif" font-weight="900" font-size="140" fill="white" text-anchor="middle" dominant-baseline="central">G</text>
  
  <!-- Gold accent line -->
  <rect x="320" y="210" width="8" height="60" rx="4" fill="url(#gold2)"/>
  
  <!-- Main text -->
  <text x="360" y="195" font-family="Arial, Helvetica, sans-serif" font-weight="900" font-size="72" fill="white">GESTOCOM</text>
  <text x="360" y="245" font-family="Arial, Helvetica, sans-serif" font-weight="300" font-size="40" fill="#93c5fd" letter-spacing="8">C I</text>
  
  <!-- Tagline -->
  <text x="360" y="310" font-family="Arial, Helvetica, sans-serif" font-weight="400" font-size="24" fill="#cbd5e1">Logiciel de gestion commerciale</text>
  <text x="360" y="345" font-family="Arial, Helvetica, sans-serif" font-weight="400" font-size="22" fill="#94a3b8">pour PME ivoiriennes</text>
  
  <!-- Feature badges -->
  <g transform="translate(360, 380)">
    <rect x="0" y="0" width="120" height="36" rx="18" fill="#059669" opacity="0.9"/>
    <text x="60" y="24" font-family="Arial, Helvetica, sans-serif" font-weight="600" font-size="14" fill="white" text-anchor="middle">Gratuit</text>
    
    <rect x="135" y="0" width="120" height="36" rx="18" fill="#7c3aed" opacity="0.9"/>
    <text x="195" y="24" font-family="Arial, Helvetica, sans-serif" font-weight="600" font-size="14" fill="white" text-anchor="middle">Hors-ligne</text>
    
    <rect x="270" y="0" width="120" height="36" rx="18" fill="#ea580c" opacity="0.9"/>
    <text x="330" y="24" font-family="Arial, Helvetica, sans-serif" font-weight="600" font-size="14" fill="white" text-anchor="middle">Multi-secteur</text>
  </g>
  
  <!-- Right side: feature icons -->
  <g transform="translate(780, 100)">
    <!-- POS icon -->
    <rect x="0" y="0" width="160" height="80" rx="16" fill="white" opacity="0.08"/>
    <text x="80" y="35" font-size="28" text-anchor="middle">💰</text>
    <text x="80" y="62" font-family="Arial, Helvetica, sans-serif" font-weight="500" font-size="13" fill="#93c5fd" text-anchor="middle">Point de Vente</text>
    
    <!-- Stock icon -->
    <rect x="0" y="95" width="160" height="80" rx="16" fill="white" opacity="0.08"/>
    <text x="80" y="130" font-size="28" text-anchor="middle">📦</text>
    <text x="80" y="157" font-family="Arial, Helvetica, sans-serif" font-weight="500" font-size="13" fill="#93c5fd" text-anchor="middle">Stock & Alertes</text>
    
    <!-- AI icon -->
    <rect x="0" y="190" width="160" height="80" rx="16" fill="white" opacity="0.08"/>
    <text x="80" y="225" font-size="28" text-anchor="middle">🤖</text>
    <text x="80" y="252" font-family="Arial, Helvetica, sans-serif" font-weight="500" font-size="13" fill="#93c5fd" text-anchor="middle">IA & Prédictions</text>
  </g>
</svg>`;

await sharp(Buffer.from(featureSvg)).resize(1024, 500).png().toFile('C:/temp/play-store-assets/feature-graphic.png');
console.log('Feature graphic created: C:/temp/play-store-assets/feature-graphic.png');

console.log('\nDone! Files in C:\\temp\\play-store-assets\\');
