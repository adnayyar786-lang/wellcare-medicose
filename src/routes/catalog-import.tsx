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
  ["Dolo 650 Tablet 10","Micro Labs","Tablet",19.5,21.52]
] as const

const CHUNK = 50

export const Route = createFileRoute('/catalog-import')({ component: CatalogImport })

function CatalogImport() {
  const seed = useMutation(api.medicines.seedManyV2)
  const [done, setDone] = useState(0)
  const [running, setRunning] = useState(false)
  const [status, setStatus] = useState('Ready — no products have been imported yet.')

  const items = useMemo(() => [
    ...HUMAN.map(([name, manufacturer, category, price, mrpPrice]) => ({
      name, manufacturer, category, shopCategory: 'Medicines (Branded)',
      description: name + '. Verify pack, strength and current MRP before sale.',
      price, mrpPrice, stock: 20, requiresPrescription: false,
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
    setStatus('Import started…')
    try {
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
              <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', opacity: .55 }}>Wellcare Medicose 2.0</div>
              <h1 style={{ margin: '6px 0', fontSize: 30 }}>Catalogue Import Center</h1>
              <p style={{ margin: 0, opacity: .65 }}>Controlled bulk catalogue setup. Nothing runs until you press Start Import.</p>
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
            <strong>Deployment/data safety:</strong> this page is only the catalogue setup interface. Product filtering, prescription restrictions and final source validation are intentionally not applied yet.
          </div>
        </div>
      </section>
    </main>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return <div style={{ background: '#f8fafc', borderRadius: 14, padding: 18 }}><div style={{ fontSize: 28, fontWeight: 800 }}>{value}</div><div style={{ fontSize: 13, opacity: .65 }}>{label}</div></div>
}
