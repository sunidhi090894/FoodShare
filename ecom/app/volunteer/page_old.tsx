'use client'

import { useMemo, useState, useEffect } from 'react'
import {
  MapPin,
  ClipboardCheck,
  CheckCircle2,
  Phone,
  Award,
  Calendar,
  Leaf,
  X,
} from 'lucide-react'
import { useProtectedRoute } from '@/hooks/use-protected-route'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { AaharSetuLogo } from '@/components/ui/logo'

type TaskStatus = 'ASSIGNED' | 'ACCEPTED' | 'ON_ROUTE' | 'PICKED_UP' | 'DELIVERED' | 'CANCELLED'

interface VolunteerProfile {
  name: string
  city: string
  vehicleType: string
  age: string
}

interface PickupTask {
  _id?: string
  id?: string
  surplusId?: string
  donorOrg: string
  donorCity: string
  donorAddress: string
  donorContact: string
  recipientOrg?: string
  recipientAddress?: string
  recipientContact?: string
  items: string
  pickupWindow: string
  status: TaskStatus
  notes?: string
  distance?: string
  fitScore?: number
  etaRange?: [number, number]
  latenessRisk?: 'LOW' | 'MEDIUM' | 'HIGH'
  volunteerId?: string
  acceptedAt?: string
  completedAt?: string
}

interface TaskHistory {
  id: string
  donorOrg: string
  recipientOrg: string
  meals: number
  distance: string
  completedOn: string
}

const initialTasks: PickupTask[] = [
  {
    id: 'TASK-4821',
    donorOrg: 'Spice Route Café',
    donorCity: 'Mumbai',
    donorAddress: 'Bandra West · 4th Road',
    donorContact: '+91 90220 11100',
    recipientOrg: 'Hope Shelter Trust',
    recipientAddress: 'Bandra East · Pipeline Rd',
    recipientContact: '+91 90000 22211',
    items: 'Biryani trays (30 plates)',
    pickupWindow: 'Today · 2:00 – 4:00 PM',
    status: 'ASSIGNED',
    notes: 'Bring insulated carrier',
    distance: '5.2 km',
    fitScore: 0.88,
    etaRange: [28, 36],
    latenessRisk: 'LOW',
  },
  {
    id: 'TASK-4809',
    donorOrg: 'Fresh Bowl Kitchen',
    donorCity: 'Mumbai',
    donorAddress: 'Mahim · Reclamation',
    donorContact: '+91 93300 88110',
    recipientOrg: 'Care Foundation',
    recipientAddress: 'Worli · Seaface',
    recipientContact: '+91 98880 44111',
    items: 'Salad bowls (20 servings)',
    pickupWindow: 'Today · 7:00 – 8:30 PM',
    status: 'ACCEPTED',
    notes: 'Keep refrigerated',
    distance: '7.4 km',
    fitScore: 0.74,
    etaRange: [35, 45],
    latenessRisk: 'MEDIUM',
  },
  {
    id: 'TASK-4801',
    donorOrg: 'Sunrise Bakery',
    donorCity: 'Mumbai',
    donorAddress: 'Worli · Main Rd',
    donorContact: '+91 95555 33100',
    recipientOrg: 'Community Pantry',
    recipientAddress: 'Lower Parel · Station Rd',
    recipientContact: '+91 96660 10220',
    items: 'Pastries + breads (25 packs)',
    pickupWindow: 'Tomorrow · 9:30 – 11:00 AM',
    status: 'PICKED_UP',
    notes: 'Deliver before noon',
    distance: '3.1 km',
    fitScore: 0.63,
    etaRange: [22, 30],
    latenessRisk: 'LOW',
  },
]

const initialHistory: TaskHistory[] = [
  {
    id: 'DEL-144',
    donorOrg: 'Urban Feast',
    recipientOrg: 'Shelter One',
    meals: 40,
    distance: '8.4 km',
    completedOn: 'Oct 7',
  },
  {
    id: 'DEL-141',
    donorOrg: 'BKC Bistro',
    recipientOrg: 'Night Shelter Network',
    meals: 32,
    distance: '11.2 km',
    completedOn: 'Oct 2',
  },
]

const statusVariant: Record<TaskStatus, 'secondary' | 'default' | 'success' | 'warning' | 'destructive'> = {
  ASSIGNED: 'secondary',
  ACCEPTED: 'default',
  ON_ROUTE: 'warning',
  PICKED_UP: 'default',
  DELIVERED: 'success',
  CANCELLED: 'destructive',
}

const latenessVariant: Record<'LOW' | 'MEDIUM' | 'HIGH', { label: string; variant: 'success' | 'warning' | 'destructive' }> = {
  LOW: { label: 'Risk: Low', variant: 'success' },
  MEDIUM: { label: 'Risk: Medium', variant: 'warning' },
  HIGH: { label: 'Risk: High', variant: 'destructive' },
}

