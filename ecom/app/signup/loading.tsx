import { Card } from '@/components/ui/card'

export default function SignupLoading() {
  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <p className="text-sm font-medium text-foreground">I'm a:</p>
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3].map(i => (
            <div
              key={i}
              className="p-3 rounded-lg border-2 border-border bg-muted/50 h-16 animate-pulse"
            />
          ))}
        </div>
      </div>

      <Card className="p-6 border border-border">
        <div className="space-y-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="space-y-2">
              <div className="h-4 w-20 bg-muted rounded animate-pulse" />
              <div className="h-10 bg-muted rounded animate-pulse" />
            </div>
          ))}
          <div className="h-10 bg-muted rounded animate-pulse" />
        </div>
      </Card>
    </div>
  )
}
