import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useMemo, useState } from 'react'
import { useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
import petSeed from '../../scripts/pet-catalog-seed.json'

const HUMAN = [["Dabur Honitus Honey-Based Ayurvedic Cough Syrup 100 ml","Dabur","Syrup",100,121],["Hamdard Joshina Herbal Cough & Cold Syrup 200 ml","Hamdard","Syrup",135,140],["Dabur Honitus Adulsa Cough Syrup 100 ml","Dabur","Syrup",82.8,92],["Hamdard Joshina Herbal Cough & Cold Syrup 100 ml","Hamdard","Syrup",73.1,78],["SBL Stobal Cough Syrup 180 ml","SBL","Syrup",169,178],["Pravek Coughkalp Syrup 100 ml","Pravek","Syrup",108,108],["Benadryl DR Syrup 100 ml","Benadryl","Syrup",135,138],["Dabur Honitus Honey-Based Ayurvedic Cough Syrup 200 ml","Dabur","Syrup",200,235],["SBL Stobal Cough Syrup 500 ml","SBL","Syrup",244,309],["Zandu Ayurvedic Cough Syrup 100 ml","Zandu","Syrup",103,117],["Pravek Coughkalp Syrup 200 ml","Pravek","Syrup",181,190],["Sri Sri Tattva Kasahari Cough Syrup 100 ml","Sri Sri Tattva","Syrup",106,120],["Dabur Broncorid Syrup 200 ml","Dabur","Syrup",162,190],["Mucolite Syrup 100 ml","Mucolite","Syrup",133,141],["Himalaya Koflet Cough Syrup 100 ml","Himalaya","Syrup",108,117],["Mucolite Tablet 10 tablets","Mucolite","Tablet",57.7,60.1],["Kofol SF Cough Syrup 100 ml","Charak","Syrup",93.5,110],["Multani Kuka Cough Syrup 100 ml","Multani","Syrup",99.7,111],["SBL Stobal Cough Syrup Sugar Free 180 ml","SBL","Syrup",173,188],["Dhootapapeshwar Balchaturbhadrika Syrup 100 ml","Dhootapapeshwar","Syrup",151,175],["Dr. Reckeweg R8 Jut-U-Sin Cough Syrup 150 ml","Dr. Reckeweg","Syrup",600,600],["Charak Kofol Ayurvedic Syrup 200 ml","Charak","Syrup",150,177],["Baidyanath Kasamrit Herbal Cough Syrup 200 ml","Baidyanath","Syrup",146,206],["Yogi Adulsa Cough Syrup 100 ml","Yogi","Syrup",98.4,98.4],["Himalaya Tulasi Syrup 200 ml","Himalaya","Syrup",145,170],["Bakson's Kof Aid Plus Cough Syrup 450 ml","Bakson's","Syrup",208,260],["Medisynth Kofeez Cough Syrup 120 ml","Medisynth","Syrup",115,115],["Tejasya Cough Syrup 100 ml","Tata 1mg","Syrup",73,103],["Tejasya Cough Syrup 200 ml","Tata 1mg","Syrup",135,182],["Dr Willmar Schwabe India Tussistin Plus Cough Syrup 100 ml","Dr Willmar Schwabe India","Syrup",100,120],["Ambrolite Syrup 100 ml","Ambrolite","Syrup",92,99.8],["Pankajakasthuri Cough Syrup Tulsi 100 ml","Pankajakasthuri","Syrup",75,75],["Adven Justin Cough Syrup 180 ml","Adven","Syrup",177,200],["Dr Willmar Schwabe India Tussistin Syrup 100 ml","Dr Willmar Schwabe India","Syrup",95.5,115],["Bakson's Kof Aid Cough Syrup 450 ml","Bakson's","Syrup",207,260],["Dabur Honitus Honey-Based Ayurvedic Cough Syrup 200 ml","Dabur","Syrup",204,235],["Aushadhi Honykof Cough Syrup 200 ml","Aushadhi","Syrup",133,140],["Dabur Honitus Adulsa Cough Syrup 100 ml","Dabur","Syrup",89.1,99],["Neurobion Forte Tablet 30","Merck","Tablet",47.5,47.5],["Zincovit Tablet 15","Apex Laboratories","Tablet",99.3,108],["Shelcal 500 Tablet 15","Torrent","Tablet",150,163],["Evion 400mg Capsule 20","Merck","Capsule",78.7,98.5],["Becosules Z Capsule 20","Pfizer","Capsule",64.1,69.2],["Electral Powder 4.4 gm","FDC","Powder",4.6,4.7],["Supradyn Daily Multivitamin Tablet 15","Bayer","Tablet",75,75],["Depura 60000 IU Vitamin D3 Oral Solution 5 ml","Zydus","Oral Solution",100,117],["Dolo 650 Tablet 15","Micro Labs","Tablet",29,32.28],["Dolo 650 Tablet 10","Micro Labs","Tablet",19.5,21.52]] as const
const CHUNK = 50

export const Route = createFileRoute('/catalog-import')({ component: CatalogImport })

function CatalogImport() {
  const seed = useMutation(api.medicines.seedManyV2)
  const [done,setDone]=useState(0)
  const [status,setStatus]=useState('Preparing catalogue…')
  const items = useMemo(() => [
    ...HUMAN.map(([name,manufacturer,category,price,mrpPrice]) => ({name,manufacturer,category,shopCategory:'Medicines (Branded)',description:`${name}. Product information and pack size should be verified against the physical pack before sale.`,price,mrpPrice,stock:20,requiresPrescription:false})),
    ...petSeed.map(([name,price]) => ({name,manufacturer:name.split(' ')[0],category:name.toLowerCase().includes('food')?'Pet Food':name.toLowerCase().includes('shampoo')?'Shampoo':'Pet Care',shopCategory:'Pet Care',description:`${name}. Pet-care product; verify species, age, weight and pack instructions before use.`,price,mrpPrice:Math.round(price*1.08*100)/100,stock:20,requiresPrescription:false}))
  ], [])
  useEffect(()=>{
    let cancelled=false
    ;(async()=>{
      try {
        for(let i=0;i<items.length;i+=CHUNK){
          if(cancelled) return
          const n=await seed({items:items.slice(i,i+CHUNK)})
          setDone(Math.min(i+CHUNK,items.length))
          setStatus(`Imported batch: ${Math.min(i+CHUNK,items.length)}/${items.length} (new rows: ${n})`)
        }
        setStatus(`Catalogue import complete: ${items.length} listings processed.`)
      } catch(e){ setStatus(e instanceof Error?e.message:'Import failed') }
    })()
    return ()=>{cancelled=true}
  },[items,seed])
  return <main style={{padding:24,fontFamily:'system-ui'}}><h1>Wellcare catalogue import</h1><p>{status}</p><p>Processed {done} / {items.length}</p></main>
}
