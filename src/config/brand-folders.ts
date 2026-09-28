// Company folders are derived from explicit manufacturer data first, with a safe
// legacy fallback that recognises known pharmaceutical/healthcare companies.
const COMPANY_ALIASES: Array<[RegExp, string]> = [
  [/^apollo(?: pharmacy)?/i, 'Apollo'],
  [/mankind/i, 'Mankind'],
  [/dr\.?\s*reddy[’']?s?/i, "Dr. Reddy's"],
  [/cipla/i, 'Cipla'],
  [/sun\s*pharma/i, 'Sun Pharma'],
  [/abbott/i, 'Abbott'],
  [/lupin/i, 'Lupin'],
  [/himalaya(?: wellness)?/i, 'Himalaya'],
  [/torrent(?: pharmaceuticals)?/i, 'Torrent'],
  [/pfizer/i, 'Pfizer'],
  [/glenmark/i, 'Glenmark'],
  [/zydus/i, 'Zydus'],
  [/alembic/i, 'Alembic'],
  [/franco\s*indian/i, 'Franco Indian'],
  [/allergan/i, 'Allergan'],
  [/apex\s*laboratories/i, 'Apex Laboratories'],
  [/leeford/i, 'Leeford'],
  [/baidyanath/i, 'Baidyanath'],
  [/dabur/i, 'Dabur'],
];

export const BRAND_FOLDERS: string[] = [
  'Apollo',
  'Mankind',
  "Dr. Reddy's",
  'Cipla',
  'Sun Pharma',
  'Abbott',
  'Lupin',
  'Himalaya',
  'Torrent',
  'Pfizer',
  'Glenmark',
  'Zydus',
];

export function canonicalCompany(value: string) {
  const text = value.trim().replace(/\s+/g, ' ');
  if (!text || text.toLowerCase() === 'null') return '';
  const match = COMPANY_ALIASES.find(([pattern]) => pattern.test(text));
  return match?.[1] ?? '';
}

export function manufacturerOf(product: { name?: string; description: string; manufacturer?: string }) {
  const explicit = product.manufacturer?.trim();
  if (explicit) return canonicalCompany(explicit) || explicit;

  const text = `${product.description} ${product.name ?? ''}`;
  const match = COMPANY_ALIASES.find(([pattern]) => pattern.test(text));
  return match?.[1] ?? '';
}

export function inBrand(product: { name?: string; description: string; manufacturer?: string }, brand: string) {
  return manufacturerOf(product).toLowerCase() === brand.toLowerCase();
}

export function companyMonogram(company: string) {
  const canonical = canonicalCompany(company) || company.trim();
  const key = canonical.toLowerCase();
  const marks: Record<string, string> = {
    apollo: 'A',
    mankind: 'M',
    "dr. reddy's": 'DR',
    cipla: 'C',
    'sun pharma': 'SUN',
    abbott: 'A',
    lupin: 'L',
    himalaya: 'H',
    torrent: 'T',
    pfizer: 'Pf',
    glenmark: 'G',
    zydus: 'Z',
    alembic: 'AL',
    'franco indian': 'FI',
    allergan: 'AG',
    'apex laboratories': 'AP',
    leeford: 'L',
    baidyanath: 'B',
    dabur: 'D',
  };
  return marks[key] ?? canonical.split(/\s+/).slice(0, 2).map((part) => part.replace(/[^A-Za-z]/g, '')[0] ?? '').join('').toUpperCase();
}


export const COMPANY_LOGOS: Record<string, string> = {
  Apollo: 'https://assets.macaly-user-data.dev/exm42o5pehv6v9ztijohgy2n/bvngjnb4cw1qdnud5e9kc4hd/vP3ZQunAcUF-CNdDMt-CX/company-apollo-5Uvhg8Fx.png',
  Mankind: 'https://assets.macaly-user-data.dev/exm42o5pehv6v9ztijohgy2n/bvngjnb4cw1qdnud5e9kc4hd/8eAcXm9RY77QUr5B8Yd5-/company-mankind-9AY05cGy.png',
  "Dr. Reddy's": 'https://assets.macaly-user-data.dev/exm42o5pehv6v9ztijohgy2n/bvngjnb4cw1qdnud5e9kc4hd/5AO031WbOsUjVHxIYnRdq/company-dr-reddys-1YH1txbT.png',
  Cipla: 'https://assets.macaly-user-data.dev/exm42o5pehv6v9ztijohgy2n/bvngjnb4cw1qdnud5e9kc4hd/ylNuo577Tj90yDV2A-kWu/company-cipla-AWU9TOat.png',
  'Sun Pharma': 'https://assets.macaly-user-data.dev/exm42o5pehv6v9ztijohgy2n/bvngjnb4cw1qdnud5e9kc4hd/_v1tROLemC01-4J7JwuO4/company-sun-pharma-uHxrRUA9.png',
  Abbott: 'https://assets.macaly-user-data.dev/exm42o5pehv6v9ztijohgy2n/bvngjnb4cw1qdnud5e9kc4hd/VAs5UA2XOKZi_htVucdKe/company-abbott-5gIxY5eN.png',
  Lupin: 'https://assets.macaly-user-data.dev/exm42o5pehv6v9ztijohgy2n/bvngjnb4cw1qdnud5e9kc4hd/LbLpf8StQv61IkKFnJB9U/company-lupin-GLbipg9q.png',
  Himalaya: 'https://assets.macaly-user-data.dev/exm42o5pehv6v9ztijohgy2n/bvngjnb4cw1qdnud5e9kc4hd/-mC6Ckl8LaK2ONbWLZFwd/company-himalaya-EiA41r14.png',
  Torrent: 'https://assets.macaly-user-data.dev/exm42o5pehv6v9ztijohgy2n/bvngjnb4cw1qdnud5e9kc4hd/tqkqQYMHdGEbTmaJxoyWQ/company-torrent-6hj6loTY.png',
  Pfizer: 'https://assets.macaly-user-data.dev/exm42o5pehv6v9ztijohgy2n/bvngjnb4cw1qdnud5e9kc4hd/CHorsCSOBO1OVAV6W5VHT/company-pfizer-VKYn-Ao7.png',
  Glenmark: 'https://assets.macaly-user-data.dev/exm42o5pehv6v9ztijohgy2n/bvngjnb4cw1qdnud5e9kc4hd/J1JVhtmmWofssD0f8yBpg/company-glenmark-GKGA9jFY.png',
  Zydus: 'https://assets.macaly-user-data.dev/exm42o5pehv6v9ztijohgy2n/bvngjnb4cw1qdnud5e9kc4hd/VpdRiDEVaJ52VCGhkZOL5/company-zydus-Ap1orN7r.png',
};

export function companyLogo(company: string) {
  return COMPANY_LOGOS[canonicalCompany(company) || company.trim()] ?? '';
}

export function allManufacturers(products: Array<{ name?: string; description: string; manufacturer?: string }>) {
  return Array.from(
    new Set(products.map((product) => manufacturerOf(product)).filter(Boolean)),
  ).sort((a, b) => a.localeCompare(b));
}
