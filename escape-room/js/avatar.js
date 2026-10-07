// 角色外觀：選項定義 + SVG 繪製
export const OPTIONS = {
  skin: { label: '膚色', type: 'color', items: ['#F6D7BD', '#EBC09A', '#D29C72', '#A86F4A', '#6E4429'] },
  hair: {
    label: '髮型', type: 'choice',
    items: [
      { id: 'short', name: '短髮' }, { id: 'long', name: '長髮' }, { id: 'ponytail', name: '馬尾' },
      { id: 'spiky', name: '刺蝟頭' }, { id: 'bob', name: '鮑伯頭' }, { id: 'bald', name: '光頭' },
    ],
  },
  hairColor: { label: '髮色', type: 'color', items: ['#1E1A18', '#5A3A22', '#A8692F', '#D9B66B', '#B8B8B8', '#8E3B46'] },
  eyes: {
    label: '眼睛', type: 'choice',
    items: [{ id: 'round', name: '圓眼' }, { id: 'happy', name: '笑眼' }, { id: 'sharp', name: '銳利' }, { id: 'sleepy', name: '睏睏' }],
  },
  outfit: {
    label: '服裝', type: 'choice',
    items: [
      { id: 'coat', name: '偵探風衣' }, { id: 'hoodie', name: '連帽衫' }, { id: 'suit', name: '西裝' },
      { id: 'labcoat', name: '實驗袍' }, { id: 'vest', name: '探險背心' },
    ],
  },
  outfitColor: { label: '服裝顏色', type: 'color', items: ['#8A6A45', '#2F4A5C', '#5B6E4F', '#7A2E2E', '#3B3346', '#C9A255'] },
  accessory: {
    label: '配件', type: 'choice',
    items: [
      { id: 'none', name: '無' }, { id: 'glasses', name: '眼鏡' }, { id: 'monocle', name: '單片眼鏡' },
      { id: 'hat', name: '偵探帽' }, { id: 'headphones', name: '耳機' },
    ],
  },
};

export const DEFAULT_APPEARANCE = {
  skin: '#EBC09A', hair: 'short', hairColor: '#1E1A18', eyes: 'round',
  outfit: 'coat', outfitColor: '#8A6A45', accessory: 'none',
};

export function randomAppearance() {
  const a = {};
  for (const [key, opt] of Object.entries(OPTIONS)) {
    const list = opt.items;
    const pick = list[Math.floor(Math.random() * list.length)];
    a[key] = opt.type === 'color' ? pick : pick.id;
  }
  return a;
}

function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  const c = (v) => Math.max(0, Math.min(255, v + amt));
  const r = c(n >> 16), g = c((n >> 8) & 255), b = c(n & 255);
  return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

function hairBack(style, c) {
  if (style === 'long') return `<path d="M52 100 Q50 48 100 46 Q150 48 148 100 L152 182 Q126 192 100 188 Q74 192 48 182 Z" fill="${c}"/>`;
  if (style === 'ponytail') return `<path d="M140 78 Q178 86 170 140 Q166 168 150 176 Q160 140 142 108 Z" fill="${c}"/>`;
  if (style === 'bob') return `<path d="M50 104 Q48 50 100 48 Q152 50 150 104 L152 140 Q140 150 128 146 L72 146 Q60 150 48 140 Z" fill="${c}"/>`;
  return '';
}

function hairFront(style, c) {
  switch (style) {
    case 'short':
    case 'ponytail':
      return `<path d="M54 104 Q50 50 100 48 Q150 50 146 104 Q140 80 122 74 Q104 84 80 76 Q62 82 54 104 Z" fill="${c}"/>`;
    case 'long':
      return `<path d="M54 110 Q50 50 100 48 Q150 50 146 110 Q138 76 112 70 Q92 88 64 84 Q58 94 54 110 Z" fill="${c}"/>`;
    case 'bob':
      return `<path d="M52 108 Q50 50 100 48 Q150 50 148 108 Q146 84 138 78 L62 78 Q54 84 52 108 Z" fill="${c}"/>`;
    case 'spiky':
      return `<path d="M54 102 L52 70 L66 78 L68 46 L84 64 L96 38 L106 62 L122 42 L128 66 L144 54 L142 80 L150 76 L146 102 Q130 80 100 78 Q70 80 54 102 Z" fill="${c}"/>`;
    default:
      return '';
  }
}

function eyes(style) {
  const ink = '#2A211C';
  switch (style) {
    case 'happy':
      return `<path d="M76 110 Q84 100 92 110 M108 110 Q116 100 124 110" stroke="${ink}" stroke-width="4" fill="none" stroke-linecap="round"/>`;
    case 'sharp':
      return `<path d="M74 108 Q84 100 94 106 Q84 114 74 108 Z M106 106 Q116 100 126 108 Q116 114 106 106 Z" fill="${ink}"/>
              <path d="M72 96 L94 100 M128 96 L106 100" stroke="${ink}" stroke-width="3.5" stroke-linecap="round"/>`;
    case 'sleepy':
      return `<path d="M76 108 L92 108 M108 108 L124 108" stroke="${ink}" stroke-width="4" stroke-linecap="round"/>
              <path d="M76 104 Q84 100 92 104 M108 104 Q116 100 124 104" stroke="${ink}" stroke-width="2" fill="none" opacity=".5"/>`;
    default:
      return `<circle cx="84" cy="107" r="5.5" fill="${ink}"/><circle cx="116" cy="107" r="5.5" fill="${ink}"/>
              <circle cx="86" cy="105" r="1.8" fill="#fff"/><circle cx="118" cy="105" r="1.8" fill="#fff"/>`;
  }
}

