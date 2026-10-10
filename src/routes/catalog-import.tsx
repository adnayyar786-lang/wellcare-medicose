import { createFileRoute } from '@tanstack/react-router'
import { useMemo, useState } from 'react'
import { useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
import petSeed from '../../scripts/pet-catalog-seed.json'

const HUMAN = [
  ["Dabur Honitus Honey-Based Ayurvedic Cough Syrup 100 ml","Dabur","Syrup",100,121],
  ["Hamdard Joshina Herbal Cough & Cold Syrup 200 ml","Hamdard","Syrup",135,140],
  ["Dabur Honitus Adulsa Cough Syrup 100 ml","Dabur","Syrup",82.8,92],
  ["Hamdard Joshina Herbal Cough & Cold Syrup 100 ml","Hamdard","Syrup",73.1,78],
  ["Benadryl DR Syrup 100 ml","Benadryl","Syrup",135,138],
  ["Dabur Honitus Honey-Based Ayurvedic Cough Syrup 200 ml","Dabur","Syrup",200,235],
  ["Himalaya Koflet Cough Syrup 100 ml","Himalaya","Syrup",108,117],
  ["Neurobion Forte Tablet 30","Merck","Tablet",47.5,47.5],
  ["Zincovit Tablet 15","Apex Laboratories","Tablet",99.3,108],
  ["Shelcal 500 Tablet 15","Torrent","Tablet",150,163],
  ["Evion 400mg Capsule 20","Merck","Capsule",78.7,98.5],
  ["Becosules Z Capsule 20","Pfizer","Capsule",64.1,69.2],
  ["Electral Powder 4.4 gm","FDC","Powder",4.6,4.7],
  ["Supradyn Daily Multivitamin Tablet 15","Bayer","Tablet",75,75],
  ["Dolo 650 Tablet 15","Micro Labs","Tablet",29,32.28],
  ["Dolo 650 Tablet 10","Micro Labs","Tablet",19.5,21.52],
  ["Apollo Trusted Rx Amat Tablet 10","Apollo","Tablet",52.3,61.5],
  ["Apollo Trusted Rx Amlip-5 Tablet 10","Apollo","Tablet",17.2,26.5],
  ["Apollo Trusted Rx Amlip-2.5 Tablet 10","Apollo","Tablet",12.7,19],
  ["Apollo Trusted Rx Cilogard 5 mg Tablet 10","Apollo","Tablet",41.9,46.5],
  ["Apollo Trusted Cipcal-500 Tablet 15","Apollo","Tablet",86,107.5],
  ["Apollo Trusted Rx Cosart-25 Tablet 10","Apollo","Tablet",34.2,38],
  ["Apollo Trusted Rx Cosart-50 Tablet 10","Apollo","Tablet",54,60],
  ["Apollo Trusted Rx Floxip 500 mg Tablet 10","Apollo","Tablet",32.9,44.5],
  ["Apollo Trusted Rx Floxip TZ Tablet 10","Apollo","Tablet",69.8,77.5],
  ["Apollo Trusted Rx Lipvas 20 Tablet 10","Apollo","Tablet",87.1,134],
  ["Apollo Trusted Rx Lipvas 40 Tablet 10","Apollo","Tablet",133.9,206],
  ["Apollo Trusted Rx Nicoflox 200 mg Tablet 10","Apollo","Tablet",62.4,113.5],
  ["Apollo Trusted Rx Nicopenta 40 Tablet 10","Apollo","Tablet",84.5,156.5],
  ["Apollo Trusted Malidens 650 mg Tablet 10","Apollo","Tablet",13.7,21],
  ["Apollo Trusted Rx Megamox CV 375 mg Tablet 10","Apollo","Tablet",148.4,265],
  ["Apollo Trusted Rx Roko 2 mg Capsule 10","Apollo","Capsule",21.6,24],
  ["Apollo Trusted Rx Rzole DSR Capsule 10","Apollo","Capsule",127.6,159.5],
  ["Apollo Trusted Rx Safepodox-200 Tablet 10","Apollo","Tablet",140.7,265.5],
  ["Apollo Trusted Rx Amoxyclav 625 Tablet 10","Apollo","Tablet",145.4,196.5],
  ["Apollo Trusted Rx Lunabet 1% Cream 10 gm","Apollo","Cream",90,112.5],
  ["Apollo Trusted Rx Lunabet 1% Cream 30 gm","Apollo","Cream",220.8,368],
  ["Apollo Trusted Rx Tossex XP Mango Syrup 100 ml","Apollo","Syrup",75,100],
  ["New Saridon Tablet 10","Saridon","Tablet",46.6,55],
  ["Crocin Advance 500mg Tablet 20","Crocin","Tablet",19.3,undefined],
  ["ParaCIP 500 Tablet 10","Cipla","Tablet",9,9.7],
  ["Calpol 650+ Tablet 15","Calpol","Tablet",30.4,32.2],
  ["Dettol Antiseptic Disinfectant Liquid 125 ml","Dettol","Liquid",87,91.3],
  ["Strepsils Orange Lozenges 8","Strepsils","Lozenge",26,28],
  ["Vicks Non-Medicated Portable Nasal Inhaler 1","Vicks","Inhaler",68.2,69],
  ["Vicks VapoRub Balm 25 ml","Vicks","Balm",105,109],
  ["Vicks VapoRub Balm 105 ml","Vicks","Balm",279,349],
  ["Hamdard Sualin 60","Hamdard","Tablet",60,75],
  ["Dabur Vasavaleha 250 gm","Dabur","Paste",200,235],
  ["Calcimax Forte+ Calcium Tablet 30","Tata 1mg","Tablet",275,322],
  ["Uprise-D3 60K Syrup 5 ml","Uprise","Syrup",85.7,96.4],
  ["Centrum Multivitamin 50+ 50","Centrum","Tablet",586,720],
  ["Joint Support Advanced Tablet 60","Tata 1mg","Tablet",465,573],
  ["Tata 1mg Pain Relief Gel 30 gm","Tata 1mg","Gel",70.2,103],
  ["Paracetamol 500mg Tablet 10","Generic","Tablet",12,15],
  ["Ibuprofen 400mg Tablet 10","Generic","Tablet",18,22],
  ["Cetirizine 10mg Tablet 10","Generic","Tablet",15,20],
  ["Levocetirizine 5mg Tablet 10","Generic","Tablet",18,24],
  ["Pantoprazole 40mg Tablet 10","Generic","Tablet",25,32],
  ["Omeprazole 20mg Capsule 10","Generic","Capsule",20,26],
  ["Domperidone 10mg Tablet 10","Generic","Tablet",18,24],
  ["Ondansetron 4mg Tablet 10","Generic","Tablet",28,35],
  ["ORS Orange Flavour Sachet 21g","Generic","Powder",18,20],
  ["Azithromycin 500mg Tablet 3","Generic","Tablet",25,35],
  ["Amoxicillin 500mg Capsule 10","Generic","Capsule",45,55],
  ["Metformin 500mg Tablet 10","Generic","Tablet",12,18],
  ["Amlodipine 5mg Tablet 10","Generic","Tablet",10,15],
  ["Losartan 50mg Tablet 10","Generic","Tablet",22,30],
  ["Atorvastatin 10mg Tablet 10","Generic","Tablet",18,25],
  ["Telmisartan 40mg Tablet 10","Generic","Tablet",25,35],
  ["Montelukast 10mg Tablet 10","Generic","Tablet",28,38],
  ["Ambroxol Syrup 100 ml","Generic","Syrup",65,78],
  ["Salbutamol Syrup 100 ml","Generic","Syrup",55,65],
  ["Mupirocin 2% Ointment 5g","Generic","Ointment",95,110],
  ["Clotrimazole 1% Cream 20g","Generic","Cream",55,65],
  ["Calamine Lotion 100ml","Generic","Lotion",75,90],
  ["Diclofenac Gel 30g","Generic","Gel",75,90],
  ["Antacid Suspension 170ml","Generic","Suspension",95,110],
  ["Loperamide 2mg Capsule 10","Generic","Capsule",18,25],
  ["B-Complex Tablet 20","Generic","Tablet",35,45],
  ["Vitamin C 500mg Tablet 20","Generic","Tablet",45,60],
  ["Calcium + Vitamin D3 Tablet 15","Generic","Tablet",70,85],
  ["Iron Folic Acid Tablet 30","Generic","Tablet",45,55],
  ["Multivitamin Tablet 30","Generic","Tablet",110,135],
  ["Lactulose Solution 100ml","Generic","Syrup",125,145],
  ["Povidone Iodine 10% Solution 100ml","Generic","Solution",95,115],
  ["Hydrogen Peroxide Solution 100ml","Generic","Solution",45,55],
  ["Normal Saline Nasal Drops 10ml","Generic","Drops",55,65],
  ["Artificial Tears Eye Drops 10ml","Generic","Eye Drops",85,100],
  ["Chlorhexidine Mouthwash 100ml","Generic","Mouthwash",85,100],
  ["Benzoyl Peroxide 2.5% Gel 20g","Generic","Gel",95,115],
  ["Adapalene 0.1% Gel 15g","Generic","Gel",115,135],
  ["Ketoconazole 2% Shampoo 100ml","Generic","Shampoo",120,145],
  ["ORS Lemon Flavour Sachet 21g","Generic","Powder",18,20],
] as const

// Transcribed only from the user's Jain Pharma invoice (01 Oct 2026).
// Invoice MRP is used as the initial selling price; stock reflects invoice quantity.
// No product images are attached until a matching image is verified.
const INVOICE_VET = [
  ["SELAMEC 0.05ML", "VIRBA", "Veterinary Medicine", 355, 50, true],
  ["CILIFAT OSTOVET FORT LIQUID 1L", "VIRBA", "Veterinary Supplement", 305, 3, false],
  ["VIMERAL FORTE 60 ML LIQUID", "VIRBA", "Veterinary Supplement", 140, 5, false],
  ["ZOTEK-P EAR DROP", "EK-TE", "Veterinary Ear Care", 70.31, 10, true],
  ["CANISHOT RV-F 1 DOSE", "INTAS", "Veterinary Vaccine", 205.04, 10, true],
  ["NOVIBAC TRICAT TRIO", "INTAS", "Veterinary Vaccine", 1040, 5, true],
  ["MELONEX PLUS 6 BOLUS", "INTAS", "Veterinary Medicine", 90, 10, true],
  ["ADVAPLAT 200ML HERBAL FORMULA", "SAVA", "Veterinary Care", 266.96, 3, false],
  ["KETOCHLOR SHAMPOO", "VIRBA", "Veterinary Shampoo", 385, 3, false],
  ["CEPHAVET 600MG", "SAVA", "Veterinary Medicine", 281.25, 2, true],
  ["KISKIN LOTION 100ML", "INTAS", "Veterinary Skin Care", 210, 3, false],
] as const

const CHUNK = 25

type CatalogueItem = {
  name: string
  manufacturer?: string
  category: string
  shopCategory: string
  description: string
  price: number
  mrpPrice?: number
  stock: number
  requiresPrescription: boolean
  imageUrl?: string
}

function validateCatalogueItem(item: CatalogueItem) {
  const errors: string[] = []
  if (!item.name.trim()) errors.push('missing name')
  if (!item.category.trim()) errors.push('missing section')
  if (!item.shopCategory.trim()) errors.push('missing shop category')
  if (!Number.isFinite(item.price) || item.price <= 0) errors.push('invalid selling price')
  if (item.mrpPrice !== undefined && item.mrpPrice < item.price) errors.push('MRP below selling price')
  if (!Number.isInteger(item.stock) || item.stock < 0) errors.push('invalid stock')
  if (!item.description.trim()) errors.push('missing description')
  return errors
}

export const Route = createFileRoute('/catalog-import')({ component: CatalogImport })

function CatalogImport() {
  const seed = useMutation(api.medicines.seedManyV2)
  const [done, setDone] = useState(0)
  const [running, setRunning] = useState(false)
  const [status, setStatus] = useState('Ready — no products have been imported yet.')

  const items = useMemo((): CatalogueItem[] => [
    ...HUMAN.map(([name, manufacturer, category, price, mrpPrice]) => ({
      name, manufacturer, category, shopCategory: 'Medicines (Branded)',
      description: name + '. Verify pack, strength and current MRP before sale.',
      price, mrpPrice, stock: 20, requiresPrescription: /Apollo Trusted Rx|Megamox|Amoxyclav|Floxip|Nicoflox|Safepodox|Cilogard|Cosart|Lipvas|Nicopenta|Roko|Rzole|Lunabet/.test(name),
    })),
    ...INVOICE_VET.map(([name, manufacturer, category, mrpPrice, stock, requiresPrescription]) => ({
      name, manufacturer, category, shopCategory: 'Pet Care',
      description: name + '. Invoice-transcribed listing; verify pack, species, label directions and current MRP before sale.',
      price: mrpPrice, mrpPrice, stock, requiresPrescription,
    })),
    ...petSeed.map(([name, price]) => ({
      name, manufacturer: name.split(' ')[0],
      category: name.toLowerCase().includes('food') ? 'Pet Food' : name.toLowerCase().includes('shampoo') ? 'Shampoo' : 'Pet Care',
      shopCategory: 'Pet Care',
      description: name + '. Verify species, age, weight and pack instructions before use.',
      price, mrpPrice: undefined, stock: 20, requiresPrescription: false,
    })),
  ], [])

  const humanCount = HUMAN.length
  const petCount = petSeed.length

  async function startImport() {
    if (running) return
    setRunning(true)
    setDone(0)
    setStatus('Validating catalogue batches…')
    try {
      const invalid = items.flatMap((item, index) =>
        validateCatalogueItem(item).map((error) => `#${index + 1} ${item.name}: ${error}`)
      )
      if (invalid.length) {
        throw new Error(`Catalogue validation failed: ${invalid.slice(0, 8).join(' • ')}`)
      }
      for (let i = 0; i < items.length; i += CHUNK) {
        const batch = items.slice(i, i + CHUNK)
        const inserted = await seed({ items: batch })
        const processed = Math.min(i + batch.length, items.length)
        setDone(processed)
        setStatus(`Batch complete: ${processed}/${items.length} processed • ${inserted} new`)
      }
      setStatus(`Import finished: ${items.length} catalogue records processed.`)
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Import failed')
    } finally {
      setRunning(false)
    }
  }

  const percent = Math.round((done / items.length) * 100)

  return (
    <main style={{ minHeight: '100vh', background: '#f6f8fb', padding: 24, fontFamily: 'system-ui' }}>
      <section style={{ maxWidth: 980, margin: '0 auto' }}>
        <div style={{ background: '#fff', borderRadius: 20, padding: 28, boxShadow: '0 8px 30px rgba(0,0,0,.06)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', opacity: .55 }}>Wellcare MEDICOSE</div>
              <h1 style={{ margin: '6px 0', fontSize: 30 }}>Catalogue Import Center</h1>
              <p style={{ margin: 0, opacity: .65 }}>Controlled catalogue workflow: validate → batch → dedupe → import → verify. Nothing runs until you press Start Import.</p>
            </div>
            <button onClick={startImport} disabled={running} style={{ border: 0, borderRadius: 12, padding: '13px 20px', fontWeight: 700, cursor: running ? 'wait' : 'pointer' }}>
              {running ? 'Importing…' : 'Start Import'}
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 14, marginTop: 26 }}>
            <Stat label="Human catalogue prepared" value={humanCount} />
            <Stat label="Veterinary / pet prepared" value={petCount} />
            <Stat label="Total records" value={items.length} />
            <Stat label="Processed this run" value={done} />
          </div>

          <div style={{ marginTop: 26 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <strong>Import progress</strong><span>{percent}%</span>
            </div>
            <div style={{ height: 10, background: '#e8edf3', borderRadius: 99, overflow: 'hidden' }}>
              <div style={{ width: `${percent}%`, height: '100%', background: '#111827', transition: 'width .2s' }} />
            </div>
            <p style={{ marginTop: 12, opacity: .7 }}>{status}</p>
          </div>

          <div style={{ marginTop: 24, padding: 16, borderRadius: 14, background: '#f8fafc', fontSize: 14, lineHeight: 1.6 }}>
            <strong>Deployment/data safety:</strong> this page is only the catalogue setup interface. Every batch is validated before import. Product images are only attached when a verified imageUrl is supplied; no guessed or unrelated image is ever assigned.
          </div>
        </div>
      </section>
    </main>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return <div style={{ background: '#f8fafc', borderRadius: 14, padding: 18 }}><div style={{ fontSize: 28, fontWeight: 800 }}>{value}</div><div style={{ fontSize: 13, opacity: .65 }}>{label}</div></div>
}
