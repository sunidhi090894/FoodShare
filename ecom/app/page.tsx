import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ArrowRight, Leaf, Users, TrendingUp, Zap, MapPin, Shield } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
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
      <section className="flex-1 px-4 py-20 sm:py-32 bg-gradient-to-b from-background via-background to-muted/30">
        <div className="max-w-5xl mx-auto text-center space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl sm:text-6xl font-bold text-foreground text-balance">
              Reduce Food Waste, Feed Communities
            </h1>
            <p className="text-lg sm:text-xl text-foreground/70 max-w-2xl mx-auto text-balance">
              Connect surplus food from restaurants, grocers, and retailers directly with nonprofits, schools, and families who need it. Real-time matching. Zero waste.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup?role=donor">
              <Button size="lg" className="w-full sm:w-auto">
                I Have Surplus Food <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
            <Link href="/signup?role=recipient">
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                I Need Food
              </Button>
            </Link>
          </div>
          <div className="pt-8">
            <img src="/food-donation-logistics-network.jpg" alt="FoodShare Network" className="rounded-lg border border-border shadow-lg" />
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="px-4 py-20 max-w-7xl mx-auto w-full">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-foreground mb-4">How It Works</h2>
          <p className="text-foreground/70 max-w-2xl mx-auto">Simple, efficient, and impactful</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { icon: Zap, title: "Post Surplus", desc: "Donors instantly report available surplus food with details and location" },
            { icon: Users, title: "AI Matching", desc: "Our algorithm matches surplus with nearby recipients and volunteers" },
            { icon: MapPin, title: "Logistics", desc: "Optimize routes and coordinate pickup/delivery in real-time" }
          ].map((item, idx) => (
            <Card key={idx} className="p-6 border border-border hover:shadow-lg transition">
              <item.icon className="w-10 h-10 text-primary mb-4" />
              <h3 className="font-bold text-lg text-foreground mb-2">{item.title}</h3>
              <p className="text-foreground/70">{item.desc}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Features Grid */}
      <section className="px-4 py-20 bg-muted/50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-foreground mb-12 text-center">Features Built for Impact</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: TrendingUp, title: "Impact Dashboard", desc: "Track meals served, waste prevented, and carbon saved" },
              { icon: Shield, title: "Secure & Compliant", desc: "HACCP aligned, audit trails, and liability protection" },
              { icon: Users, title: "Community Network", desc: "Connect with donors, recipients, and volunteers" },
              { icon: Zap, title: "Real-time Updates", desc: "Live notifications for matches and delivery updates" },
              { icon: MapPin, title: "Smart Routing", desc: "Optimized logistics to minimize time and emissions" },
              { icon: Leaf, title: "Sustainability Focus", desc: "Detailed metrics on environmental impact reduction" }
            ].map((item, idx) => (
              <Card key={idx} className="p-6 border border-border">
                <item.icon className="w-8 h-8 text-accent mb-3" />
                <h3 className="font-semibold text-foreground mb-2">{item.title}</h3>
                <p className="text-sm text-foreground/70">{item.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Role Cards */}
      <section className="px-4 py-20 max-w-7xl mx-auto w-full">
        <h2 className="text-3xl font-bold text-foreground mb-12 text-center">For Every Role</h2>
        <div className="grid md:grid-cols-2 gap-8">
          {[
            { title: "Donors", desc: "Restaurants, grocers, and retailers", points: ["Quick surplus posting", "Real-time matches", "Impact tracking", "Volunteer coordination"] },
            { title: "Recipients", desc: "Nonprofits, schools, and families", points: ["Browse available surplus", "Request deliveries", "Schedule pickups", "Impact metrics"] },
            { title: "Volunteers", desc: "Community members", points: ["Flexible pickup routes", "Real-time tracking", "Community impact", "Contribution history"] },
            { title: "Admins", desc: "System coordinators", points: ["Network management", "Analytics & reports", "User management", "Quality assurance"] }
          ].map((role, idx) => (
            <Card key={idx} className="p-8 border border-border">
              <h3 className="text-2xl font-bold text-primary mb-2">{role.title}</h3>
              <p className="text-foreground/70 mb-6">{role.desc}</p>
              <ul className="space-y-2">
                {role.points.map((point, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <Leaf className="w-4 h-4 text-accent mt-1 flex-shrink-0" />
                    <span className="text-foreground/80">{point}</span>
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      </section>

      {/* Impact Stats */}
      <section className="px-4 py-20 bg-primary text-primary-foreground">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-12">Global Impact</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { stat: "5M+", label: "Meals Shared" },
              { stat: "2K+", label: "Organizations" },
              { stat: "50K+", label: "Volunteers Active" }
            ].map((item, idx) => (
              <div key={idx}>
                <div className="text-4xl font-bold">{item.stat}</div>
                <div className="text-primary-foreground/80">{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 py-20 max-w-7xl mx-auto w-full text-center">
        <h2 className="text-3xl font-bold text-foreground mb-6">Ready to Make an Impact?</h2>
        <p className="text-foreground/70 mb-8 max-w-2xl mx-auto">Join thousands of organizations and volunteers reducing food waste and building a more equitable food system.</p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/signup">
            <Button size="lg" className="w-full sm:w-auto">
              Start Today
            </Button>
          </Link>
          <a href="https://learn.foodshare.org" target="_blank" rel="noopener noreferrer">
            <Button size="lg" variant="outline" className="w-full sm:w-auto">
              Learn More
            </Button>
          </a>
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
