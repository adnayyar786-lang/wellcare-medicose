import { useMemo, useState } from 'react'
import { useMutation, usePaginatedQuery, useQuery } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatINR } from './format'

export function ShopsPanel() {
 const shops = useQuery(api.shops.list, {})
 const [shopId,setShopId] = useState<string>('')
 const [name,setName] = useState('')
 const [address,setAddress] = useState('')
 const [staff,setStaff] = useState('Rao Sahab, Shahnawaz')
 const [medicineId,setMedicineId] = useState('')
 const [qty,setQty] = useState('1')
 const [seller,setSeller] = useState('Rao Sahab')
 const [payment,setPayment] = useState<'cash'|'upi'|'card'|'other'>('cash')
 const today = new Date().toLocaleDateString('en-CA')
 const [day,setDay] = useState(today)
 const medicines = usePaginatedQuery(api.medicines.listAll, {}, {initialNumItems:100})
 const addShop = useMutation(api.shops.create)
 const staffRows = useQuery(api.staff.listAllStaff, {})
 const requests = useQuery(api.staff.listRequests, {})
 const addStaff = useMutation(api.staff.adminAddStaff)
 const approveStaff = useMutation(api.staff.approveRequest)
 const rejectStaff = useMutation(api.staff.rejectRequest)
 const setStaffActive = useMutation(api.staff.setActive)
 const addSale = useMutation(api.shops.addSale)
 const setPack = useMutation(api.shops.setPackSize)
 const activeShop = shops?.find(s=>s._id===shopId) ?? shops?.[0]
 const sales = useQuery(api.shops.daySales, activeShop ? {shopId:activeShop._id,saleDay:day} : 'skip')
 const selectedMedicine = medicines.results.find(m=>m._id===medicineId)
 const total = useMemo(()=>sales?.reduce((sum,s)=>sum+s.lineTotal,0) ?? 0,[sales])
 const exportCsv = () => {
  if(!sales) return
  const rows=[['Date','Shop','Medicine','Tablets sold','Tablets/pack','Pack price','Per tablet','Line total','Staff','Payment'],...sales.map(s=>[s.saleDay,activeShop?.name??'',s.medicineName,s.quantityTablets,s.tabletsPerPack,s.packPrice.toFixed(2),s.unitPrice.toFixed(2),s.lineTotal.toFixed(2),s.staffName,s.paymentMethod]),['','','TOTAL','','','','',total.toFixed(2),'','']]
  const csv=rows.map(r=>r.map(v=>'"'+String(v).replaceAll('"','""')+'"').join(',')).join('\r\n')
  const blob=new Blob([csv],{type:'text/csv;charset=utf-8;'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download=`wellcare-${activeShop?.name??'shop'}-${day}.csv`; a.click(); URL.revokeObjectURL(url)
 }
 return <div className="space-y-6">
  <section className="rounded-xl border border-primary/20 bg-primary/[0.03] p-5 shadow-sm">
   <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-lg font-semibold">Staff Access Control</h2><p className="text-sm text-muted-foreground">Only the admin can add, approve, disable or re-enable staff Gmail accounts.</p></div><span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">Admin only</span></div>
   <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_1fr_auto_auto]">
    <Input placeholder="Staff Gmail" value={staffEmail} onChange={e=>setStaffEmail(e.target.value)}/>
    <Input placeholder="Staff name" value={staffName} onChange={e=>setStaffName(e.target.value)}/>
    <select className="rounded-md border bg-background px-3 py-2 text-sm" value={staffRole} onChange={e=>setStaffRole(e.target.value as typeof staffRole)}><option value="staff">Staff</option><option value="manager">Manager</option><option value="billing">Billing</option><option value="inventory">Inventory</option></select>
    <Button disabled={!staffEmail.trim()||!staffName.trim()} onClick={()=>void addStaff({email:staffEmail,name:staffName,role:staffRole}).then(()=>{setStaffEmail('');setStaffName('')})}>Add & enable</Button>
   </div>
   {requests?.length ? <div className="mt-5"><h3 className="font-semibold">Pending verification requests</h3><div className="mt-2 space-y-2">{requests.map(r=><div key={r._id} className="flex flex-wrap items-center gap-2 rounded-lg border bg-card p-3"><div className="min-w-0 flex-1"><p className="font-medium">{r.name}</p><p className="truncate text-xs text-muted-foreground">{r.email}</p></div><select className="rounded-md border bg-background px-2 py-1 text-xs" defaultValue="staff" id={`role-${r._id}`}><option value="staff">Staff</option><option value="manager">Manager</option><option value="billing">Billing</option><option value="inventory">Inventory</option></select><Button size="sm" onClick={()=>{const role=(document.getElementById(`role-${r._id}`) as HTMLSelectElement)?.value as 'staff'|'manager'|'billing'|'inventory';void approveStaff({id:r._id,role})}}>Approve</Button><Button size="sm" variant="outline" onClick={()=>void rejectStaff({id:r._id})}>Reject</Button></div>)}</div></div> : <p className="mt-5 text-sm text-muted-foreground">No pending staff verification requests.</p>}
   <div className="mt-5"><h3 className="font-semibold">Active staff</h3><div className="mt-2 divide-y rounded-lg border">{staffRows?.map(s=><div key={s._id} className="flex flex-wrap items-center gap-3 p-3"><div className="min-w-0 flex-1"><p className="font-medium">{s.name} <span className="ml-1 text-xs text-muted-foreground">({s.role})</span></p><p className="truncate text-xs text-muted-foreground">{s.email}</p></div><Button size="sm" variant={s.active?'outline':'default'} onClick={()=>void setStaffActive({id:s._id,active:!s.active})}>{s.active?'Disable':'Enable'}</Button></div>)}</div></div>
  </section>
  <section className="rounded-xl border bg-card p-5"><h2 className="text-lg font-semibold">Shops / Branches</h2><p className="mb-4 text-sm text-muted-foreground">Add branches here; each branch keeps its own retail sales log.</p>
   <div className="mb-4 grid gap-2 sm:grid-cols-3"><Input placeholder="Shop name" value={name} onChange={e=>setName(e.target.value)}/><Input placeholder="Full address" value={address} onChange={e=>setAddress(e.target.value)}/><Input placeholder="Staff names, comma-separated" value={staff} onChange={e=>setStaff(e.target.value)}/></div>
   <Button onClick={()=>{if(name.trim()&&address.trim()) void addShop({name,address,staffNames:staff.split(',').map(s=>s.trim()).filter(Boolean)}).then(id=>{setShopId(id);setName('');setAddress('')})}}>Add shop</Button>
   <div className="mt-4 flex flex-wrap gap-2">{shops?.map(s=><Button key={s._id} variant={(activeShop?._id===s._id)?'default':'outline'} onClick={()=>setShopId(s._id)}>{s.name}</Button>)}</div>
   {activeShop&&<p className="mt-2 text-sm text-muted-foreground">{activeShop.address} · Staff: {activeShop.staffNames.join(', ')}</p>}
  </section>
  <section className="rounded-xl border bg-card p-5"><h2 className="text-lg font-semibold">Record a walk-in sale</h2><p className="mb-4 text-sm text-muted-foreground">Catalog price is treated as the pack/strip price. Configure tablet count before recording a sale.</p>
   <div className="grid gap-3 md:grid-cols-2"><label className="text-sm">Medicine<select className="mt-1 w-full rounded-md border bg-background p-2" value={medicineId} onChange={e=>setMedicineId(e.target.value)}><option value="">Select medicine</option>{medicines.results.map(m=><option key={m._id} value={m._id}>{m.name} — {formatINR(m.price)} / pack</option>)}</select></label>
   <label className="text-sm">Tablets in each pack<input className="mt-1 w-full rounded-md border bg-background p-2" type="number" min="1" defaultValue={selectedMedicine?.tabletsPerPack??''} key={`${medicineId}-${selectedMedicine?.tabletsPerPack??''}`} onBlur={e=>{const n=Number(e.target.value);if(selectedMedicine&&Number.isInteger(n)&&n>0) void setPack({medicineId:selectedMedicine._id,tabletsPerPack:n})}} placeholder="Set and leave field to save"/></label>
   <label className="text-sm">Quantity sold (tablets)<Input type="number" min="1" step="1" value={qty} onChange={e=>setQty(e.target.value)}/></label><label className="text-sm">Sold by<select className="mt-1 w-full rounded-md border bg-background p-2" value={seller} onChange={e=>setSeller(e.target.value)}>{(activeShop?.staffNames??['Rao Sahab','Shahnawaz']).map(s=><option key={s}>{s}</option>)}</select></label>
   <label className="text-sm">Payment<select className="mt-1 w-full rounded-md border bg-background p-2" value={payment} onChange={e=>setPayment(e.target.value as typeof payment)}><option value="cash">Cash</option><option value="upi">UPI</option><option value="card">Card</option><option value="other">Other</option></select></label></div>
   {selectedMedicine&&<p className="mt-3 text-sm">Rate per tablet: <b>{selectedMedicine.tabletsPerPack?formatINR(selectedMedicine.price/selectedMedicine.tabletsPerPack):'Set pack count first'}</b> · Estimated total: <b>{selectedMedicine.tabletsPerPack&&Number(qty)>0?formatINR(selectedMedicine.price/selectedMedicine.tabletsPerPack*Number(qty)):'—'}</b></p>}
   <Button className="mt-4" disabled={!activeShop||!selectedMedicine||!selectedMedicine.tabletsPerPack||!Number.isInteger(Number(qty))||Number(qty)<=0||!seller.trim()} onClick={()=>void addSale({shopId:activeShop!._id,medicineId:selectedMedicine!._id,quantityTablets:Number(qty),staffName:seller,paymentMethod:payment}).then(()=>setQty('1'))}>Save sale</Button>
  </section>
  <section className="rounded-xl border bg-card p-5"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-lg font-semibold">Daily sales report</h2><p className="text-sm text-muted-foreground">{activeShop?.name??'Choose a shop'} · Total: <b>{formatINR(total)}</b></p></div><div className="flex gap-2"><Input type="date" value={day} onChange={e=>setDay(e.target.value)}/><Button variant="outline" disabled={!sales?.length} onClick={exportCsv}>Export CSV / Excel</Button></div></div>
   <div className="mt-4 overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr className="border-b text-muted-foreground"><th className="p-2">Time</th><th className="p-2">Medicine</th><th className="p-2">Tablets</th><th className="p-2">Rate/tablet</th><th className="p-2">Amount</th><th className="p-2">Staff</th><th className="p-2">Payment</th></tr></thead><tbody>{sales?.map(s=><tr className="border-b" key={s._id}><td className="p-2">{new Date(s.soldAt).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'})}</td><td className="p-2">{s.medicineName}</td><td className="p-2">{s.quantityTablets}</td><td className="p-2">{formatINR(s.unitPrice)}</td><td className="p-2">{formatINR(s.lineTotal)}</td><td className="p-2">{s.staffName}</td><td className="p-2">{s.paymentMethod.toUpperCase()}</td></tr>)}</tbody></table>{sales?.length===0&&<p className="py-8 text-center text-sm text-muted-foreground">No sales recorded for this date.</p>}</div>
  </section>
  <p className="text-xs text-muted-foreground">Sales are saved to the database. CSV export is available in this screen. Automated Gmail delivery and distinct staff credentials still need server-side email configuration and an account/role provisioning flow.</p>
 </div>
}
