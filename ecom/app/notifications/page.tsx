'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Bell, Check, Clock, AlertCircle, LogOut, ArrowLeft, Filter } from 'lucide-react'

interface Notification {
  _id: string
  type: 'match' | 'delivery' | 'alert' | 'update'
  message: string
  createdAt: string
  read: boolean
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      _id: '1',
      type: 'match',
      message: 'Matched with Community Kitchen for 20 servings of vegetables',
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      read: false
    },
    {
      _id: '2',
      type: 'delivery',
      message: 'Volunteer James is on the way for pickup',
      createdAt: new Date(Date.now() - 7200000).toISOString(),
      read: false
    },
    {
      _id: '3',
      type: 'update',
      message: 'Your surplus offer has been completed',
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      read: true
    }
  ])
  const [filter, setFilter] = useState('all')

  const filteredNotifications = filter === 'all' ? notifications : notifications.filter(n => n.type === filter)
  const unreadCount = notifications.filter(n => !n.read).length

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => n._id === id ? { ...n, read: true } : n)
    )
  }

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n._id !== id))
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'match':
        return <Check className="w-5 h-5 text-green-600" />
      case 'delivery':
        return <Clock className="w-5 h-5 text-blue-600" />
      case 'alert':
        return <AlertCircle className="w-5 h-5 text-orange-600" />
      default:
        return <Bell className="w-5 h-5 text-purple-600" />
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-background p-6 flex items-center justify-between">
        <Link href="/donor" className="flex items-center gap-2 text-primary hover:text-primary/80">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">Notifications</h1>
          {unreadCount > 0 && (
            <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">{unreadCount}</span>
          )}
        </div>
        <div className="w-16"></div>
      </header>

      <main className="max-w-2xl mx-auto p-8">
        {/* Controls */}
        <div className="flex gap-4 mb-8">
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              onClick={() => setFilter('all')}
              size="sm"
            >
              All
            </Button>
            <Button
              variant={filter === 'match' ? 'default' : 'outline'}
              onClick={() => setFilter('match')}
              size="sm"
            >
              Matches
            </Button>
            <Button
              variant={filter === 'delivery' ? 'default' : 'outline'}
              onClick={() => setFilter('delivery')}
              size="sm"
            >
              Deliveries
            </Button>
            <Button
              variant={filter === 'update' ? 'default' : 'outline'}
              onClick={() => setFilter('update')}
              size="sm"
            >
              Updates
            </Button>
          </div>
          {unreadCount > 0 && (
            <Button
              onClick={markAllAsRead}
              variant="outline"
              size="sm"
              className="ml-auto"
            >
              Mark All Read
            </Button>
          )}
        </div>

        {/* Notifications List */}
        <div className="space-y-4">
          {filteredNotifications.length === 0 ? (
            <Card className="p-12 text-center border border-border">
              <Bell className="w-12 h-12 text-foreground/30 mx-auto mb-4" />
              <p className="text-foreground/70">No notifications</p>
            </Card>
          ) : (
            filteredNotifications.map(notification => (
              <Card
                key={notification._id}
                className={`p-6 border border-border cursor-pointer transition hover:shadow-lg ${
                  !notification.read ? 'bg-primary/5' : ''
                }`}
                onClick={() => markAsRead(notification._id)}
              >
                <div className="flex items-start gap-4">
                  {getIcon(notification.type)}
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{notification.message}</p>
                    <p className="text-xs text-foreground/60 mt-1">
                      {new Date(notification.createdAt).toLocaleDateString()} at{' '}
                      {new Date(notification.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  {!notification.read && (
                    <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-2" />
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteNotification(notification._id)
                    }}
                    className="text-foreground/40 hover:text-foreground/70 text-sm"
                  >
                    ×
                  </button>
                </div>
              </Card>
            ))
          )}
        </div>
      </main>
    </div>
  )
}
