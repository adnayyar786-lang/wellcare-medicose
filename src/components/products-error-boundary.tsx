import { Component, type ReactNode } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'

export class ProductsErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-border bg-secondary/30 px-4 py-10 text-center">
          <AlertTriangle className="size-6 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Something went wrong while loading products.</p>
          <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      )
    }
    return this.props.children
  }
}
