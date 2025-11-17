import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ArrowRight, Leaf, Users, TrendingUp, Zap, MapPin, Shield } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Navigation */}
  <nav className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Leaf className="w-8 h-8 text-primary" />
            <span className="font-bold text-xl text-foreground">FoodShare</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-foreground/70 hover:text-foreground transition">Sign In</Link>
            <Link href="/signup">
              <Button variant="default">Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
  <section className="flex-1 px-4 py-20 sm:py-32 bg-linear-to-b from-background via-background to-muted/30">
        <div className="max-w-5xl mx-auto text-center space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl sm:text-6xl font-bold text-foreground text-balance">
              Reduce Food Waste, Feed Communities
            </h1>
            <p className="text-lg sm:text-xl text-foreground/70 max-w-2xl mx-auto text-balance">
              Connect surplus food from restaurants, grocers, and retailers directly with nonprofits, schools, and families who need it. Real-time matching. Zero waste.
            </p>
          </div>
          {/* Buttons removed per request */}
          <div className="pt-8">
            <img src="/food-donation-logistics-network.jpg" alt="FoodShare Network" className="rounded-lg border border-border shadow-lg" />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-muted/30 px-4 py-12">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Leaf className="w-6 h-6 text-primary" />
                <span className="font-bold text-foreground">FoodShare</span>
              </div>
              <p className="text-foreground/70 text-sm">Reducing food waste, one connection at a time.</p>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-foreground/70">
                <li><a href="#" className="hover:text-foreground">Features</a></li>
                <li><a href="#" className="hover:text-foreground">Pricing</a></li>
                <li><a href="#" className="hover:text-foreground">FAQ</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-foreground/70">
                <li><a href="#" className="hover:text-foreground">About</a></li>
                <li><a href="#" className="hover:text-foreground">Blog</a></li>
                <li><a href="#" className="hover:text-foreground">Careers</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-foreground/70">
                <li><a href="#" className="hover:text-foreground">Privacy</a></li>
                <li><a href="#" className="hover:text-foreground">Terms</a></li>
                <li><a href="#" className="hover:text-foreground">Contact</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border pt-8 text-center text-sm text-foreground/70">
            <p>&copy; 2025 FoodShare. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
