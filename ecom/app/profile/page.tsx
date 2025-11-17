'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { User, Mail, Phone, MapPin, Building2, LogOut, ArrowLeft, Camera } from 'lucide-react'

export default function ProfilePage() {
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    name: 'John Doe',
    email: 'john@restaurant.com',
    phone: '(555) 123-4567',
    address: '123 Main Street, New York, NY',
    organization: 'Fresh Market Downtown',
    bio: 'Community-focused restaurant committed to reducing food waste'
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const handleSave = async () => {
    // In production, save to API
    setIsEditing(false)
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-background p-6 flex items-center justify-between">
        <Link href="/donor" className="flex items-center gap-2 text-primary hover:text-primary/80">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>
        <h1 className="text-2xl font-bold">Profile</h1>
        <div className="w-16"></div>
      </header>

      <main className="max-w-2xl mx-auto p-8">
        {/* Profile Header */}
        <Card className="p-8 border border-border mb-8">
          <div className="flex items-start gap-6 mb-8">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="w-12 h-12 text-primary" />
              </div>
              <button className="absolute bottom-0 right-0 p-2 bg-primary text-white rounded-full hover:bg-primary/90">
                <Camera className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1">
              <h2 className="text-3xl font-bold text-foreground mb-2">{formData.name}</h2>
              <p className="text-foreground/70">{formData.organization}</p>
              <div className="mt-4 flex gap-2">
                <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-sm font-semibold">Verified Donor</span>
                <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-sm font-semibold">Active</span>
              </div>
            </div>
          </div>

          {!isEditing && (
            <Button onClick={() => setIsEditing(true)} className="w-full">
              Edit Profile
            </Button>
          )}
        </Card>

        {/* Profile Information */}
        <Card className="p-8 border border-border mb-8">
          <h3 className="text-xl font-bold mb-6">Contact Information</h3>
          
          {isEditing ? (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Full Name</label>
                <Input
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Your name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <Input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="your@email.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Phone</label>
                <Input
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="(555) 123-4567"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Address</label>
                <Input
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Your address"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Organization</label>
                <Input
                  name="organization"
                  value={formData.organization}
                  onChange={handleChange}
                  placeholder="Your organization"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Bio</label>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  placeholder="Tell us about yourself"
                  className="w-full border border-border rounded px-3 py-2 bg-background"
                  rows={4}
                />
              </div>
              <div className="flex gap-4">
                <Button onClick={handleSave} className="flex-1">Save Changes</Button>
                <Button onClick={() => setIsEditing(false)} variant="outline" className="flex-1">Cancel</Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3 pb-4 border-b border-border">
                <User className="w-5 h-5 text-foreground/40" />
                <div className="flex-1">
                  <p className="text-sm text-foreground/70">Name</p>
                  <p className="font-medium text-foreground">{formData.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 pb-4 border-b border-border">
                <Mail className="w-5 h-5 text-foreground/40" />
                <div className="flex-1">
                  <p className="text-sm text-foreground/70">Email</p>
                  <p className="font-medium text-foreground">{formData.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 pb-4 border-b border-border">
                <Phone className="w-5 h-5 text-foreground/40" />
                <div className="flex-1">
                  <p className="text-sm text-foreground/70">Phone</p>
                  <p className="font-medium text-foreground">{formData.phone}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 pb-4 border-b border-border">
                <MapPin className="w-5 h-5 text-foreground/40" />
                <div className="flex-1">
                  <p className="text-sm text-foreground/70">Address</p>
                  <p className="font-medium text-foreground">{formData.address}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Building2 className="w-5 h-5 text-foreground/40" />
                <div className="flex-1">
                  <p className="text-sm text-foreground/70">Organization</p>
                  <p className="font-medium text-foreground">{formData.organization}</p>
                </div>
              </div>
            </div>
          )}
        </Card>

        {/* Statistics */}
        <Card className="p-8 border border-border mb-8">
          <h3 className="text-xl font-bold mb-6">Your Statistics</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <p className="text-foreground/70 mb-2">Meals Shared</p>
              <p className="text-3xl font-bold text-primary">2,450</p>
              <p className="text-sm text-foreground/60 mt-1">↑ 12% this month</p>
            </div>
            <div>
              <p className="text-foreground/70 mb-2">Food Waste Reduced</p>
              <p className="text-3xl font-bold text-primary">342kg</p>
              <p className="text-sm text-foreground/60 mt-1">↑ 8% this month</p>
            </div>
            <div>
              <p className="text-foreground/70 mb-2">Active Matches</p>
              <p className="text-3xl font-bold text-accent">12</p>
              <p className="text-sm text-foreground/60 mt-1">Pending deliveries</p>
            </div>
            <div>
              <p className="text-foreground/70 mb-2">Community Impact</p>
              <p className="text-3xl font-bold text-primary">94%</p>
              <p className="text-sm text-foreground/60 mt-1">Success rate</p>
            </div>
          </div>
        </Card>

        {/* Actions */}
        <div className="flex gap-4">
          <Link href="/" className="flex-1">
            <Button variant="outline" className="w-full">Back to Home</Button>
          </Link>
          <Button variant="destructive" className="flex-1 flex items-center justify-center gap-2">
            <LogOut className="w-4 h-4" /> Sign Out
          </Button>
        </div>
      </main>
    </div>
  )
}
