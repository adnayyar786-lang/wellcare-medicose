// Production catalogue gate includes verified veterinary batch 006.
// Registry registration fix retrigger.
import fs from 'node:fs';

const files = [
  'scripts/catalog-batch-001.json',
  'scripts/catalog-batch-002.json',
  'scripts/catalog-batch-003a.json',
  'scripts/catalog-batch-004-images.json',
  'scripts/catalog-batch-005-images.json',
  'scripts/catalog-batch-006-veterinary.json',
  'scripts/catalog-batch-007-syrups.json',
  'scripts/catalog-batch-008-shelf-medicines.json',
  'scripts/catalog-batch-009-price-pending.json',
  'scripts/catalog-batch-010-photo-shelf-pending.json',
];

const seen = new Map();
let total = 0;
for (const file of files) {
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (!Array.isArray(data.items) || data.items.length === 0) {
    throw new Error(`EMPTY_OR_INVALID_BATCH: ${file}`);
  }
  for (const [index, item] of data.items.entries()) {
    total++;
    const where = `${file}[${index}]`;
    for (const key of ['name','category','shopCategory','description','price','stock','requiresPrescription']) {
      if (item[key] === undefined || item[key] === null || (typeof item[key] === 'string' && !item[key].trim())) {
        throw new Error(`MISSING_${key.toUpperCase()}: ${where}`);
      }
    }
    if (!Number.isFinite(item.price) || item.price < 0 || (item.price === 0 && !item.description.includes('[PRICE_PENDING]'))) throw new Error(`INVALID_PRICE: ${where}`);
    if (item.mrpPrice !== undefined && (!Number.isFinite(item.mrpPrice) || item.mrpPrice < item.price)) {
      throw new Error(`INVALID_MRP: ${where}`);
    }
    if (!Number.isInteger(item.stock) || item.stock < 0) throw new Error(`INVALID_STOCK: ${where}`);
    if (item.manufacturer === 'Generic') throw new Error(`UNVERIFIED_MANUFACTURER: ${where}`);
    if (/verify physical pack|catalogue entry prepared/i.test(item.description)) {
      throw new Error(`PLACEHOLDER_DESCRIPTION: ${where}`);
    }
    const key = item.name.trim().toLowerCase();
    if (seen.has(key)) throw new Error(`DUPLICATE_NAME: ${item.name} in ${where}; already in ${seen.get(key)}`);
    seen.set(key, where);
  }
}
console.log(`Catalogue validation passed: ${total} unique production items.`);