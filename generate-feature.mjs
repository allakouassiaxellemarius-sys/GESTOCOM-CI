import sharp from 'sharp';

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
  
  <circle cx="850" cy="100" r="200" fill="#1e40af" opacity="0.25"/>
  <circle cx="900" cy="400" r="150" fill="#fbbf24" opacity="0.06"/>
  <circle cx="100" cy="450" r="120" fill="#3b82f6" opacity="0.08"/>
  
  <rect x="80" y="120" width="200" height="200" rx="40" fill="white" opacity="0.1"/>
  <text x="180" y="255" font-family="Arial, Helvetica, sans-serif" font-weight="900" font-size="140" fill="white" text-anchor="middle" dominant-baseline="central">G</text>
  
  <rect x="320" y="210" width="8" height="60" rx="4" fill="url(#gold2)"/>
  
  <text x="360" y="195" font-family="Arial, Helvetica, sans-serif" font-weight="900" font-size="72" fill="white">GESTOCOM</text>
  <text x="360" y="245" font-family="Arial, Helvetica, sans-serif" font-weight="300" font-size="40" fill="#93c5fd" letter-spacing="8">C I</text>
  
  <text x="360" y="310" font-family="Arial, Helvetica, sans-serif" font-weight="400" font-size="24" fill="#cbd5e1">Logiciel de gestion commerciale</text>
  <text x="360" y="345" font-family="Arial, Helvetica, sans-serif" font-weight="400" font-size="22" fill="#94a3b8">pour PME ivoiriennes</text>
  
  <g transform="translate(360, 380)">
    <rect x="0" y="0" width="120" height="36" rx="18" fill="#059669" opacity="0.9"/>
    <text x="60" y="24" font-family="Arial, Helvetica, sans-serif" font-weight="600" font-size="14" fill="white" text-anchor="middle">Gratuit</text>
    <rect x="135" y="0" width="120" height="36" rx="18" fill="#7c3aed" opacity="0.9"/>
    <text x="195" y="24" font-family="Arial, Helvetica, sans-serif" font-weight="600" font-size="14" fill="white" text-anchor="middle">Hors-ligne</text>
    <rect x="270" y="0" width="140" height="36" rx="18" fill="#ea580c" opacity="0.9"/>
    <text x="340" y="24" font-family="Arial, Helvetica, sans-serif" font-weight="600" font-size="14" fill="white" text-anchor="middle">Multi-secteur</text>
  </g>
  
  <g transform="translate(780, 100)">
    <rect x="0" y="0" width="160" height="80" rx="16" fill="white" opacity="0.08"/>
    <text x="80" y="50" font-family="Arial, Helvetica, sans-serif" font-weight="500" font-size="14" fill="#93c5fd" text-anchor="middle">Point de Vente</text>
    <rect x="0" y="95" width="160" height="80" rx="16" fill="white" opacity="0.08"/>
    <text x="80" y="145" font-family="Arial, Helvetica, sans-serif" font-weight="500" font-size="14" fill="#93c5fd" text-anchor="middle">Stock et Alertes</text>
    <rect x="0" y="190" width="160" height="80" rx="16" fill="white" opacity="0.08"/>
    <text x="80" y="240" font-family="Arial, Helvetica, sans-serif" font-weight="500" font-size="14" fill="#93c5fd" text-anchor="middle">IA et Predictions</text>
  </g>
</svg>`;

await sharp(Buffer.from(featureSvg)).resize(1024, 500).png().toFile('C:/temp/play-store-assets/feature-graphic.png');
console.log('Feature graphic created: C:/temp/play-store-assets/feature-graphic.png');
