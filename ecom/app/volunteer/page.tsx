'use client'

import { useMemo, useState } from 'react'
import {
  MapPin,
  Route,
  ClipboardCheck,
  CheckCircle2,
  Clock,
  Phone,
  NotebookPen,
  Award,
  Calendar,
} from 'lucide-react'
import { useProtectedRoute } from '@/hooks/use-protected-route'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

type TaskStatus = 'ASSIGNED' | 'ACCEPTED' | 'ON_ROUTE' | 'PICKED_UP' | 'DELIVERED' | 'CANCELLED'

interface PickupTask {
  id: string
  donorOrg: string
  donorAddress: string
  donorContact: string
  recipientOrg: string
  recipientAddress: string
  recipientContact: string
  items: string
  pickupWindow: string
  status: TaskStatus
  notes?: string
  distance: string
  fitScore: number
  etaRange: [number, number]
  latenessRisk: 'LOW' | 'MEDIUM' | 'HIGH'
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

  const assignedTasks = tasks.filter((task) => task.status !== 'DELIVERED' && task.status !== 'CANCELLED')
  const completedCount = history.length + tasks.filter((task) => task.status === 'DELIVERED').length
  const suggestedTasks = assignedTasks.filter((task) => task.fitScore >= 0.8)
  const otherAssignedTasks = assignedTasks.filter((task) => task.fitScore < 0.8)

  const summaryCards = useMemo(
    () => [
      {
        label: 'Tasks Assigned Today',
        value: assignedTasks.length.toString(),
        helper: 'Across Mumbai South',
        icon: ClipboardCheck,
      },
      {
        label: 'Tasks Completed',
        value: completedCount.toString(),
        helper: 'All-time deliveries',
        icon: CheckCircle2,
      },
      {
        label: 'Total Distance',
        value: '24 km',
        helper: 'Estimated today',
        icon: Route,
      },
      {
        label: 'Hours Volunteered',
        value: '112',
        helper: 'Tracked this year',
        icon: Clock,
      },
    ],
    [assignedTasks.length, completedCount]
  )

  const updateTaskStatus = (taskId: string, status: TaskStatus) => {
    setTasks((prev) => prev.map((task) => (task.id === taskId ? { ...task, status } : task)))
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
    ACCEPTED: 'Start / On Route',
    ON_ROUTE: 'Mark Picked Up',
    PICKED_UP: 'Mark Delivered',
    DELIVERED: null,
    CANCELLED: null,
  }

  const handleNextAction = (task: PickupTask) => {
    switch (task.status) {
      case 'ASSIGNED':
        updateTaskStatus(task.id, 'ACCEPTED')
        break
      case 'ACCEPTED':
        updateTaskStatus(task.id, 'ON_ROUTE')
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
          <Button variant="outline" className="border-[#8c3b3c] text-[#8c3b3c] hover:bg-[#f7ebe0]">
            View Details
          </Button>
        </div>
      </>
    )
  }

  return (
    <div className="min-h-screen bg-[#f7f1e3] py-10 px-4">
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="space-y-3">
          <p className="text-sm uppercase tracking-wide text-[#8c3b3c]">Volunteer Dashboard</p>
          <h1 className="text-3xl md:text-4xl font-bold flex items-center gap-3 text-[#4a1f1f]">
            <MapPin className="w-7 h-7 text-[#8c3b3c]" />
            See your pickups, update statuses, and deliver meals
          </h1>
          <p className="text-[#6b4d3c] max-w-3xl">
            Accept tasks, follow the step-by-step flow, and submit delivery confirmations to keep donors and recipients in sync.
          </p>
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

        <Card className="p-5 border border-[#d9c7aa] bg-[#fffdf9] space-y-1">
          <p className="text-xs uppercase tracking-wide text-[#8c3b3c]">Smart assignment</p>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <p className="text-xl font-semibold text-[#4a1f1f]">
              {suggestedTasks.length} task{suggestedTasks.length === 1 ? '' : 's'} match your availability today
            </p>
            <p className="text-sm text-[#6b4d3c]">
              Based on preferred routes, past completions, and current location radius.
            </p>
          </div>
        </Card>

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
                  <h2 className="text-xl font-semibold text-[#4a1f1f]">Profile & Availability</h2>
                  <p className="text-sm text-[#6b4d3c]">
                    Update your preferred service areas and time slots so coordinators can assign faster.
                  </p>
                </div>
                <Button variant="outline" size="sm" className="border-[#8c3b3c] text-[#8c3b3c] hover:bg-[#f7ebe0]">
                  Edit availability
                </Button>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <p className="text-sm text-[#6b4d3c]">Service area</p>
                  <p className="text-lg font-semibold text-[#4a1f1f]">Bandra · Mahim · Worli</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-[#6b4d3c]">Contact info</p>
                  <p className="font-medium text-[#4a1f1f]">Anita Sharma · +91 90009 11223</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-[#6b4d3c] flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Availability slots
                  </p>
                  <p className="font-medium text-[#4a1f1f]">Weekdays 1:00 – 9:00 PM • Saturdays 10:00 AM – 4:00 PM</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-[#6b4d3c]">Equipment</p>
                  <p className="font-medium text-[#4a1f1f]">Thermal bags · Cooler box</p>
                </div>
              </div>
            </Card>
          </>
        )}

      </div>
    </div>
  )
}