function outfit(style, c) {
  const body = `M24 240 Q26 184 100 174 Q174 184 176 240 Z`;
  const dark = shade(c, -35), light = shade(c, 30);
  switch (style) {
    case 'hoodie':
      return `<path d="${body}" fill="${c}"/>
        <path d="M62 184 Q100 210 138 184 Q130 172 100 170 Q70 172 62 184 Z" fill="${dark}"/>
        <path d="M90 196 L88 226 M110 196 L112 226" stroke="${light}" stroke-width="3" stroke-linecap="round"/>
        <path d="M70 224 L130 224 L126 240 L74 240 Z" fill="${dark}" opacity=".6"/>`;
    case 'suit':
      return `<path d="${body}" fill="${c}"/>
        <path d="M82 176 L100 230 L118 176 Q100 172 82 176 Z" fill="#F2EEE6"/>
        <path d="M96 182 L104 182 L107 214 L100 226 L93 214 Z" fill="#7A2E2E"/>
        <path d="M82 176 L74 196 L92 202 Z M118 176 L126 196 L108 202 Z" fill="${dark}"/>`;
    case 'labcoat':
      return `<path d="${body}" fill="#F4F2EC"/>
        <path d="M84 176 L100 220 L116 176 Q100 172 84 176 Z" fill="${c}"/>
        <path d="M84 176 L72 200 L96 214 Z M116 176 L128 200 L104 214 Z" fill="#E1DDD3"/>
        <rect x="124" y="214" width="20" height="14" rx="2" fill="none" stroke="#C9C3B6" stroke-width="2"/>
        <path d="M130 210 L130 222" stroke="#2F4A5C" stroke-width="3"/>`;
    case 'vest':
      return `<path d="${body}" fill="#E7DCC4"/>
        <path d="M30 240 Q32 192 82 178 L94 240 Z M170 240 Q168 192 118 178 L106 240 Z" fill="${c}"/>
        <rect x="52" y="208" width="22" height="16" rx="2" fill="${dark}"/>
        <rect x="126" y="208" width="22" height="16" rx="2" fill="${dark}"/>`;
    default: // coat
      return `<path d="${body}" fill="${c}"/>
        <path d="M86 176 L100 214 L114 176 Q100 172 86 176 Z" fill="#E9DFC7"/>
        <path d="M86 176 L66 194 L84 200 L76 214 L100 236 Z M114 176 L134 194 L116 200 L124 214 L100 236 Z" fill="${light}"/>
        <circle cx="94" cy="224" r="3" fill="${dark}"/><circle cx="106" cy="224" r="3" fill="${dark}"/>`;
  }
}

function accessory(style) {
  switch (style) {
    case 'glasses':
      return `<g fill="none" stroke="#2A211C" stroke-width="3"><circle cx="84" cy="107" r="13"/><circle cx="116" cy="107" r="13"/>
              <path d="M97 106 Q100 103 103 106 M71 104 L56 100 M129 104 L144 100"/></g>`;
    case 'monocle':
      return `<circle cx="116" cy="107" r="14" fill="#fff" fill-opacity=".15" stroke="#C9A255" stroke-width="3"/>
              <path d="M128 116 Q136 140 128 168" stroke="#C9A255" stroke-width="1.5" fill="none"/>`;
    case 'hat':
      return `<ellipse cx="100" cy="66" rx="66" ry="12" fill="#5A4632"/>
              <path d="M58 66 Q60 22 100 20 Q140 22 142 66 Z" fill="#6E5640"/>
              <path d="M60 56 L140 56 L141 64 L59 64 Z" fill="#2A211C"/>`;
    case 'headphones':
      return `<path d="M52 108 Q50 40 100 38 Q150 40 148 108" stroke="#2A211C" stroke-width="7" fill="none"/>
              <rect x="40" y="96" width="18" height="30" rx="8" fill="#3B3346"/>
              <rect x="142" y="96" width="18" height="30" rx="8" fill="#3B3346"/>`;
    default:
      return '';
  }
}

export function renderAvatar(appearance = {}, { size = 200, background = true } = {}) {
  const a = { ...DEFAULT_APPEARANCE, ...appearance };
  const skinDark = shade(a.skin, -25);
  return `<svg viewBox="0 0 200 240" width="${size}" height="${size * 1.2}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="角色外觀">
    ${background ? `<rect width="200" height="240" fill="var(--avatar-bg, #2A1A1D)"/>` : ''}
    ${hairBack(a.hair, a.hairColor)}
    <rect x="88" y="140" width="24" height="40" fill="${skinDark}"/>
    ${outfit(a.outfit, a.outfitColor)}
    <circle cx="56" cy="110" r="9" fill="${a.skin}"/><circle cx="144" cy="110" r="9" fill="${a.skin}"/>
    <ellipse cx="100" cy="104" rx="45" ry="50" fill="${a.skin}"/>
    <ellipse cx="74" cy="124" rx="7" ry="4" fill="#E58C7A" opacity=".35"/>
    <ellipse cx="126" cy="124" rx="7" ry="4" fill="#E58C7A" opacity=".35"/>
    ${eyes(a.eyes)}
    <path d="M90 132 Q100 140 110 132" stroke="#7A3B2E" stroke-width="3" fill="none" stroke-linecap="round"/>
    ${hairFront(a.hair, a.hairColor)}
    ${accessory(a.accessory)}
  </svg>`;
}