export default function VolunteerPortal() {
  useProtectedRoute('VOLUNTEER')
  const [tasks, setTasks] = useState(initialTasks)
  const [history, setHistory] = useState(initialHistory)
  const [deliveryForms, setDeliveryForms] = useState<
    Record<string, { weight: string; contact: string; notes: string }>
  >({})
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null)
  const [showProfileForm, setShowProfileForm] = useState(false)
  const [volunteerProfile, setVolunteerProfile] = useState<VolunteerProfile>({
    name: 'Anita Sharma',
    city: 'Mumbai',
    vehicleType: 'Two-wheeler',
    age: '28',
  })
  const [profileFormData, setProfileFormData] = useState<VolunteerProfile>(volunteerProfile)

  const assignedTasks = tasks.filter((task) => task.status !== 'DELIVERED' && task.status !== 'CANCELLED')
  const matchingTasks = assignedTasks.filter((task) => task.donorCity === volunteerProfile.city)
  const completedCount = history.length + tasks.filter((task) => task.status === 'DELIVERED').length
  const acceptedTasksToday = tasks.filter((task) => task.status === 'ACCEPTED').length
  const suggestedTasks = matchingTasks.filter((task) => task.fitScore >= 0.8)
  const otherAssignedTasks = matchingTasks.filter((task) => task.fitScore < 0.8)

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
        value: completedCount.toString(),
        helper: 'All-time deliveries',
        icon: CheckCircle2,
      },
    ],
    [acceptedTasksToday, completedCount]
  )

  const updateTaskStatus = (taskId: string, status: TaskStatus) => {
    setTasks((prev) => prev.map((task) => (task.id === taskId ? { ...task, status } : task)))
  }

  const handleAcceptTask = (taskId: string) => {
    updateTaskStatus(taskId, 'ACCEPTED')
  }

  const handleSaveProfile = () => {
    setVolunteerProfile(profileFormData)
    setShowProfileForm(false)
  }

  const openDeliveryForm = (taskId: string) => {
    setActiveTaskId(taskId)
    setDeliveryForms((prev) => ({
      ...prev,
      [taskId]: prev[taskId] ?? { weight: '', contact: '', notes: '' },
    }))
  }

  const completeDelivery = (taskId: string) => {
    const task = tasks.find((row) => row.id === taskId)
    if (!task) return
    updateTaskStatus(taskId, 'DELIVERED')
    setHistory((prev) => [
      {
        id: `DEL-${Math.floor(Math.random() * 900 + 100)}`,
        donorOrg: task.donorOrg,
        recipientOrg: task.recipientOrg,
        meals: 30,
        distance: task.distance,
        completedOn: 'Today',
      },
      ...prev,
    ])
    setActiveTaskId(null)
  }

  const nextActionLabel: Record<TaskStatus, string | null> = {
    ASSIGNED: 'Accept Task',
    ACCEPTED: 'Complete Delivery',
    ON_ROUTE: 'Mark Picked Up',
    PICKED_UP: 'Mark Delivered',
    DELIVERED: null,
    CANCELLED: null,
  }

  const handleNextAction = (task: PickupTask) => {
    switch (task.status) {
      case 'ASSIGNED':
        handleAcceptTask(task.id)
        break
      case 'ACCEPTED':
        openDeliveryForm(task.id)
        break
      case 'ON_ROUTE':
        updateTaskStatus(task.id, 'PICKED_UP')
        break
      case 'PICKED_UP':
        openDeliveryForm(task.id)
        break
    }
  }

  const renderTaskCard = (task: PickupTask, highlight: boolean) => {
    const riskView = latenessVariant[task.latenessRisk]
    const [showDetails, setShowDetails] = useState(false)
    
    return (
      <>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-[#8c3b3c]">{task.id}</p>
            <h3 className="text-lg font-semibold text-[#4a1f1f]">{task.items}</h3>
          </div>
          <Badge variant={statusVariant[task.status]}>{task.status}</Badge>
        </div>
        <div className="grid md:grid-cols-2 gap-4 text-sm">
          <div className="space-y-1">
            <p className="font-semibold text-[#4a1f1f]">Donor</p>
            <p className="text-[#6b4d3c]">{task.donorOrg}</p>
            <p className="text-[#6b4d3c]">{task.donorAddress}</p>
            <p className="text-[#6b4d3c] flex items-center gap-2">
              <Phone className="w-4 h-4" />
              {task.donorContact}
            </p>
          </div>
          <div className="space-y-1">
            <p className="font-semibold text-[#4a1f1f]">Recipient</p>
            <p className="text-[#6b4d3c]">{task.recipientOrg}</p>
            <p className="text-[#6b4d3c]">{task.recipientAddress}</p>
            <p className="text-[#6b4d3c] flex items-center gap-2">
              <Phone className="w-4 h-4" />
              {task.recipientContact}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3 text-sm text-[#6b4d3c]">
          <span>{task.pickupWindow}</span>
          <span>•</span>
          <span>{task.distance}</span>
          <span>•</span>
          <span>
            ETA {task.etaRange[0]} – {task.etaRange[1]} mins
          </span>
          {task.notes && (
            <>
              <span>•</span>
              <span>{task.notes}</span>
            </>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {highlight && (
            <Badge variant="secondary">Fit score {Math.round(task.fitScore * 100)}%</Badge>
          )}
          <Badge variant={riskView.variant}>{riskView.label}</Badge>
        </div>
        <div className="flex flex-wrap gap-3">
          {nextActionLabel[task.status] && (
            <Button className="bg-[#8c3b3c] hover:bg-[#732f30]" onClick={() => handleNextAction(task)}>
              {nextActionLabel[task.status]}
            </Button>
          )}
          <Button variant="outline" className="border-[#8c3b3c] text-[#8c3b3c] hover:bg-[#f7ebe0]" onClick={() => setShowDetails(!showDetails)}>
            {showDetails ? 'Hide Details' : 'View Details'}
          </Button>
        </div>
        {showDetails && (
          <Card className="bg-[#faf8f4] p-4 border border-[#d9c7aa] space-y-3">
            <div>
              <p className="text-sm font-semibold text-[#4a1f1f]">Pickup Instructions</p>
              <p className="text-sm text-[#6b4d3c]">{task.notes || 'No special instructions'}</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-[#4a1f1f]">Match Score</p>
              <p className="text-sm text-[#6b4d3c]">{Math.round(task.fitScore * 100)}% compatible with your profile</p>
            </div>
          </Card>
        )}
      </>
    )
  }

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
              See your pickups, update statuses, and deliver meals
            </h2>
            <p className="text-[#6b4d3c] max-w-3xl mx-auto mt-2">
              Accept tasks, follow the step-by-step flow, and submit delivery confirmations to keep donors and recipients in sync.
            </p>
          </div>
        </header>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
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

        <Card className="p-6 border border-[#d9c7aa] bg-white space-y-5">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-[#4a1f1f]">Assigned to Me</h2>
              <p className="text-sm text-[#6b4d3c]">Tap the next step as you move through each task.</p>
            </div>
            <Button variant="outline" size="sm" className="border-[#8c3b3c] text-[#8c3b3c] hover:bg-[#f7ebe0]">
              Refresh tasks
            </Button>
          </div>

          {suggestedTasks.length > 0 && (
            <div className="space-y-4">
              <p className="text-sm uppercase tracking-wide text-[#8c3b3c]">Suggested for you</p>
              {suggestedTasks.map((task) => (
                <Card key={task.id} className="border border-[#d9c7aa] bg-[#fffdf9] p-5 space-y-4">
                  {renderTaskCard(task, true)}
                </Card>
              ))}
            </div>
          )}

          <div className="space-y-4">
            {otherAssignedTasks.map((task) => (
              <Card key={task.id} className="border border-[#d9c7aa] bg-white p-5 space-y-4">
                {renderTaskCard(task, false)}
              </Card>
            ))}
          </div>
        </Card>

        {activeTaskId && (
          <>
            <Card className="p-6 border border-[#d9c7aa] bg-white space-y-5">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-[#4a1f1f]">History & Achievements</h2>
                  <p className="text-sm text-[#6b4d3c]">
                    Every delivery counts toward your volunteer milestones.
                  </p>
                </div>
                <Award className="w-5 h-5 text-[#8c3b3c]" />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {history.slice(0, 4).map((record) => (
                  <Card key={record.id} className="border border-[#d9c7aa] bg-[#fffdf9] p-4 space-y-2">
                    <p className="text-xs uppercase tracking-wide text-[#8c3b3c]">{record.completedOn}</p>
                    <h3 className="text-lg font-semibold text-[#4a1f1f]">
                      {record.donorOrg} → {record.recipientOrg}
                    </h3>
                    <p className="text-sm text-[#6b4d3c]">
                      {record.meals} meals • {record.distance}
                    </p>
                  </Card>
                ))}
              </div>
            </Card>

            <Card className="p-6 border border-[#d9c7aa] bg-white space-y-4">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-[#4a1f1f]">Volunteer Profile</h2>
                  <p className="text-sm text-[#6b4d3c]">
                    Your details help us match you with the right deliveries.
                  </p>
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
          </>
        )}

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
