'use client'

import { useEffect, useState } from 'react'
import { Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

interface NotificationItem {
  id: string
  title: string
  message: string
  isRead: boolean
  createdAt: string
}

export function NotificationBell() {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [loading, setLoading] = useState(false)
  const [userLoaded, setUserLoaded] = useState(false)
  const unreadCount = notifications.filter((n) => !n.isRead).length

  useEffect(() => {
    // Check if user is authenticated
    const checkUser = async () => {
      try {
        const res = await fetch('/api/users/me')
        setUserLoaded(res.ok)
      } catch {
        setUserLoaded(false)
      }
    }
    checkUser()
  }, [])

  const loadNotifications = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/notifications')
      if (!res.ok) {
        throw new Error('Failed to load notifications')
      }
      const data = await res.json()
      setNotifications(data)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (open && userLoaded) {
      loadNotifications()
    }
  }, [open, userLoaded])

  const markAllRead = async () => {
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })
    loadNotifications()
  }

  return (
    <div className="relative">
      <Button variant="ghost" size="icon" onClick={() => setOpen((prev) => !prev)} disabled={!userLoaded}>
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 text-[10px] bg-destructive text-white rounded-full px-1">
            {unreadCount}
          </span>
        )}
      </Button>
      {open && userLoaded && (
        <Card className="absolute right-0 mt-2 w-80 border border-border p-3 z-50 bg-card">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold">Notifications</p>
            <button className="text-xs text-primary" onClick={markAllRead}>
              Mark all read
            </button>
          </div>
          {loading ? (
            <p className="text-xs text-muted-foreground">Loading...</p>
          ) : notifications.length === 0 ? (
            <p className="text-xs text-muted-foreground">No notifications yet.</p>
          ) : (
            <ul className="space-y-2 max-h-64 overflow-y-auto">
              {notifications.map((notification) => (
                <li key={notification.id} className="text-sm">
                  <p className="font-semibold text-foreground">{notification.title}</p>
                  <p className="text-muted-foreground text-xs">{notification.message}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {new Date(notification.createdAt).toLocaleString()}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}
    </div>
  )
}
