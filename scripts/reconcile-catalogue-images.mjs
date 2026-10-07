import fs from 'node:fs';

const productionFiles = [
  'scripts/catalog-batch-001.json',
  'scripts/catalog-batch-002.json',
  'scripts/catalog-batch-003a.json',
];
const imageBatchFile = 'scripts/catalog-batch-004-images.json';

const load = (file) => JSON.parse(fs.readFileSync(file, 'utf8')).items;
const production = productionFiles.flatMap(load);
const imageBatch = load(imageBatchFile);

const normalize = (value) => value.trim().toLowerCase().replace(/\s+/g, ' ');
const productionNames = new Map();
for (const item of production) {
  const key = normalize(item.name);
  if (productionNames.has(key)) {
    throw new Error(`DUPLICATE_PRODUCTION_NAME: ${item.name}`);
  }
  productionNames.set(key, item.name);
}

const batchNames = new Set();
const issues = [];
for (const item of imageBatch) {
  const key = normalize(item.name);
  if (batchNames.has(key)) issues.push(`DUPLICATE_IMAGE_BATCH_NAME: ${item.name}`);
  batchNames.add(key);

  if (productionNames.has(key)) {
    issues.push(`EXACT_PRODUCTION_DUPLICATE: ${item.name}`);
  }
  if (!item.imageUrl || !/^https?:\/\//i.test(item.imageUrl)) {
    issues.push(`INVALID_IMAGE_URL: ${item.name}`);
  }
  if (!item.manufacturer || /^generic$/i.test(item.manufacturer.trim())) {
    issues.push(`UNVERIFIED_MANUFACTURER: ${item.name}`);
  }
  if (!/\b\d+(?:\.\d+)?\s*(?:mg|mcg|g|kg|ml|l)\b/i.test(item.description)) {
    issues.push(`MISSING_STRENGTH_OR_SIZE_IN_DESCRIPTION: ${item.name}`);
  }
  if (!/\bpack of\b|\bstrip of\b|\b\d+\s*(?:tablets?|capsules?|g|ml|sachets?)\b/i.test(item.description)) {
    issues.push(`MISSING_PACK_REFERENCE: ${item.name}`);
  }
}

if (issues.length) {
  console.error('Catalogue image reconciliation FAILED');
  for (const issue of issues) console.error(issue);
  process.exit(1);
}

console.log(JSON.stringify({
  status: 'passed',
  productionRecordsBeforeImageBatch: production.length,
  imageBatchRecords: imageBatch.length,
  exactDuplicateNames: 0,
  note: 'Image batch contains distinct branded/pack variants; shared active ingredients are not treated as duplicate products.',
}, null, 2));
