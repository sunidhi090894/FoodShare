'use client'

import { useMemo, useState, useEffect } from 'react'
import {
  ClipboardCheck,
  CheckCircle2,
  Phone,
  Award,
  Calendar,
  Leaf,
  X,
  AlertCircle,
} from 'lucide-react'
import { useProtectedRoute } from '@/hooks/use-protected-route'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'

interface VolunteerProfile {
  name: string
  city: string
  vehicleType: string
  age: string
}

interface Assignment {
  _id: string
  surplusId: string
  donorOrg: string
  donorCity: string
  donorAddress: string
  donorContact: string
  items: string
  pickupWindow: string
  status: 'ASSIGNED' | 'ACCEPTED' | 'COMPLETED' | 'REJECTED'
  volunteerId?: string
  acceptedAt?: string
  completedAt?: string
  createdAt: string
}

const statusVariant: Record<string, 'secondary' | 'default' | 'success' | 'warning' | 'destructive'> = {
  ASSIGNED: 'secondary',
  ACCEPTED: 'default',
  COMPLETED: 'success',
  REJECTED: 'destructive',
}

export default function VolunteerPortal() {
  useProtectedRoute('VOLUNTEER')

  // Volunteer Profile State
  const [volunteerProfile, setVolunteerProfile] = useState<VolunteerProfile>({
    name: 'Anita Sharma',
    city: 'Mumbai',
    vehicleType: 'Two-wheeler',
    age: '28',
  })
  const [profileFormData, setProfileFormData] = useState<VolunteerProfile>(volunteerProfile)
  const [showProfileForm, setShowProfileForm] = useState(false)

  // Assignments State
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Load assignments from API
  useEffect(() => {
    const fetchAssignments = async () => {
      try {
        setLoading(true)
        const res = await fetch(
          `/api/volunteer-assignments?volunteerCity=${volunteerProfile.city}`
        )
        if (!res.ok) throw new Error('Failed to fetch assignments')
        const data = await res.json()
        setAssignments(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load assignments')
      } finally {
        setLoading(false)
      }
    }

    fetchAssignments()
    
    // Auto-refresh every 5 seconds to show real-time updates
    const interval = setInterval(fetchAssignments, 5000)
    
    return () => clearInterval(interval)
  }, [volunteerProfile.city])

  // Calculate metrics
  const acceptedTasksToday = assignments.filter((a) => a.status === 'ACCEPTED').length
  const completedTasks = assignments.filter((a) => a.status === 'COMPLETED').length
  const assignedTasks = assignments.filter((a) => a.status === 'ASSIGNED')
  const acceptedTasks = assignments.filter((a) => a.status === 'ACCEPTED')
  const completedTasksList = assignments.filter((a) => a.status === 'COMPLETED')

  const summaryCards = useMemo(
    () => [
      {
        label: 'Tasks Accepted Today',
        value: acceptedTasksToday.toString(),
        helper: 'Tasks you accepted',
        icon: ClipboardCheck,
      },
      {
        label: 'Tasks Completed',
        value: completedTasks.toString(),
        helper: 'All-time deliveries',
        icon: CheckCircle2,
      },
    ],
    [acceptedTasksToday, completedTasks]
  )

  const handleAcceptTask = async (assignmentId: string) => {
    try {
      const res = await fetch('/api/volunteer-assignments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assignmentId,
          status: 'ACCEPTED',
          volunteerId: 'current-volunteer-id',
        }),
      })

      if (!res.ok) throw new Error('Failed to accept task')

      setAssignments((prev) =>
        prev.map((a) =>
          a._id === assignmentId
            ? { ...a, status: 'ACCEPTED', acceptedAt: new Date().toISOString() }
            : a
        )
      )
      
      // Show success message
      alert('Task accepted! Check "Accepted Tasks" tab.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to accept task')
    }
  }

  const handleRejectTask = async (assignmentId: string) => {
    try {
      const res = await fetch('/api/volunteer-assignments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assignmentId,
          status: 'REJECTED',
        }),
      })

      if (!res.ok) throw new Error('Failed to reject task')

      setAssignments((prev) => prev.filter((a) => a._id !== assignmentId))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reject task')
    }
  }

  const handleCompleteDelivery = async (assignmentId: string) => {
    try {
      const res = await fetch('/api/volunteer-assignments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assignmentId,
          status: 'COMPLETED',
        }),
      })

      if (!res.ok) throw new Error('Failed to complete delivery')

      setAssignments((prev) =>
        prev.map((a) =>
          a._id === assignmentId
            ? { ...a, status: 'COMPLETED', completedAt: new Date().toISOString() }
            : a
        )
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to complete delivery')
    }
  }

  const handleSaveProfile = () => {
    setVolunteerProfile(profileFormData)
    setShowProfileForm(false)
  }

  const renderTaskCard = (assignment: Assignment, isAssigned: boolean) => (
    <Card key={assignment._id} className="border border-[#d9c7aa] bg-[#fffdf9] p-5 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-[#8c3b3c]">{assignment.surplusId}</p>
          <h3 className="text-lg font-semibold text-[#4a1f1f]">{assignment.items}</h3>
        </div>
        <Badge variant={statusVariant[assignment.status]}>{assignment.status}</Badge>
      </div>

      <div className="space-y-1">
        <p className="font-semibold text-[#4a1f1f]">Donor Organization</p>
        <p className="text-[#6b4d3c]">{assignment.donorOrg}</p>
        <p className="text-[#6b4d3c]">{assignment.donorAddress}</p>
        <p className="text-[#6b4d3c] flex items-center gap-2">
          <Phone className="w-4 h-4" />
          {assignment.donorContact}
        </p>
      </div>

      <div className="flex flex-wrap gap-3 text-sm text-[#6b4d3c]">
        <span className="flex items-center gap-1">
          <Calendar className="w-4 h-4" />
          {assignment.pickupWindow}
        </span>
      </div>

      <div className="flex flex-wrap gap-3">
        {isAssigned && (
          <>
            <Button
              className="bg-[#8c3b3c] hover:bg-[#732f30]"
              onClick={() => handleAcceptTask(assignment._id)}
            >
              Accept Task
            </Button>
            <Button
              variant="outline"
              className="border-red-600 text-red-600 hover:bg-red-50"
              onClick={() => handleRejectTask(assignment._id)}
            >
              Reject
            </Button>
          </>
        )}
        {!isAssigned && assignment.status === 'ACCEPTED' && (
          <Button
            className="bg-green-600 hover:bg-green-700"
            onClick={() => handleCompleteDelivery(assignment._id)}
          >
            Mark Delivered
          </Button>
        )}
      </div>
    </Card>
  )

  return (
    <div className="min-h-screen bg-[#f7f1e3] py-10 px-4">
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="space-y-2">
          <div className="flex items-start gap-3">
            <Leaf className="w-8 h-8 text-[#8c3b3c] shrink-0 mt-1" />
            <div className="text-center flex-1">
              <h1 className="text-4xl md:text-5xl font-bold text-[#4a1f1f]">
                Volunteer Dashboard
              </h1>
            </div>
          </div>
          <div className="text-center">
            <h2 className="text-lg md:text-xl text-[#4a1f1f]">
              Accept tasks, complete deliveries, and track your impact
            </h2>
            <p className="text-[#6b4d3c] max-w-3xl mx-auto mt-2">
              Tasks are matched to your city. Accept offers and mark them as delivered when complete.
            </p>
          </div>
        </header>

        {error && (
          <Card className="p-4 border border-red-200 bg-red-50 flex items-center gap-3 text-sm text-red-700">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </Card>
        )}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-2">
          {summaryCards.map((card) => {
            const Icon = card.icon
            return (
              <Card key={card.label} className="p-5 border border-[#d9c7aa] bg-white flex flex-col gap-2">
                <div className="flex items-center justify-between text-sm text-[#6b4d3c]">
                  {card.label}
                  <Icon className="w-4 h-4 text-[#8c3b3c]" />
                </div>
                <p className="text-3xl font-semibold text-[#4a1f1f]">{card.value}</p>
                <p className="text-sm text-[#6b4d3c]">{card.helper}</p>
              </Card>
            )
          })}
        </div>

        {/* Assigned to Me Tab */}
        <Card className="p-6 border border-[#d9c7aa] bg-white space-y-5">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-[#4a1f1f]">Assigned to Me</h2>
              <p className="text-sm text-[#6b4d3c]">Tasks waiting for your action.</p>
            </div>
          </div>

          {loading ? (
            <p className="text-center text-[#6b4d3c] py-8">Loading tasks...</p>
          ) : assignedTasks.length === 0 ? (
            <p className="text-center text-[#6b4d3c] py-8">No tasks assigned yet.</p>
          ) : (
            <div className="space-y-4">
              {assignedTasks.map((assignment) => renderTaskCard(assignment, true))}
            </div>
          )}
        </Card>

        {/* Accepted Tasks Tab */}
        {acceptedTasks.length > 0 && (
          <Card className="p-6 border border-[#d9c7aa] bg-white space-y-5">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-[#4a1f1f]">Accepted Tasks</h2>
                <p className="text-sm text-[#6b4d3c]">Tasks you've accepted. Mark as delivered when done.</p>
              </div>
            </div>

            <div className="space-y-4">
              {acceptedTasks.map((assignment) => renderTaskCard(assignment, false))}
            </div>
          </Card>
        )}

        {/* Completed Tasks Tab */}
        {completedTasksList.length > 0 && (
          <Card className="p-6 border border-[#d9c7aa] bg-white space-y-5">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-[#4a1f1f]">Tasks Completed</h2>
                <p className="text-sm text-[#6b4d3c]">All-time task completions ({completedTasksList.length} total)</p>
              </div>
            </div>

            <div className="space-y-4">
              {completedTasksList.map((assignment) => (
                <Card key={assignment._id} className="border border-[#d9c7aa] bg-[#f9f5f0] p-5 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-[#8c3b3c]">{assignment.surplusId}</p>
                      <h3 className="text-lg font-semibold text-[#4a1f1f]">{assignment.items}</h3>
                    </div>
                    <Badge variant="success">COMPLETED</Badge>
                  </div>

                  <div className="space-y-1">
                    <p className="font-semibold text-[#4a1f1f]">Donor Organization</p>
                    <p className="text-[#6b4d3c]">{assignment.donorOrg}</p>
                  </div>

                  <div className="flex flex-wrap gap-3 text-sm text-[#6b4d3c]">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {assignment.completedAt ? new Date(assignment.completedAt).toLocaleString() : 'Date not available'}
                    </span>
                  </div>
                </Card>
              ))}
            </div>
          </Card>
        )}

        {/* Volunteer Profile */}
        <Card className="p-6 border border-[#d9c7aa] bg-white space-y-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-[#4a1f1f]">Volunteer Profile</h2>
              <p className="text-sm text-[#6b4d3c]">Your details help us match you with the right deliveries.</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="border-[#8c3b3c] text-[#8c3b3c] hover:bg-[#f7ebe0]"
              onClick={() => setShowProfileForm(true)}
            >
              Edit Profile
            </Button>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <p className="text-sm text-[#6b4d3c]">Name</p>
              <p className="text-lg font-semibold text-[#4a1f1f]">{volunteerProfile.name}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-[#6b4d3c]">City</p>
              <p className="text-lg font-semibold text-[#4a1f1f]">{volunteerProfile.city}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-[#6b4d3c]">Vehicle Type</p>
              <p className="font-medium text-[#4a1f1f]">{volunteerProfile.vehicleType}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-[#6b4d3c]">Age</p>
              <p className="font-medium text-[#4a1f1f]">{volunteerProfile.age} years</p>
            </div>
          </div>
        </Card>

        {/* Volunteer Profile Form Modal */}
        {showProfileForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-md border border-[#d9c7aa] bg-white">
              <div className="p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-[#4a1f1f]">Edit Profile</h2>
                  <button
                    onClick={() => setShowProfileForm(false)}
                    className="text-[#6b4d3c] hover:text-[#4a1f1f]"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    handleSaveProfile()
                  }}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-sm font-medium text-[#4a1f1f] mb-1">
                      Name
                    </label>
                    <Input
                      type="text"
                      value={profileFormData.name}
                      onChange={(e) =>
                        setProfileFormData({ ...profileFormData, name: e.target.value })
                      }
                      className="border-[#d9c7aa] bg-[#faf8f4]"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#4a1f1f] mb-1">
                      City
                    </label>
                    <Input
                      type="text"
                      value={profileFormData.city}
                      onChange={(e) =>
                        setProfileFormData({ ...profileFormData, city: e.target.value })
                      }
                      className="border-[#d9c7aa] bg-[#faf8f4]"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#4a1f1f] mb-1">
                      Vehicle Type
                    </label>
                    <select
                      value={profileFormData.vehicleType}
                      onChange={(e) =>
                        setProfileFormData({ ...profileFormData, vehicleType: e.target.value })
                      }
                      className="w-full border border-[#d9c7aa] rounded px-3 py-2 bg-[#faf8f4]"
                      required
                    >
                      <option value="">Select vehicle type</option>
                      <option value="Two-wheeler">Two-wheeler</option>
                      <option value="Three-wheeler">Three-wheeler</option>
                      <option value="Car">Car</option>
                      <option value="Bike">Bike</option>
                      <option value="Bicycle">Bicycle</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#4a1f1f] mb-1">
                      Age
                    </label>
                    <Input
                      type="number"
                      value={profileFormData.age}
                      onChange={(e) =>
                        setProfileFormData({ ...profileFormData, age: e.target.value })
                      }
                      className="border-[#d9c7aa] bg-[#faf8f4]"
                      required
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1 border-[#d9c7aa] text-[#6b4d3c]"
                      onClick={() => setShowProfileForm(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      className="flex-1 bg-[#8c3b3c] hover:bg-[#732f30] text-white"
                    >
                      Save Profile
                    </Button>
                  </div>
                </form>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
