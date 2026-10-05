import { createFileRoute } from '@tanstack/react-router'
import { useMutation } from 'convex/react'
import { useState } from 'react'
import { api } from '../../convex/_generated/api'

const TEST = [
  { name: 'Dabur Honitus Honey-Based Ayurvedic Cough Syrup 100 ml', manufacturer: 'Dabur', category: 'Syrup', price: 100, mrpPrice: 121 },
  { name: 'Hamdard Joshina Herbal Cough & Cold Syrup 200 ml', manufacturer: 'Hamdard', category: 'Syrup', price: 135, mrpPrice: 140 },
  { name: 'Dabur Honitus Adulsa Cough Syrup 100 ml', manufacturer: 'Dabur', category: 'Syrup', price: 82.8, mrpPrice: 92 },
  { name: 'Hamdard Joshina Herbal Cough & Cold Syrup 100 ml', manufacturer: 'Hamdard', category: 'Syrup', price: 73.1, mrpPrice: 78 },
  { name: 'Benadryl DR Syrup 100 ml', manufacturer: 'Benadryl', category: 'Syrup', price: 135, mrpPrice: 138 },
]

export const Route = createFileRoute('/catalog-test')({ component: CatalogTest })

function CatalogTest() {
  const seed = useMutation(api.medicines.seedManyV2)
  const [status, setStatus] = useState('Ready — 5-product Cloudflare test only.')
  const [running, setRunning] = useState(false)

  async function uploadFive() {
    if (running) return
    setRunning(true)
    setStatus('Sending 5 products to the Convex catalogue…')
    try {
      const inserted = await seed({
        items: TEST.map((p) => ({
          ...p,
          shopCategory: 'Medicines (Branded)',
          description: p.name + '. Verify pack, strength and current MRP before sale.',
          stock: 20,
          requiresPrescription: false,
        })),
      })
      setStatus(`Test complete: Convex accepted the batch; ${inserted} new products were inserted.`)
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Test upload failed')
    } finally {
      setRunning(false)
    }
  }

  return (
    <main style={{ minHeight: '100vh', padding: 24, fontFamily: 'system-ui', background: '#f6f8fb' }}>
      <section style={{ maxWidth: 760, margin: '40px auto', background: '#fff', borderRadius: 18, padding: 28 }}>
        <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: 1, opacity: .55 }}>WELLCARE MEDICOSE 2.0</div>
        <h1>5-Product Deployment Test</h1>
        <p>This test is separate from the bulk catalogue. It only checks GitHub → Cloudflare → live app → Convex.</p>
        <ol>
          {TEST.map((p) => <li key={p.name}>{p.name}</li>)}
        </ol>
        <button onClick={uploadFive} disabled={running} style={{ padding: '12px 18px', border: 0, borderRadius: 10, fontWeight: 700 }}>
          {running ? 'Uploading…' : 'Upload These 5'}
        </button>
        <p style={{ marginTop: 18, fontWeight: 600 }}>{status}</p>
      </section>
    </main>
  )
}
