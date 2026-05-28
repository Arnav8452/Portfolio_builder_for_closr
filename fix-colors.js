const fs = require('fs');
const file = 'apps/web/components/retro/RetroPlatformData.tsx';
let content = fs.readFileSync(file, 'utf8');

// Replace color: 'white' and color: 'var(--arcade-cream)' with var(--arcade-ink)
content = content.replace(/color:\s*\"white\"/g, 'color: "var(--arcade-ink)"');
content = content.replace(/color:\s*\"var\(--arcade-cream\)\"/g, 'color: "var(--arcade-ink)"');
// Fix Github border
content = content.replace(/solid\s+var\(--arcade-cream\)/g, 'solid var(--arcade-ink)');

fs.writeFileSync(file, content);
console.log('Colors fixed.');
