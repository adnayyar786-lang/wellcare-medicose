import { createFileRoute } from '@tanstack/react-router'
import { StaffApp } from '@/components/staff/staff-app'
export const Route = createFileRoute('/staff')({ head:()=>({meta:[{title:'Staff Portal — Wellcare Medicose'}]}), component:StaffApp })
