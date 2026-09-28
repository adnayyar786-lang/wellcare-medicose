import { createFileRoute } from '@tanstack/react-router'

import { AdminApp } from '@/components/admin/admin-app'
import siteMetadata from '../metadata.json'

export const Route = createFileRoute('/admin')({
  head: () => ({
    meta: [
      { title: siteMetadata['/admin'].title },
      { name: 'description', content: siteMetadata['/admin'].description },
    ],
  }),
  component: () => <AdminApp adminEmail={null} />,
})
