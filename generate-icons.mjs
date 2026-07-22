import sharp from 'sharp';

// --- DESIGN 2: Style minimaliste moderne ---
const icon2 = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="bg1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#059669"/>
      <stop offset="100%" style="stop-color:#047857"/>
    </linearGradient>
    <linearGradient id="shine" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:rgba(255,255,255,0.25)"/>
      <stop offset="100%" style="stop-color:rgba(255,255,255,0)"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="108" fill="url(#bg1)"/>
  <rect width="512" height="512" rx="108" fill="url(#shine)"/>
  
  <!-- Shopping bag icon -->
  <rect x="146" y="170" width="220" height="200" rx="20" fill="white" opacity="0.95"/>
  <path d="M196 170 L196 140 Q196 110 256 110 Q316 110 316 140 L316 170" fill="none" stroke="white" stroke-width="16" stroke-linecap="round" opacity="0.95"/>
  
  <!-- Currency symbol FCFA -->
  <text x="256" y="295" font-family="Arial, Helvetica, sans-serif" font-weight="900" font-size="80" fill="#047857" text-anchor="middle" dominant-baseline="central">CFA</text>
  
  <!-- Checkmark -->
  <circle cx="340" cy="340" r="50" fill="#fbbf24"/>
  <path d="M318 340 L333 355 L365 323" fill="none" stroke="white" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

// --- DESIGN 3: Style gradient violet/or ---
const icon3 = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="bg3" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#7c3aed"/>
      <stop offset="100%" style="stop-color:#4f46e5"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="108" fill="url(#bg3)"/>
  
  <!-- Bar chart -->
  <rect x="100" y="300" width="50" height="100" rx="8" fill="white" opacity="0.6"/>
  <rect x="170" y="220" width="50" height="180" rx="8" fill="white" opacity="0.75"/>
  <rect x="240" y="160" width="50" height="240" rx="8" fill="white" opacity="0.9"/>
  <rect x="310" y="120" width="50" height="280" rx="8" fill="#fbbf24"/>
  <rect x="380" y="200" width="50" height="200" rx="8" fill="white" opacity="0.7"/>
  
  <!-- Trend line -->
  <polyline points="125,290 195,210 265,150 335,110 405,190" fill="none" stroke="#fbbf24" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
  
  <!-- G letter bottom right -->
  <circle cx="420" cy="400" r="45" fill="white" opacity="0.15"/>
  <text x="420" y="408" font-family="Arial, Helvetica, sans-serif" font-weight="900" font-size="42" fill="white" text-anchor="middle" dominant-baseline="central">G</text>
</svg>`;

// --- DESIGN 4: Style africain / ivoire ---
const icon4 = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="bg4" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:#f97316"/>
      <stop offset="50%" style="stop-color:#ea580c"/>
      <stop offset="100%" style="stop-color:#c2410c"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="108" fill="url(#bg4)"/>
  
  <!-- White stripe (Cote d'Ivoire flag inspired) -->
  <rect x="0" y="190" width="512" height="132" fill="white" opacity="0.95"/>
  
  <!-- Green stripe left (Cote d'Ivoire flag) -->
  <rect x="0" y="0" width="170" height="512" fill="#009E60" opacity="0.85" rx="108"/>
  <rect x="170" y="0" width="0" height="512" fill="#009E60"/>
  
  <!-- Overlay for readability -->
  <rect x="0" y="0" width="512" height="512" rx="108" fill="white" opacity="0.1"/>
  
  <!-- G large -->
  <text x="256" y="300" font-family="Arial, Helvetica, sans-serif" font-weight="900" font-size="200" fill="white" text-anchor="middle" dominant-baseline="central" opacity="0.95">G</text>
  
  <!-- CI text -->
  <text x="256" y="440" font-family="Arial, Helvetica, sans-serif" font-weight="700" font-size="36" fill="white" text-anchor="middle" letter-spacing="8" opacity="0.9">COTE D'IVOIRE</text>
</svg>`;

// --- DESIGN 5: Style tech moderne ---
const icon5 = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="bg5" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0f172a"/>
      <stop offset="100%" style="stop-color:#1e293b"/>
    </linearGradient>
    <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#22d3ee"/>
      <stop offset="100%" style="stop-color:#06b6d4"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="108" fill="url(#bg5)"/>
  
  <!-- Hexagon pattern -->
  <polygon points="256,80 356,138 356,254 256,312 156,254 156,138" fill="none" stroke="#22d3ee" stroke-width="2" opacity="0.15"/>
  <polygon points="256,120 326,158 326,234 256,272 186,234 186,158" fill="none" stroke="#22d3ee" stroke-width="2" opacity="0.1"/>
  
  <!-- G -->
  <text x="256" y="260" font-family="Arial, Helvetica, sans-serif" font-weight="900" font-size="180" fill="url(#accent)" text-anchor="middle" dominant-baseline="central">G</text>
  
  <!-- Bottom bar -->
  <rect x="80" y="380" width="352" height="4" rx="2" fill="#22d3ee" opacity="0.3"/>
  
  <!-- Text -->
  <text x="256" y="420" font-family="Arial, Helvetica, sans-serif" font-weight="600" font-size="30" fill="white" text-anchor="middle" letter-spacing="4">GESTOCOM CI</text>
  
  <!-- Dots -->
  <circle cx="140" cy="460" r="6" fill="#22d3ee" opacity="0.4"/>
  <circle cx="170" cy="460" r="6" fill="#22d3ee" opacity="0.6"/>
  <circle cx="200" cy="460" r="6" fill="#22d3ee" opacity="0.8"/>
  <circle cx="230" cy="460" r="6" fill="#22d3ee"/>
</svg>`;

const dir = 'C:/temp/play-store-assets';

// Generate all 4 alternatives
const designs = [
  { svg: icon2, name: 'icon-design2-vert-commerce.png', label: 'Design 2: Vert Commerce' },
  { svg: icon3, name: 'icon-design3-violet-analytics.png', label: 'Design 3: Violet Analytics' },
  { svg: icon4, name: 'icon-design4-ivoire.png', label: 'Design 4: Couleurs CI' },
  { svg: icon5, name: 'icon-design5-tech.png', label: 'Design 5: Tech Moderne' },
];

for (const d of designs) {
  await sharp(Buffer.from(d.svg)).resize(512, 512).png().toFile(`${dir}/${d.name}`);
  console.log(`${d.label}: ${dir}/${d.name}`);
}

console.log('\nDone! 4 alternatives created.');
