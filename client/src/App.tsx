import {
  Activity,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Bell,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ClipboardCheck,
  Clock3,
  GraduationCap,
  LayoutDashboard,
  Menu,
  Pencil,
  Plus,
  Search,
  Settings,
  Trash2,
  Users,
  Wallet,
  X,
} from 'lucide-react'

import { useEffect, useMemo, useState, type FormEvent } from 'react'
import ResearchWorkspace from './ResearchWorkspace'
import ReportsWorkspace from './ReportsWorkspace'

const API_URL = 'http://localhost:5000/api/students'
const COURSES_API = 'http://localhost:5000/api/academics/courses'
const SUBJECTS_API = 'http://localhost:5000/api/academics/subjects'
const ATTENDANCE_API = 'http://localhost:5000/api/attendance'
const FACULTY_API = 'http://localhost:5000/api/faculty'
const TIMETABLE_API = 'http://localhost:5000/api/timetable'
const PAYROLL_API = 'http://localhost:5000/api/payroll'

function getLocalDate() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

interface Course {
  id: number
  course_code: string
  course_name: string
  department: string
  duration_years: number
  total_semesters: number
  description: string | null
}

interface Subject {
  id: number
  subject_code: string
  subject_name: string
  course_id: number
  semester: number
  credits: number
  description: string | null
  course_name?: string
  course_code?: string
}

interface Student {
  id: number
  roll_number: string
  first_name: string
  last_name: string
  email: string | null
  phone: string | null
  department: string
  academic_year: string
  semester: number
  created_at?: string
}

interface Faculty {
  id: number
  employee_id: string
  first_name: string
  last_name: string
  email: string | null
  phone: string | null
  department: string
  designation: string
  joining_date: string | null
  employment_status: 'Active' | 'Inactive'
  created_at?: string
}


interface PayrollRecord {
  id: number
  faculty_id: number
  payroll_month: string
  basic_salary: string | number
  allowances: string | number
  deductions: string | number
  gross_salary: string | number
  net_salary: string | number
  status: 'Pending' | 'Paid'
  employee_id: string
  first_name: string
  last_name: string
  department: string
  designation: string
  created_at?: string
}

interface PayrollForm {
  faculty_id: number
  payroll_month: string
  basic_salary: number
  allowances: number
  deductions: number
}

const emptyPayrollForm: PayrollForm = {
  faculty_id: 0,
  payroll_month: new Date().toISOString().slice(0, 7),
  basic_salary: 0,
  allowances: 0,
  deductions: 0,
}


interface TimetableEntry {
  id: number
  day_of_week: string
  class_name: string
  faculty_id: number
  room_name: string
  start_time: string
  end_time: string
  subject_name: string
  first_name?: string | null
  last_name?: string | null
  employee_id?: string | null
}

interface TimetableForm {
  day_of_week: string
  class_name: string
  subject_name: string
  faculty_id: number
  room_name: string
  start_time: string
  end_time: string
}

const emptyTimetableForm: TimetableForm = {
  day_of_week: 'Monday',
  class_name: '',
  subject_name: '',
  faculty_id: 0,
  room_name: '',
  start_time: '09:00',
  end_time: '10:00',
}

interface FacultyForm {
  employee_id: string
  first_name: string
  last_name: string
  email: string
  phone: string
  department: string
  designation: string
  joining_date: string
  employment_status: 'Active' | 'Inactive'
}

const emptyFacultyForm: FacultyForm = {
  employee_id: '',
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  department: 'Information Technology',
  designation: '',
  joining_date: '',
  employment_status: 'Active',
}


interface AttendanceRecord {
  id: number
  student_id: number
  subject_id: number
  attendance_date: string
  status: 'Present' | 'Absent' | 'Late'
  remarks: string | null
  roll_number: string
  first_name: string
  last_name: string
  subject_name: string
  subject_code: string
}

type AttendanceStatus = 'Present' | 'Absent' | 'Late' | ''

interface AttendanceSummary {
  student_id: number
  roll_number: string
  first_name: string
  last_name: string
  subject_id: number
  subject_name: string
  total_classes: number
  attended_classes: number
  absent_classes: number
  attendance_percentage: string | number
  below_threshold: boolean
}

interface StudentForm {
  roll_number: string
  first_name: string
  last_name: string
  email: string
  phone: string
  department: string
  academic_year: string
  semester: number
}

const emptyForm: StudentForm = {
  roll_number: '',
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  department: 'Information Technology',
  academic_year: '2026-2027',
  semester: 5,
}

const navigation = [
  { label: 'Dashboard', icon: LayoutDashboard },
  { label: 'Students', icon: GraduationCap },
  { label: 'Academics', icon: BookOpen },
  { label: 'Attendance', icon: ClipboardCheck },
  { label: 'Faculty & HR', icon: Users },
  { label: 'Timetable', icon: CalendarDays },
  { label: 'Payroll', icon: Wallet },
]

const moreNavigation = [
  { label: 'Research & Publications', icon: BookOpen },
  { label: 'Reports & Analytics', icon: Activity },
  { label: 'Settings', icon: Settings },
]

const metrics = [
  {
    label: 'Total Students',
    value: '2,840',
    change: '+8.2%',
    description: 'Illustrative sample data',
    icon: GraduationCap,
    color: 'blue',
    up: true,
  },
  {
    label: 'Faculty Members',
    value: '126',
    change: '+3.4%',
    description: 'Illustrative sample data',
    icon: Users,
    color: 'teal',
    up: true,
  },
  {
    label: 'Average Attendance',
    value: '87.6%',
    change: '-1.2%',
    description: 'Illustrative sample data',
    icon: ClipboardCheck,
    color: 'violet',
    up: false,
  },
  {
    label: 'Pending Requests',
    value: '18',
    change: '6 urgent',
    description: 'Illustrative sample data',
    icon: Clock3,
    color: 'amber',
    up: false,
  },
]

const attendanceData = [
  { day: 'Mon', students: 82, faculty: 91 },
  { day: 'Tue', students: 89, faculty: 94 },
  { day: 'Wed', students: 85, faculty: 92 },
  { day: 'Thu', students: 93, faculty: 96 },
  { day: 'Fri', students: 88, faculty: 93 },
  { day: 'Sat', students: 72, faculty: 84 },
]

const requests = [
  {
    initials: 'AP',
    name: 'Aarav Patil',
    detail: 'Leave application · TYBSc IT',
    type: 'Leave',
    color: 'blue',
  },
  {
    initials: 'SR',
    name: 'Sneha Rao',
    detail: 'Bonafide certificate request',
    type: 'Certificate',
    color: 'violet',
  },
  {
    initials: 'RK',
    name: 'Rahul Kulkarni',
    detail: 'Attendance correction · FYBCom',
    type: 'Attendance',
    color: 'teal',
  },
]

const activities = [
  {
    title: 'Attendance submitted',
    detail: 'BSc IT · Semester V',
    time: '10 min ago',
    icon: ClipboardCheck,
  },
  {
    title: 'Leave request received',
    detail: 'Department of Commerce',
    time: '32 min ago',
    icon: CalendarDays,
  },
  {
    title: 'Academic notice published',
    detail: 'Examination Cell',
    time: '1 hour ago',
    icon: BookOpen,
  },
]

function App() {
  const [activePage, setActivePage] = useState('Dashboard')
  const [search, setSearch] = useState('')
  const [showNotifications, setShowNotifications] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [mobileSidebar, setMobileSidebar] = useState(false)
  const [period, setPeriod] = useState('This week')
  const [resolved, setResolved] = useState<string[]>([])

  // Academics module state
  const [courses, setCourses] = useState<Course[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [loadingAcademics, setLoadingAcademics] = useState(false)
  const [academicsError, setAcademicsError] = useState('')
  const [academicsMessage, setAcademicsMessage] = useState('')
  const [academicsTab, setAcademicsTab] = useState<'courses' | 'subjects'>('courses')
  const [academicsModal, setAcademicsModal] = useState<'course' | 'subject' | null>(null)
  const [editingCourse, setEditingCourse] = useState<Course | null>(null)
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null)
  const [savingAcademic, setSavingAcademic] = useState(false)
  const [courseForm, setCourseForm] = useState({ course_code: '', course_name: '', department: 'Information Technology', duration_years: 3, total_semesters: 6, description: '' })
  const [subjectForm, setSubjectForm] = useState({ subject_code: '', subject_name: '', course_id: 0, semester: 1, credits: 4, description: '' })

  // Students module state
  const [students, setStudents] = useState<Student[]>([])
  const [loadingStudents, setLoadingStudents] = useState(false)
  const [studentsError, setStudentsError] = useState('')
  const [studentsMessage, setStudentsMessage] = useState('')
  const [showStudentForm, setShowStudentForm] = useState(false)
  const [editingStudent, setEditingStudent] = useState<Student | null>(null)
  const [studentForm, setStudentForm] = useState<StudentForm>(emptyForm)
  const [savingStudent, setSavingStudent] = useState(false)

  // Faculty & HR module state
  const [faculty, setFaculty] = useState<Faculty[]>([])
  const [loadingFaculty, setLoadingFaculty] = useState(false)
  const [facultyError, setFacultyError] = useState('')
  const [facultyMessage, setFacultyMessage] = useState('')
  const [showFacultyForm, setShowFacultyForm] = useState(false)
  const [editingFaculty, setEditingFaculty] = useState<Faculty | null>(null)
  const [facultyForm, setFacultyForm] =
    useState<FacultyForm>(emptyFacultyForm)
  const [savingFaculty, setSavingFaculty] = useState(false)

  // Timetable module state
  const [timetableEntries, setTimetableEntries] = useState<TimetableEntry[]>([])
  const [loadingTimetable, setLoadingTimetable] = useState(false)
  const [timetableError, setTimetableError] = useState('')
  const [timetableMessage, setTimetableMessage] = useState('')
  const [showTimetableForm, setShowTimetableForm] = useState(false)
  const [editingTimetable, setEditingTimetable] = useState<TimetableEntry | null>(null)
  const [timetableForm, setTimetableForm] = useState<TimetableForm>(emptyTimetableForm)
  const [savingTimetable, setSavingTimetable] = useState(false)


  // Payroll module state
  const [payrollRecords, setPayrollRecords] = useState<PayrollRecord[]>([])
  const [loadingPayroll, setLoadingPayroll] = useState(false)
  const [payrollError, setPayrollError] = useState('')
  const [payrollMessage, setPayrollMessage] = useState('')
  const [showPayrollForm, setShowPayrollForm] = useState(false)
  const [savingPayroll, setSavingPayroll] = useState(false)
  const [payrollForm, setPayrollForm] =
    useState<PayrollForm>(emptyPayrollForm)


  // Attendance module state
  const [attendanceStudents, setAttendanceStudents] = useState<Student[]>([])
  const [attendanceSubjects, setAttendanceSubjects] = useState<Subject[]>([])
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([])
  const [attendanceDate, setAttendanceDate] = useState(getLocalDate)
  const [attendanceSubjectId, setAttendanceSubjectId] = useState('')
  const [attendanceMarks, setAttendanceMarks] = useState<Record<number, AttendanceStatus>>({})
  const [loadingAttendance, setLoadingAttendance] = useState(false)
  const [savingAttendance, setSavingAttendance] = useState(false)
  const [attendanceError, setAttendanceError] = useState('')
  const [attendanceMessage, setAttendanceMessage] = useState('')
  const [attendanceSummary, setAttendanceSummary] = useState<AttendanceSummary[]>([])
  const [loadingAttendanceSummary, setLoadingAttendanceSummary] = useState(false)
  const [attendanceSummaryError, setAttendanceSummaryError] = useState('')
  const [attendanceThreshold, setAttendanceThreshold] = useState(75)

  const pageTitle =
    activePage === 'Dashboard' ? 'Dashboard overview' : activePage

  function selectPage(label: string) {
    setActivePage(label)
    setMobileSidebar(false)
    setStudentsMessage('')
    setStudentsError('')
    setAcademicsError('')
    setAcademicsMessage('')
    setAttendanceError('')
    setAttendanceMessage('')
  }

  async function loadTimetable() {
    setLoadingTimetable(true)
    setTimetableError('')
    try {
      const response = await fetch(TIMETABLE_API)
      const result = await response.json().catch(() => [])
      if (!response.ok) {
        throw new Error(result?.message || 'Could not load timetable entries.')
      }
      setTimetableEntries(Array.isArray(result) ? result : Array.isArray(result?.entries) ? result.entries : [])
    } catch (error) {
      setTimetableError(error instanceof Error
        ? error.message
        : 'Could not load timetable entries. Check that the backend is running at localhost:5000.')
    } finally {
      setLoadingTimetable(false)
    }
  }


  async function loadPayroll() {
    setLoadingPayroll(true)
    setPayrollError('')

    try {
      const response = await fetch(PAYROLL_API)
      const result = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(result?.message || 'Could not load payroll records.')
      }

      setPayrollRecords(
        Array.isArray(result) ? result : Array.isArray(result?.value) ? result.value : [],
      )
    } catch (error) {
      setPayrollError(
        error instanceof Error
          ? error.message
          : 'Could not connect to the payroll API.',
      )
    } finally {
      setLoadingPayroll(false)
    }
  }

  async function savePayroll(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSavingPayroll(true)
    setPayrollError('')
    setPayrollMessage('')

    try {
      const payload = {
        ...payrollForm,
        faculty_id: Number(payrollForm.faculty_id),
        basic_salary: Number(payrollForm.basic_salary),
        allowances: Number(payrollForm.allowances),
        deductions: Number(payrollForm.deductions),
      }

      const response = await fetch(PAYROLL_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const result = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(result?.message || 'Could not create payroll record.')
      }

      setShowPayrollForm(false)
      setPayrollForm(emptyPayrollForm)
      await loadPayroll()
      setPayrollMessage('Payroll record created successfully.')
    } catch (error) {
      setPayrollError(
        error instanceof Error ? error.message : 'Could not save payroll.',
      )
    } finally {
      setSavingPayroll(false)
    }
  }

  async function updatePayrollStatus(
    record: PayrollRecord,
    status: 'Pending' | 'Paid',
  ) {
    setPayrollError('')
    setPayrollMessage('')

    try {
      const response = await fetch(`${PAYROLL_API}/${record.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          basic_salary: Number(record.basic_salary),
          allowances: Number(record.allowances),
          deductions: Number(record.deductions),
          status,
        }),
      })

      const result = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(result?.message || 'Could not update payment status.')
      }

      await loadPayroll()
      setPayrollMessage(`Payment status updated to ${status}.`)
    } catch (error) {
      setPayrollError(
        error instanceof Error ? error.message : 'Could not update payroll.',
      )
    }
  }

  useEffect(() => {
    if (activePage === 'Payroll') {
      void loadPayroll()
      void loadFaculty()
    }
  }, [activePage])

  useEffect(() => {
    if (activePage === 'Timetable') {
      void loadTimetable()
      void loadAcademics()
      void loadFaculty()
    }
  }, [activePage])

  async function generateTimetable() {
    const classesInput = window.prompt('Enter class names separated by commas (example: BSc CS Sem 1, BSc CS Sem 2):')
    if (!classesInput?.trim()) return
    const subjectInput = window.prompt(`Enter subjects separated by commas. Existing subjects: ${subjects.map((s) => s.subject_name).join(', ')}`)
    if (!subjectInput?.trim()) return
    const roomInput = window.prompt('Enter available rooms separated by commas (example: Room 101, Lab 1):')
    if (!roomInput?.trim()) return
    const classes = classesInput.split(',').map((v) => v.trim()).filter(Boolean)
    const subject_names = subjectInput.split(',').map((v) => v.trim()).filter(Boolean)
    const room_names = roomInput.split(',').map((v) => v.trim()).filter(Boolean)
    const faculty_ids = faculty.filter((f) => f.employment_status === 'Active').map((f) => f.id)
    if (!faculty_ids.length) { setTimetableError('Add at least one active faculty member before generating a timetable.'); return }
    if (!window.confirm(`Generate a weekly timetable for ${classes.length} class(es) and ${subject_names.length} subject(s)? Existing sessions will be preserved.`)) return
    setTimetableError(''); setTimetableMessage('Generating timetable…')
    try {
      const response = await fetch(`${TIMETABLE_API}/generate`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ classes, subject_names, room_names, faculty_ids, days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], start_time: '09:00', end_time: '16:00', slot_minutes: 60 }) })
      const result = await response.json().catch(() => null)
      if (!response.ok) throw new Error(result?.message || 'Could not generate timetable.')
      await loadTimetable()
      setTimetableMessage(`Generated ${result.created} timetable session(s). Existing sessions were preserved.`)
    } catch (error) { setTimetableError(error instanceof Error ? error.message : 'Could not generate timetable.'); setTimetableMessage('') }
  }

  function openTimetableForm(entry?: TimetableEntry) {
    setEditingTimetable(entry ?? null)
    setTimetableForm(entry ? {
      day_of_week: entry.day_of_week,
      class_name: entry.class_name,
      subject_name: entry.subject_name,
      faculty_id: Number(entry.faculty_id),
      room_name: entry.room_name,
      start_time: entry.start_time.slice(0, 5),
      end_time: entry.end_time.slice(0, 5),
    } : {
      ...emptyTimetableForm,
      subject_name: subjects[0]?.subject_name ?? '',
      faculty_id: faculty[0]?.id ?? 0,
    })
    setTimetableError('')
    setTimetableMessage('')
    setShowTimetableForm(true)
  }

  async function saveTimetable(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSavingTimetable(true)
    setTimetableError('')
    setTimetableMessage('')
    try {
      const payload = {
        ...timetableForm,
        subject_name: timetableForm.subject_name.trim(),
        faculty_id: Number(timetableForm.faculty_id),
        class_name: timetableForm.class_name.trim(),
        room_name: timetableForm.room_name.trim(),
      }
      const response = await fetch(
        editingTimetable ? `${TIMETABLE_API}/${editingTimetable.id}` : TIMETABLE_API,
        {
          method: editingTimetable ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        },
      )
      const result = await response.json().catch(() => null)
      if (!response.ok) throw new Error(result?.message || 'Could not save this timetable session.')
      setShowTimetableForm(false)
      setEditingTimetable(null)
      await loadTimetable()
      setTimetableMessage(`Timetable session ${editingTimetable ? 'updated' : 'added'} successfully.`)
    } catch (error) {
      setTimetableError(error instanceof Error ? error.message : 'Could not save timetable session.')
    } finally {
      setSavingTimetable(false)
    }
  }

  async function deleteTimetable(entry: TimetableEntry) {
    if (!window.confirm(`Delete the ${entry.day_of_week} session for ${entry.class_name}? This action cannot be undone.`)) return
    setTimetableError('')
    setTimetableMessage('')
    try {
      const response = await fetch(`${TIMETABLE_API}/${entry.id}`, { method: 'DELETE' })
      const result = await response.json().catch(() => null)
      if (!response.ok) throw new Error(result?.message || 'Could not delete timetable session.')
      await loadTimetable()
      setTimetableMessage('Timetable session deleted successfully.')
    } catch (error) {
      setTimetableError(error instanceof Error ? error.message : 'Could not delete timetable session.')
    }
  }

  async function loadStudents() {
    setLoadingStudents(true)
    setStudentsError('')

    try {
      const response = await fetch(API_URL)

      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}`)
      }

      const data: Student[] = await response.json()
      setStudents(data)
    } catch (error) {
      console.error('Failed to load students:', error)

      setStudentsError(
        'Could not load student records. Check that the backend is running at localhost:5000.',
      )
    } finally {
      setLoadingStudents(false)
    }
  }

  async function loadFaculty() {
    setLoadingFaculty(true)
    setFacultyError('')

    try {
      const response = await fetch(FACULTY_API)

      if (!response.ok) {
        throw new Error('Failed to load faculty')
      }

      const data: Faculty[] = await response.json()
      setFaculty(data)
    } catch (error) {
      console.error('Failed to load faculty:', error)

      setFacultyError(
        'Could not load faculty records. Check that the backend is running at localhost:5000.',
      )
    } finally {
      setLoadingFaculty(false)
    }
  }
  useEffect(() => {
    if (activePage === 'Students') {
      void loadStudents()
    }
  }, [activePage])

  useEffect(() => {
    if (activePage === 'Faculty & HR') {
      void loadFaculty()
    }
  }, [activePage])

  async function loadAcademics() {
    setLoadingAcademics(true)
    setAcademicsError('')
    try {
      const [courseResponse, subjectResponse] = await Promise.all([
        fetch(COURSES_API),
        fetch(SUBJECTS_API),
      ])
      const courseData = await courseResponse.json().catch(() => [])
      const subjectData = await subjectResponse.json().catch(() => [])
      if (!courseResponse.ok) throw new Error(courseData?.message || 'Could not load courses.')
      if (!subjectResponse.ok) throw new Error(subjectData?.message || 'Could not load subjects.')
      setCourses(courseData)
      setSubjects(subjectData)
    } catch (error) {
      setAcademicsError(error instanceof Error ? error.message : 'Could not load academic records. Check the backend.')
    } finally {
      setLoadingAcademics(false)
    }
  }

  useEffect(() => {
    if (activePage === 'Academics') void loadAcademics()
  }, [activePage])

  async function loadAttendanceSummary() {
    setLoadingAttendanceSummary(true)
    setAttendanceSummaryError('')
    try {
      const params = new URLSearchParams({ threshold: String(attendanceThreshold) })
      if (attendanceSubjectId) params.set('subject_id', attendanceSubjectId)
      const response = await fetch(`${ATTENDANCE_API}/summary?${params.toString()}`)
      const result = await response.json().catch(() => null)
      if (!response.ok) throw new Error(result?.message || 'Could not load attendance summary.')
      setAttendanceSummary(Array.isArray(result?.summaries) ? result.summaries : [])
    } catch (error) {
      setAttendanceSummaryError(error instanceof Error ? error.message : 'Could not load attendance summary. Check the backend.')
      setAttendanceSummary([])
    } finally {
      setLoadingAttendanceSummary(false)
    }
  }

  async function loadAttendanceSetup() {
    setLoadingAttendance(true)
    setAttendanceError('')
    try {
      const [studentResponse, subjectResponse] = await Promise.all([
        fetch(API_URL),
        fetch(SUBJECTS_API),
      ])
      const studentData = await studentResponse.json().catch(() => [])
      const subjectData = await subjectResponse.json().catch(() => [])
      if (!studentResponse.ok) throw new Error(studentData?.message || 'Could not load students.')
      if (!subjectResponse.ok) throw new Error(subjectData?.message || 'Could not load subjects.')
      setAttendanceStudents(studentData)
      setAttendanceSubjects(subjectData)
      setAttendanceSubjectId((current) => current || (subjectData[0] ? String(subjectData[0].id) : ''))
    } catch (error) {
      setAttendanceError(error instanceof Error ? error.message : 'Could not load attendance setup data.')
    } finally {
      setLoadingAttendance(false)
    }
  }

  async function loadAttendanceRecords() {
    if (!attendanceSubjectId || !attendanceDate) {
      setAttendanceRecords([])
      setAttendanceMarks({})
      return
    }
    setLoadingAttendance(true)
    setAttendanceError('')
    try {
      const params = new URLSearchParams({ date: attendanceDate, subject_id: attendanceSubjectId })
      const response = await fetch(`${ATTENDANCE_API}?${params.toString()}`)
      const result = await response.json().catch(() => [])
      if (!response.ok) throw new Error(result?.message || 'Could not load attendance records.')
      const records: AttendanceRecord[] = result
      setAttendanceRecords(records)
      const nextMarks: Record<number, AttendanceStatus> = {}
      records.forEach((record) => { nextMarks[record.student_id] = record.status })
      setAttendanceMarks(nextMarks)
    } catch (error) {
      setAttendanceError(error instanceof Error ? error.message : 'Could not load attendance records.')
    } finally {
      setLoadingAttendance(false)
    }
  }

  useEffect(() => {
    if (activePage === 'Attendance') void loadAttendanceSetup()
  }, [activePage])

  useEffect(() => {
    if (activePage === 'Attendance') void loadAttendanceSummary()
  }, [activePage, attendanceSubjectId, attendanceThreshold])

  useEffect(() => {
    if (activePage === 'Attendance' && attendanceSubjectId) void loadAttendanceRecords()
  }, [activePage, attendanceDate, attendanceSubjectId])

  async function saveAttendance() {
    if (!attendanceSubjectId) {
      setAttendanceError('Add a subject in Academics before marking attendance.')
      return
    }
    const markedStudents = attendanceStudents.filter((student) => attendanceMarks[student.id])
    if (markedStudents.length === 0) {
      setAttendanceError('Choose a status for at least one student before saving.')
      return
    }
    setSavingAttendance(true)
    setAttendanceError('')
    setAttendanceMessage('')
    try {
      const results = await Promise.all(markedStudents.map(async (student) => {
        const response = await fetch(ATTENDANCE_API, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            student_id: student.id,
            subject_id: Number(attendanceSubjectId),
            attendance_date: attendanceDate,
            status: attendanceMarks[student.id],
          }),
        })
        const result = await response.json().catch(() => null)
        if (!response.ok) throw new Error(result?.message || `Could not save attendance for ${student.roll_number}.`)
        return result
      }))
      setAttendanceMessage(`Attendance saved for ${results.length} student${results.length === 1 ? '' : 's'}.`)
      await loadAttendanceRecords()
      await loadAttendanceSummary()
    } catch (error) {
      setAttendanceError(error instanceof Error ? error.message : 'Could not save attendance.')
    } finally {
      setSavingAttendance(false)
    }
  }

  function openCourseForm(course?: Course) {
    setEditingCourse(course ?? null)
    setCourseForm(course ? {
      course_code: course.course_code,
      course_name: course.course_name,
      department: course.department,
      duration_years: Number(course.duration_years),
      total_semesters: Number(course.total_semesters),
      description: course.description ?? '',
    } : { course_code: '', course_name: '', department: 'Information Technology', duration_years: 3, total_semesters: 6, description: '' })
    setAcademicsError('')
    setAcademicsMessage('')
    setAcademicsModal('course')
  }

  function openSubjectForm(subject?: Subject) {
    setEditingSubject(subject ?? null)
    const defaultCourse = subject?.course_id ?? courses[0]?.id ?? 0
    const maxSemester = courses.find((course) => course.id === defaultCourse)?.total_semesters ?? 1
    setSubjectForm(subject ? {
      subject_code: subject.subject_code,
      subject_name: subject.subject_name,
      course_id: subject.course_id,
      semester: Number(subject.semester),
      credits: Number(subject.credits),
      description: subject.description ?? '',
    } : { subject_code: '', subject_name: '', course_id: defaultCourse, semester: 1, credits: 4, description: '' })
    setAcademicsError(courses.length === 0 ? 'Add a course before creating a subject.' : '')
    setAcademicsMessage('')
    if (courses.length > 0 && defaultCourse > 0 && maxSemester < 1) return
    setAcademicsModal('subject')
  }

  async function saveAcademic(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!academicsModal) return
    setSavingAcademic(true)
    setAcademicsError('')
    setAcademicsMessage('')
    const isCourse = academicsModal === 'course'
    const editing = isCourse ? editingCourse : editingSubject
    const baseUrl = isCourse ? COURSES_API : SUBJECTS_API
    const payload = isCourse
      ? { ...courseForm, course_code: courseForm.course_code.trim(), course_name: courseForm.course_name.trim(), department: courseForm.department.trim(), description: courseForm.description.trim() || null }
      : { ...subjectForm, subject_code: subjectForm.subject_code.trim(), subject_name: subjectForm.subject_name.trim(), course_id: Number(subjectForm.course_id), semester: Number(subjectForm.semester), credits: Number(subjectForm.credits), description: subjectForm.description.trim() || null }
    try {
      const response = await fetch(editing ? `${baseUrl}/${editing.id}` : baseUrl, {
        method: editing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const result = await response.json().catch(() => null)
      if (!response.ok) throw new Error(result?.message || 'Could not save this record.')
      setAcademicsModal(null)
      await loadAcademics()
      setAcademicsMessage(`${isCourse ? 'Course' : 'Subject'} ${editing ? 'updated' : 'added'} successfully.`)
    } catch (error) {
      setAcademicsError(error instanceof Error ? error.message : 'An unexpected error occurred.')
    } finally {
      setSavingAcademic(false)
    }
  }

  async function deleteAcademic(kind: 'course' | 'subject', record: Course | Subject) {
    const label = kind === 'course' ? (record as Course).course_name : (record as Subject).subject_name
    if (!window.confirm(`Delete “${label}”? This action cannot be undone.`)) return
    setAcademicsError('')
    setAcademicsMessage('')
    try {
      const response = await fetch(`${kind === 'course' ? COURSES_API : SUBJECTS_API}/${record.id}`, { method: 'DELETE' })
      const result = await response.json().catch(() => null)
      if (!response.ok) throw new Error(result?.message || `Could not delete ${kind}.`)
      await loadAcademics()
      setAcademicsMessage(`${kind === 'course' ? 'Course' : 'Subject'} deleted successfully.`)
    } catch (error) {
      setAcademicsError(error instanceof Error ? error.message : 'An unexpected error occurred while deleting.')
    }
  }

  const filteredCourses = useMemo(() => {
    const term = search.trim().toLowerCase()
    return courses.filter((course) => [course.course_code, course.course_name, course.department].some((value) => value.toLowerCase().includes(term)))
  }, [courses, search])

  const filteredSubjects = useMemo(() => {
    const term = search.trim().toLowerCase()
    return subjects.filter((subject) => [subject.subject_code, subject.subject_name, subject.course_name ?? '', subject.course_code ?? '', String(subject.semester)].some((value) => value.toLowerCase().includes(term)))
  }, [subjects, search])

  const filteredStudents = useMemo(() => {
    const term = search.trim().toLowerCase()

    if (!term) return students

    return students.filter((student) =>
      [
        student.roll_number,
        student.first_name,
        student.last_name,
        student.email ?? '',
        student.phone ?? '',
        student.department,
        student.academic_year,
        String(student.semester),
      ].some((value) => value.toLowerCase().includes(term)),
    )
  }, [students, search])

  const filteredFaculty = useMemo(() => {
    const term = search.trim().toLowerCase()

    if (!term) return faculty

    return faculty.filter((member) =>
      [
        member.employee_id,
        member.first_name,
        member.last_name,
        member.email ?? '',
        member.phone ?? '',
        member.department,
        member.designation,
        member.employment_status,
      ].some((value) => value.toLowerCase().includes(term)),
    )
  }, [faculty, search])

  function openAddStudentForm() {
    setEditingStudent(null)
    setStudentForm(emptyForm)
    setStudentsMessage('')
    setStudentsError('')
    setShowStudentForm(true)
  }

  function openEditStudentForm(student: Student) {
    setEditingStudent(student)

    setStudentForm({
      roll_number: student.roll_number,
      first_name: student.first_name,
      last_name: student.last_name,
      email: student.email ?? '',
      phone: student.phone ?? '',
      department: student.department,
      academic_year: student.academic_year,
      semester: student.semester,
    })

    setStudentsMessage('')
    setStudentsError('')
    setShowStudentForm(true)
  }

  function updateStudentField<K extends keyof StudentForm>(
    field: K,
    value: StudentForm[K],
  ) {
    setStudentForm((current) => ({
      ...current,
      [field]: value,
    }))
  }

  async function saveStudent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    setSavingStudent(true)
    setStudentsError('')
    setStudentsMessage('')

    const payload = {
      ...studentForm,
      roll_number: studentForm.roll_number.trim(),
      first_name: studentForm.first_name.trim(),
      last_name: studentForm.last_name.trim(),
      email: studentForm.email.trim() || null,
      phone: studentForm.phone.trim() || null,
      department: studentForm.department.trim(),
      academic_year: studentForm.academic_year.trim(),
      semester: Number(studentForm.semester),
    }

    try {
      const isEditing = editingStudent !== null

      const response = await fetch(
        isEditing ? `${API_URL}/${editingStudent.id}` : API_URL,
        {
          method: isEditing ? 'PUT' : 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        },
      )

      const result = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(
          result?.message ||
          result?.error ||
          'The student record could not be saved.',
        )
      }

      setShowStudentForm(false)
      setEditingStudent(null)
      setStudentForm(emptyForm)

      await loadStudents()

      setStudentsMessage(
        isEditing
          ? 'Student record updated successfully.'
          : 'Student added successfully.',
      )
    } catch (error) {
      setStudentsError(
        error instanceof Error
          ? error.message
          : 'An unexpected error occurred while saving.',
      )
    } finally {
      setSavingStudent(false)
    }
  }

  async function deleteStudent(student: Student) {
    const confirmed = window.confirm(
      `Delete ${student.first_name} ${student.last_name} (${student.roll_number})? This action cannot be undone.`,
    )

    if (!confirmed) return

    setStudentsError('')
    setStudentsMessage('')

    try {
      const response = await fetch(`${API_URL}/${student.id}`, {
        method: 'DELETE',
      })

      const result = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(
          result?.message ||
          result?.error ||
          'The student record could not be deleted.',
        )
      }

      await loadStudents()
      setStudentsMessage('Student deleted successfully.')
    } catch (error) {
      setStudentsError(
        error instanceof Error
          ? error.message
          : 'An unexpected error occurred while deleting.',
      )
    }
  }


  function openFacultyForm(member?: Faculty) {
    setEditingFaculty(member ?? null)

    setFacultyForm(
      member
        ? {
          employee_id: member.employee_id,
          first_name: member.first_name,
          last_name: member.last_name,
          email: member.email ?? '',
          phone: member.phone ?? '',
          department: member.department,
          designation: member.designation,
          joining_date: member.joining_date
            ? member.joining_date.slice(0, 10)
            : '',
          employment_status: member.employment_status,
        }
        : emptyFacultyForm,
    )

    setFacultyMessage('')
    setFacultyError('')
    setShowFacultyForm(true)
  }

  function updateFacultyField<K extends keyof FacultyForm>(
    field: K,
    value: FacultyForm[K],
  ) {
    setFacultyForm((current) => ({
      ...current,
      [field]: value,
    }))
  }

  async function saveFaculty(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    setSavingFaculty(true)
    setFacultyError('')
    setFacultyMessage('')

    const payload = {
      ...facultyForm,
      employee_id: facultyForm.employee_id.trim(),
      first_name: facultyForm.first_name.trim(),
      last_name: facultyForm.last_name.trim(),
      email: facultyForm.email.trim() || null,
      phone: facultyForm.phone.trim() || null,
      department: facultyForm.department.trim(),
      designation: facultyForm.designation.trim(),
      joining_date: facultyForm.joining_date || null,
    }

    try {
      const isEditing = editingFaculty !== null

      const response = await fetch(
        isEditing
          ? `${FACULTY_API}/${editingFaculty.id}`
          : FACULTY_API,
        {
          method: isEditing ? 'PUT' : 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        },
      )

      const result = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(
          result?.message ||
          result?.error ||
          'The faculty record could not be saved.',
        )
      }

      setShowFacultyForm(false)
      setEditingFaculty(null)
      setFacultyForm(emptyFacultyForm)

      await loadFaculty()

      setFacultyMessage(
        isEditing
          ? 'Faculty record updated successfully.'
          : 'Faculty added successfully.',
      )
    } catch (error) {
      setFacultyError(
        error instanceof Error
          ? error.message
          : 'An unexpected error occurred while saving.',
      )
    } finally {
      setSavingFaculty(false)
    }
  }


  async function deleteFaculty(member: Faculty) {
    if (!window.confirm(`Delete ${member.first_name} ${member.last_name} (${member.employee_id})? This action cannot be undone.`)) return
    setFacultyError('')
    setFacultyMessage('')
    try {
      const response = await fetch(`${FACULTY_API}/${member.id}`, { method: 'DELETE' })
      const result = await response.json().catch(() => null)
      if (!response.ok) throw new Error(result?.message || result?.error || 'The faculty record could not be deleted.')
      await loadFaculty()
      setFacultyMessage('Faculty record deleted successfully.')
    } catch (error) {
      setFacultyError(error instanceof Error ? error.message : 'An unexpected error occurred while deleting faculty.')
    }
  }

  return (
    <div className="app-shell">
      {mobileSidebar && (
        <button
          className="mobile-backdrop"
          aria-label="Close menu"
          onClick={() => setMobileSidebar(false)}
        />
      )}

      <aside
        className={`sidebar ${mobileSidebar ? 'sidebar-open' : ''}`}
      >
        <div className="brand">
          <div className="brand-emblem">
            <GraduationCap size={25} strokeWidth={2.2} />
          </div>

          <div className="brand-copy">
            <strong>KIRTI COLLEGE</strong>
            <span>INSTITUTIONAL ERP</span>
          </div>

          <button
            className="icon-button mobile-close"
            onClick={() => setMobileSidebar(false)}
            aria-label="Close sidebar"
          >
            <X size={19} />
          </button>
        </div>

        <div className="institution-card">
          <span className="institution-dot" />
          <div>
            <strong>Kirti M. Doongursee</strong>
            <span>Arts · Science · Commerce</span>
          </div>
          <ChevronDown size={15} />
        </div>

        <div className="nav-caption">WORKSPACE</div>

        <nav className="navigation" aria-label="Main navigation">
          {navigation.map(({ label, icon: Icon }) => (
            <button
              key={label}
              className={`nav-link ${activePage === label ? 'nav-active' : ''
                }`}
              onClick={() => selectPage(label)}
            >
              <Icon size={18} strokeWidth={1.8} />
              <span>{label}</span>
              {label === 'Attendance' && (
                <span className="nav-count">3</span>
              )}
            </button>
          ))}
        </nav>

        <div className="nav-caption secondary-caption">
          MANAGEMENT
        </div>

        <nav
          className="navigation"
          aria-label="Management navigation"
        >
          {moreNavigation.map(({ label, icon: Icon }) => (
            <button
              key={label}
              className={`nav-link ${activePage === label ? 'nav-active' : ''
                }`}
              onClick={() => selectPage(label)}
            >
              <Icon size={18} strokeWidth={1.8} />
              <span>{label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="support-card">
            <div className="support-icon">
              <Activity size={18} />
            </div>
            <strong>Need assistance?</strong>
            <p>Access ERP help and support resources.</p>
            <button onClick={() => selectPage('Help & Support')}>
              Visit help centre <ArrowRight size={14} />
            </button>
          </div>

          <div className="sidebar-user">
            <div className="avatar avatar-admin">AD</div>
            <div className="user-copy">
              <strong>ERP Administrator</strong>
              <span>System Admin</span>
            </div>
            <button
              className="icon-button"
              aria-label="Account options"
              onClick={() => setShowProfile(!showProfile)}
            >
              <ChevronDown size={17} />
            </button>
          </div>

          {showProfile && (
            <div className="profile-popover">
              <strong>Administrator</strong>
              <button onClick={() => selectPage('My Profile')}>
                My profile
              </button>
              <button onClick={() => selectPage('Settings')}>
                Account settings
              </button>
            </div>
          )}
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <button
            className="icon-button menu-toggle"
            onClick={() => setMobileSidebar(true)}
            aria-label="Open menu"
          >
            <Menu size={21} />
          </button>

          <div className="breadcrumb">
            <span>Workspace</span>
            <span className="breadcrumb-slash">/</span>
            <strong>{activePage}</strong>
          </div>

          <div className="topbar-actions">
            <label className="search-box">
              <Search size={17} />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={
                  activePage === 'Students'
                    ? 'Search students...'
                    : 'Search anything...'
                }
                aria-label="Search"
              />
              <kbd>⌘ K</kbd>
            </label>

            <div className="notification-wrap">
              <button
                className="icon-button notification-button"
                aria-label="Notifications"
                onClick={() =>
                  setShowNotifications(!showNotifications)
                }
              >
                <Bell size={19} />
                <span className="notification-dot" />
              </button>

              {showNotifications && (
                <div className="popover notification-popover">
                  <div className="popover-heading">
                    Notifications <span>3 sample items</span>
                  </div>

                  {activities.map((item) => (
                    <div className="notification-item" key={item.title}>
                      <span className="activity-icon">
                        <item.icon size={17} />
                      </span>
                      <div>
                        <strong>{item.title}</strong>
                        <p>{item.detail}</p>
                        <small>{item.time}</small>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="topbar-divider" />

            <div className="topbar-user">
              <div className="avatar avatar-admin">AD</div>
              <div>
                <strong>Administrator</strong>
                <span>Super Admin</span>
              </div>
              <ChevronDown size={15} />
            </div>
          </div>
        </header>

        <div className="page-content">
          <section className="welcome-row">
            <div>
              <div className="eyebrow">
                <span className="live-dot" />
                INSTITUTIONAL WORKSPACE
              </div>

              <h1>{pageTitle}</h1>

              <p className="page-subtitle">
                {activePage === 'Dashboard'
                  ? 'A clear view of your institution’s daily operations.'
                  : activePage === 'Students'
                    ? 'Manage student records stored in your college database.'
                    : `Explore and manage the ${activePage.toLowerCase()} workspace.`}
              </p>
            </div>

            <div className="welcome-actions">
              <span className="date-chip">
                <CalendarDays size={16} />
                Academic Year 2026–27
              </span>

              {activePage === 'Students' ? (
                <button className="primary-button" onClick={openAddStudentForm}>
                  <Plus size={17} /> Add student
                </button>
              ) : activePage === 'Academics' ? (
                <button className="primary-button" onClick={() => academicsTab === 'courses' ? openCourseForm() : openSubjectForm()}>
                  <Plus size={17} /> Add {academicsTab === 'courses' ? 'course' : 'subject'}
                </button>

              ) : activePage === 'Attendance' ? (
                <button className="primary-button" onClick={() => void saveAttendance()} disabled={savingAttendance || loadingAttendance}>
                  <CheckCircle2 size={17} /> {savingAttendance ? 'Saving…' : 'Save attendance'}
                </button>
              ) : activePage === 'Faculty & HR' ? (
                <button
                  className="primary-button"
                  onClick={() => openFacultyForm()}
                >
                  <Plus size={17} /> Add Faculty
                </button>
              ) : activePage === 'Payroll' ? (
                <button className="primary-button" onClick={() => { setPayrollError(''); setPayrollMessage(''); setPayrollForm({ ...emptyPayrollForm, faculty_id: faculty[0]?.id ?? 0 }); setShowPayrollForm(true) }}>
                  <Plus size={17} /> Create payroll
                </button>
              ) : (
                <button
                  className="primary-button"
                  onClick={() => selectPage('Reports & Analytics')}
                >
                  View reports <ArrowRight size={16} />
                </button>
              )}

            </div>
          </section>

          {activePage === 'Students' ? (
            <section className="students-module">
              <div className="student-summary-row">
                <article className="student-summary-card">
                  <span>Total student records</span>
                  <strong>{students.length}</strong>
                  <small>Records currently in PostgreSQL</small>
                </article>

                <article className="student-summary-card">
                  <span>Search results</span>
                  <strong>{filteredStudents.length}</strong>
                  <small>Matching the current search</small>
                </article>

                <article className="student-summary-card">
                  <span>Database status</span>
                  <strong className="database-status">
                    {loadingStudents ? 'Loading…' : studentsError ? 'Check' : 'Ready'}
                  </strong>
                  <small>
                    {loadingStudents
                      ? 'Fetching student records'
                      : studentsError
                        ? 'Check the backend connection'
                        : 'Connected through the API'}
                  </small>
                </article>
              </div>

              {studentsMessage && (
                <div className="student-alert success-alert" role="status">
                  <CheckCircle2 size={18} />
                  {studentsMessage}
                  <button
                    onClick={() => setStudentsMessage('')}
                    aria-label="Dismiss message"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}

              {studentsError && (
                <div className="student-alert error-alert" role="alert">
                  <span>{studentsError}</span>
                  <button
                    onClick={() => void loadStudents()}
                    className="retry-button"
                  >
                    Retry
                  </button>
                </div>
              )}

              <article className="panel students-panel">
                <div className="students-toolbar">
                  <div>
                    <h2>Student directory</h2>
                    <p>
                      View and manage student information.
                    </p>
                  </div>

                  <button
                    className="primary-button"
                    onClick={openAddStudentForm}
                  >
                    <Plus size={17} /> Add student
                  </button>
                </div>

                {loadingStudents ? (
                  <div className="students-empty">
                    <div className="loading-spinner" />
                    <p>Loading student records…</p>
                  </div>
                ) : filteredStudents.length === 0 ? (
                  <div className="students-empty">
                    <GraduationCap size={34} />
                    <strong>
                      {students.length === 0
                        ? 'No student records found'
                        : 'No matching students'}
                    </strong>
                    <p>
                      {students.length === 0
                        ? 'Add a student to begin building your directory.'
                        : 'Try another name, roll number, or department.'}
                    </p>
                    {students.length === 0 && (
                      <button
                        className="primary-button"
                        onClick={openAddStudentForm}
                      >
                        <Plus size={17} /> Add first student
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="student-table-wrap">
                    <table className="student-table">
                      <thead>
                        <tr>
                          <th>Student</th>
                          <th>Roll number</th>
                          <th>Department</th>
                          <th>Academic year</th>
                          <th>Semester</th>
                          <th>Actions</th>
                        </tr>
                      </thead>

                      <tbody>
                        {filteredStudents.map((student) => (
                          <tr key={student.id}>
                            <td>
                              <div className="student-name-cell">
                                <div className="student-avatar">
                                  {student.first_name.charAt(0)}
                                  {student.last_name.charAt(0)}
                                </div>
                                <div>
                                  <strong>
                                    {student.first_name} {student.last_name}
                                  </strong>
                                  <span>{student.email || 'No email provided'}</span>
                                </div>
                              </div>
                            </td>

                            <td>
                              <span className="roll-number">
                                {student.roll_number}
                              </span>
                            </td>

                            <td>{student.department}</td>
                            <td>{student.academic_year}</td>
                            <td>
                              <span className="semester-badge">
                                Semester {student.semester}
                              </span>
                            </td>

                            <td>
                              <div className="student-actions">
                                <button
                                  className="student-action edit-action"
                                  onClick={() => openEditStudentForm(student)}
                                  aria-label={`Edit ${student.first_name}`}
                                  title="Edit student"
                                >
                                  <Pencil size={16} />
                                </button>

                                <button
                                  className="student-action delete-action"
                                  onClick={() => void deleteStudent(student)}
                                  aria-label={`Delete ${student.first_name}`}
                                  title="Delete student"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <div className="student-table-footer">
                  <span>
                    Showing {filteredStudents.length} of {students.length} records
                  </span>
                  <button
                    className="text-action"
                    onClick={() => void loadStudents()}
                    disabled={loadingStudents}
                  >
                    Refresh records <ArrowRight size={14} />
                  </button>
                </div>
              </article>
            </section>
          ) : activePage === 'Academics' ? (
            <section className="academics-module">
              <div className="academics-summary">
                <article className="academics-stat"><span>Total courses</span><strong>{courses.length}</strong><small>Stored in PostgreSQL</small></article>
                <article className="academics-stat"><span>Total subjects</span><strong>{subjects.length}</strong><small>Across all courses</small></article>
                <article className="academics-stat"><span>Connection</span><strong>{loadingAcademics ? 'Loading…' : academicsError ? 'Check' : 'Ready'}</strong><small>{loadingAcademics ? 'Fetching records' : academicsError ? 'Check the API' : 'Academics API connected'}</small></article>
              </div>
              {academicsMessage && <div className="academics-alert academics-success" role="status"><CheckCircle2 size={17} />{academicsMessage}<button onClick={() => setAcademicsMessage('')} aria-label="Dismiss"><X size={15} /></button></div>}
              {academicsError && <div className="academics-alert academics-error" role="alert"><span>{academicsError}</span><button className="secondary-button" onClick={() => void loadAcademics()}>Retry</button></div>}
              <article className="panel academics-panel">
                <div className="academics-toolbar">
                  <div><h2>Academic catalogue</h2><p>Manage courses and their subjects.</p></div>
                  <div className="academics-tabs"><button className={academicsTab === 'courses' ? 'academics-tab active' : 'academics-tab'} onClick={() => setAcademicsTab('courses')}>Courses <span>{courses.length}</span></button><button className={academicsTab === 'subjects' ? 'academics-tab active' : 'academics-tab'} onClick={() => setAcademicsTab('subjects')}>Subjects <span>{subjects.length}</span></button></div>
                </div>
                {loadingAcademics ? <div className="academics-empty"><div className="loading-spinner" /><p>Loading academic records…</p></div> : academicsTab === 'courses' ? filteredCourses.length === 0 ? <div className="academics-empty"><BookOpen size={34} /><strong>{courses.length === 0 ? 'No courses added yet' : 'No matching courses'}</strong><p>{courses.length === 0 ? 'Add your first course to start building the academic catalogue.' : 'Try a different course name, code, or department.'}</p>{courses.length === 0 && <button className="primary-button" onClick={() => openCourseForm()}><Plus size={16} /> Add first course</button>}</div> : <div className="academics-table-wrap"><table className="academics-table"><thead><tr><th>Course</th><th>Department</th><th>Duration</th><th>Semesters</th><th>Subjects</th><th>Actions</th></tr></thead><tbody>{filteredCourses.map((course) => <tr key={course.id}><td><div className="academics-name"><strong>{course.course_name}</strong><span>{course.course_code}</span></div></td><td>{course.department}</td><td>{course.duration_years} {course.duration_years === 1 ? 'year' : 'years'}</td><td>{course.total_semesters}</td><td>{subjects.filter((subject) => subject.course_id === course.id).length}</td><td><div className="student-actions"><button className="student-action edit-action" onClick={() => openCourseForm(course)} aria-label={`Edit ${course.course_name}`} title="Edit course"><Pencil size={16} /></button><button className="student-action delete-action" onClick={() => void deleteAcademic('course', course)} aria-label={`Delete ${course.course_name}`} title="Delete course"><Trash2 size={16} /></button></div></td></tr>)}</tbody></table></div> : filteredSubjects.length === 0 ? <div className="academics-empty"><BookOpen size={34} /><strong>{subjects.length === 0 ? 'No subjects added yet' : 'No matching subjects'}</strong><p>{subjects.length === 0 ? 'Add subjects after creating their course.' : 'Try a different subject name, code, or semester.'}</p>{courses.length > 0 && subjects.length === 0 && <button className="primary-button" onClick={() => openSubjectForm()}><Plus size={16} /> Add first subject</button>}</div> : <div className="academics-table-wrap"><table className="academics-table"><thead><tr><th>Subject</th><th>Course</th><th>Semester</th><th>Credits</th><th>Description</th><th>Actions</th></tr></thead><tbody>{filteredSubjects.map((subject) => <tr key={subject.id}><td><div className="academics-name"><strong>{subject.subject_name}</strong><span>{subject.subject_code}</span></div></td><td><div className="academics-name"><strong>{subject.course_name || `Course #${subject.course_id}`}</strong><span>{subject.course_code || 'Course code unavailable'}</span></div></td><td><span className="semester-badge">Semester {subject.semester}</span></td><td>{subject.credits}</td><td>{subject.description || '—'}</td><td><div className="student-actions"><button className="student-action edit-action" onClick={() => openSubjectForm(subject)} aria-label={`Edit ${subject.subject_name}`} title="Edit subject"><Pencil size={16} /></button><button className="student-action delete-action" onClick={() => void deleteAcademic('subject', subject)} aria-label={`Delete ${subject.subject_name}`} title="Delete subject"><Trash2 size={16} /></button></div></td></tr>)}</tbody></table></div>}
                <div className="academics-footer"><span>{academicsTab === 'courses' ? `Showing ${filteredCourses.length} of ${courses.length} courses` : `Showing ${filteredSubjects.length} of ${subjects.length} subjects`}</span><button className="text-action" onClick={() => void loadAcademics()} disabled={loadingAcademics}>Refresh records <ArrowRight size={14} /></button></div>
              </article>
            </section>
          ) : activePage === 'Attendance' ? (
            <section className="academics-module">
              <div className="academics-summary">
                <article className="academics-stat"><span>Total students</span><strong>{attendanceStudents.length}</strong><small>Loaded from the student database</small></article>
                <article className="academics-stat"><span>Marked for this session</span><strong>{attendanceStudents.filter((student) => Boolean(attendanceMarks[student.id])).length}</strong><small>Students with a selected status</small></article>
                <article className="academics-stat"><span>Saved records</span><strong>{attendanceRecords.length}</strong><small>For the selected date and subject</small></article>
              </div>

              {attendanceMessage && <div className="academics-alert academics-success" role="status"><CheckCircle2 size={17} />{attendanceMessage}<button onClick={() => setAttendanceMessage('')} aria-label="Dismiss message"><X size={15} /></button></div>}
              {attendanceError && <div className="academics-alert academics-error" role="alert"><span>{attendanceError}</span><button className="secondary-button" onClick={() => { void loadAttendanceSetup(); void loadAttendanceRecords() }}>Retry</button></div>}

              <article className="panel academics-panel">
                <div className="academics-toolbar">
                  <div><h2>Attendance performance</h2><p>Historical attendance by student and subject. Late arrivals count as attended.</p></div>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                    <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 12, color: '#46536a', fontWeight: 650 }}>Alert threshold
                      <select value={attendanceThreshold} onChange={(event) => setAttendanceThreshold(Number(event.target.value))} style={{ border: '1px solid #dce2eb', borderRadius: 9, padding: '9px 10px', background: 'white' }}>
                        {[60, 65, 70, 75, 80, 85, 90].map((value) => <option key={value} value={value}>{value}%</option>)}
                      </select>
                    </label>
                    <button className="text-action" onClick={() => void loadAttendanceSummary()} disabled={loadingAttendanceSummary}>Refresh summary <ArrowRight size={14} /></button>
                  </div>
                </div>
                <div className="academics-summary attendance-performance-stats">
                  <article className="academics-stat"><span>Students tracked</span><strong>{new Set(attendanceSummary.map((item) => item.student_id)).size}</strong><small>Students with saved attendance</small></article>
                  <article className="academics-stat"><span>Below {attendanceThreshold}%</span><strong className={attendanceSummary.some((item) => item.below_threshold) ? 'attendance-warning-number' : ''}>{attendanceSummary.filter((item) => item.below_threshold).length}</strong><small>Student-subject records needing attention</small></article>
                  <article className="academics-stat"><span>Average attendance</span><strong>{attendanceSummary.length ? `${(attendanceSummary.reduce((sum, item) => sum + Number(item.attendance_percentage || 0), 0) / attendanceSummary.length).toFixed(1)}%` : '—'}</strong><small>Across the listed student-subject records</small></article>
                </div>
                {attendanceSummaryError && <div className="academics-alert academics-error" role="alert"><span>{attendanceSummaryError}</span><button className="secondary-button" onClick={() => void loadAttendanceSummary()}>Retry</button></div>}
                {loadingAttendanceSummary ? <div className="academics-empty"><div className="loading-spinner" /><p>Loading attendance performance…</p></div> : attendanceSummary.length === 0 ? <div className="academics-empty"><ClipboardCheck size={32} /><strong>No attendance summary yet</strong><p>Save attendance records to calculate percentages and identify students below the threshold.</p></div> : <div className="academics-table-wrap"><table className="academics-table attendance-summary-table"><thead><tr><th>Student</th><th>Subject</th><th>Classes</th><th>Attended</th><th>Absent</th><th>Attendance</th><th>Alert</th></tr></thead><tbody>{attendanceSummary.filter((item) => !search.trim() || `${item.first_name} ${item.last_name} ${item.roll_number} ${item.subject_name}`.toLowerCase().includes(search.trim().toLowerCase())).map((item) => <tr key={`${item.student_id}-${item.subject_id}`}><td><div className="academics-name"><strong>{item.first_name} {item.last_name}</strong><span>{item.roll_number}</span></div></td><td>{item.subject_name}</td><td>{item.total_classes}</td><td>{item.attended_classes}</td><td>{item.absent_classes}</td><td><div className="attendance-percent-cell"><strong className={item.below_threshold ? 'attendance-warning-number' : 'attendance-good-number'}>{Number(item.attendance_percentage).toFixed(2)}%</strong><div className="attendance-percent-track"><span className={item.below_threshold ? 'attendance-percent-low' : 'attendance-percent-ok'} style={{ width: `${Math.max(0, Math.min(100, Number(item.attendance_percentage)))}%` }} /></div></div></td><td>{item.below_threshold ? <span className="attendance-alert-badge"><Bell size={13} /> Below {attendanceThreshold}%</span> : <span className="attendance-ok-badge"><CheckCircle2 size={13} /> On track</span>}</td></tr>)}</tbody></table></div>}
                <div className="academics-footer"><span>Showing {attendanceSummary.filter((item) => !search.trim() || `${item.first_name} ${item.last_name} ${item.roll_number} ${item.subject_name}`.toLowerCase().includes(search.trim().toLowerCase())).length} student-subject records</span><span>Alerts are based on the selected threshold.</span></div>
              </article>

              <article className="panel academics-panel">
                <div className="academics-toolbar">
                  <div><h2>Daily attendance</h2><p>Select a subject and date, then mark each student.</p></div>
                  <button className="text-action" onClick={() => { void loadAttendanceSetup(); void loadAttendanceRecords() }} disabled={loadingAttendance}>Refresh records <ArrowRight size={14} /></button>
                </div>
                <div className="attendance-controls">
                  <label>Attendance date<input type="date" value={attendanceDate} onChange={(event) => setAttendanceDate(event.target.value)} /></label>
                  <label>Subject<select value={attendanceSubjectId} onChange={(event) => setAttendanceSubjectId(event.target.value)}><option value="">Select a subject</option>{attendanceSubjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.subject_code} — {subject.subject_name} (Sem {subject.semester})</option>)}</select></label>
                  <div className="attendance-control-note">Changes are saved to PostgreSQL when you click Save attendance.</div>
                </div>

                {loadingAttendance ? <div className="academics-empty"><div className="loading-spinner" /><p>Loading attendance data…</p></div> : attendanceStudents.length === 0 ? <div className="academics-empty"><GraduationCap size={34} /><strong>No student records available</strong><p>Add student records in the Students module before marking attendance.</p><button className="primary-button" onClick={() => selectPage('Students')}>Open Students <ArrowRight size={15} /></button></div> : attendanceSubjects.length === 0 ? <div className="academics-empty"><BookOpen size={34} /><strong>No subjects available</strong><p>Add a course and subject in Academics before marking attendance.</p><button className="primary-button" onClick={() => selectPage('Academics')}>Open Academics <ArrowRight size={15} /></button></div> : (
                  <div className="academics-table-wrap">
                    <table className="academics-table attendance-table">
                      <thead><tr><th>Student</th><th>Roll number</th><th>Department</th><th>Semester</th><th>Attendance status</th></tr></thead>
                      <tbody>{attendanceStudents.filter((student) => !search.trim() || `${student.first_name} ${student.last_name} ${student.roll_number} ${student.department}`.toLowerCase().includes(search.trim().toLowerCase())).map((student) => (
                        <tr key={student.id}>
                          <td><div className="academics-name"><strong>{student.first_name} {student.last_name}</strong><span>{student.email || 'No email provided'}</span></div></td>
                          <td><span className="roll-number">{student.roll_number}</span></td>
                          <td>{student.department}</td>
                          <td><span className="semester-badge">Semester {student.semester}</span></td>
                          <td><select className={`attendance-status-select ${attendanceMarks[student.id] ? `status-${attendanceMarks[student.id].toLowerCase()}` : ''}`} aria-label={`Attendance status for ${student.first_name} ${student.last_name}`} value={attendanceMarks[student.id] ?? ''} onChange={(event) => setAttendanceMarks((current) => ({ ...current, [student.id]: event.target.value as AttendanceStatus }))}><option value="">Unmarked</option><option value="Present">Present</option><option value="Absent">Absent</option><option value="Late">Late</option></select></td>
                        </tr>
                      ))}</tbody>
                    </table>
                  </div>
                )}
                <div className="academics-footer"><span>{attendanceStudents.filter((student) => !search.trim() || `${student.first_name} ${student.last_name} ${student.roll_number} ${student.department}`.toLowerCase().includes(search.trim().toLowerCase())).length} students shown · {attendanceRecords.length} previously saved for this session</span><button className="primary-button" onClick={() => void saveAttendance()} disabled={savingAttendance || loadingAttendance || !attendanceSubjectId}>{savingAttendance ? 'Saving…' : 'Save attendance'}</button></div>
              </article>
            </section>
          ) : activePage === 'Timetable' ? (
            <section className="academics-module">
              <div className="academics-summary">
                <article className="academics-stat"><span>Total sessions</span><strong>{timetableEntries.length}</strong><small>Stored in PostgreSQL</small></article>
                <article className="academics-stat"><span>Teaching faculty</span><strong>{new Set(timetableEntries.map((entry) => entry.faculty_id)).size}</strong><small>Assigned in this timetable</small></article>
                <article className="academics-stat"><span>Connection</span><strong>{loadingTimetable ? 'Loading…' : timetableError ? 'Check' : 'Ready'}</strong><small>{timetableError ? 'Check the timetable API' : 'Timetable API connected'}</small></article>
              </div>
              {timetableMessage && <div className="academics-alert academics-success" role="status"><CheckCircle2 size={17} />{timetableMessage}<button onClick={() => setTimetableMessage('')} aria-label="Dismiss message"><X size={15} /></button></div>}
              {timetableError && <div className="academics-alert academics-error" role="alert"><span>{timetableError}</span><button className="secondary-button" onClick={() => void loadTimetable()}>Retry</button></div>}
              <article className="panel academics-panel">
                <div className="academics-toolbar"><div><h2>Class timetable</h2><p>Manage sessions, teaching assignments, and rooms.</p></div><div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}><button className="secondary-button" onClick={() => void loadTimetable()} disabled={loadingTimetable}>Refresh</button><button className="secondary-button" onClick={() => void generateTimetable()} disabled={loadingTimetable || savingTimetable}>Auto-generate</button><button className="primary-button" onClick={() => openTimetableForm()}><Plus size={16} /> Add session</button></div></div>
                {loadingTimetable ? <div className="academics-empty"><div className="loading-spinner" /><p>Loading timetable…</p></div> : timetableEntries.length === 0 ? <div className="academics-empty"><CalendarDays size={34} /><strong>No timetable entries yet</strong><p>Add a session to start building your weekly timetable.</p><button className="primary-button" onClick={() => openTimetableForm()}><Plus size={16} /> Add first session</button></div> : <div className="academics-table-wrap"><table className="academics-table"><thead><tr><th>Day / time</th><th>Class</th><th>Subject</th><th>Faculty</th><th>Room</th><th>Actions</th></tr></thead><tbody>{timetableEntries.filter((entry) => !search.trim() || `${entry.class_name} ${entry.subject_name} ${entry.room_name} ${entry.first_name ?? ''} ${entry.last_name ?? ''} ${entry.day_of_week}`.toLowerCase().includes(search.trim().toLowerCase())).map((entry) => <tr key={entry.id}><td><div className="academics-name"><strong>{entry.day_of_week}</strong><span>{entry.start_time.slice(0, 5)}–{entry.end_time.slice(0, 5)}</span></div></td><td>{entry.class_name}</td><td>{entry.subject_name}</td><td><div className="academics-name"><strong>{[entry.first_name, entry.last_name].filter(Boolean).join(' ') || `Faculty #${entry.faculty_id}`}</strong><span>{entry.employee_id || ''}</span></div></td><td>{entry.room_name}</td><td><div className="student-actions"><button className="student-action edit-action" onClick={() => openTimetableForm(entry)} aria-label="Edit timetable entry" title="Edit"><Pencil size={16} /></button><button className="student-action delete-action" onClick={() => void deleteTimetable(entry)} aria-label="Delete timetable entry" title="Delete"><Trash2 size={16} /></button></div></td></tr>)}</tbody></table></div>}
                <div className="academics-footer"><span>Showing {timetableEntries.filter((entry) => !search.trim() || `${entry.class_name} ${entry.subject_name} ${entry.room_name} ${entry.first_name ?? ''} ${entry.last_name ?? ''} ${entry.day_of_week}`.toLowerCase().includes(search.trim().toLowerCase())).length} of {timetableEntries.length} sessions</span><button className="text-action" onClick={() => void loadTimetable()} disabled={loadingTimetable}>Refresh records <ArrowRight size={14} /></button></div>
              </article>
            </section>
          ) : activePage === 'Faculty & HR' ? (
            <section className="academics-module faculty-module">
              <div className="academics-summary">
                <article className="academics-stat"><span>Total faculty</span><strong>{faculty.length}</strong><small>Faculty records in the database</small></article>
                <article className="academics-stat"><span>Active faculty</span><strong>{faculty.filter((member) => member.employment_status === 'Active').length}</strong><small>Currently marked as active</small></article>
                <article className="academics-stat"><span>Connection status</span><strong>{loadingFaculty ? 'Loading…' : facultyError ? 'Check' : 'Ready'}</strong><small>{loadingFaculty ? 'Fetching faculty records' : facultyError ? 'Check the faculty API' : 'Faculty API connected'}</small></article>
              </div>
              {facultyMessage && <div className="academics-alert academics-success" role="status"><CheckCircle2 size={17} /><span>{facultyMessage}</span><button onClick={() => setFacultyMessage('')} aria-label="Dismiss message"><X size={15} /></button></div>}
              {facultyError && <div className="academics-alert academics-error" role="alert"><span>{facultyError}</span><button className="secondary-button" onClick={() => void loadFaculty()} disabled={loadingFaculty}>Retry</button></div>}
              <article className="panel academics-panel">
                <div className="academics-toolbar"><div><h2>Faculty directory</h2><p>View, add, and update faculty and HR records.</p></div><button className="primary-button" onClick={() => openFacultyForm()}><Plus size={16} /> Add faculty</button></div>
                {loadingFaculty ? <div className="academics-empty"><div className="loading-spinner" /><p>Loading faculty records…</p></div> : filteredFaculty.length === 0 ? <div className="academics-empty"><Users size={34} /><strong>{faculty.length === 0 ? 'No faculty records yet' : 'No matching faculty'}</strong><p>{faculty.length === 0 ? 'Add a faculty member to start building your directory.' : 'Try a different name, employee ID, or department.'}</p>{faculty.length === 0 && <button className="primary-button" onClick={() => openFacultyForm()}><Plus size={16} /> Add first faculty member</button>}</div> : <div className="academics-table-wrap"><table className="academics-table faculty-table"><thead><tr><th>Faculty member</th><th>Employee ID</th><th>Department</th><th>Designation</th><th>Contact</th><th>Status</th><th>Actions</th></tr></thead><tbody>{filteredFaculty.map((member) => <tr key={member.id}><td><div className="academics-name faculty-person-cell"><strong>{member.first_name} {member.last_name}</strong><span>{member.email || 'No email provided'}</span></div></td><td><span className="roll-number">{member.employee_id}</span></td><td>{member.department}</td><td>{member.designation}</td><td>{member.phone || '—'}</td><td><span className={`faculty-status ${member.employment_status === 'Active' ? 'faculty-status-active' : 'faculty-status-inactive'}`}>{member.employment_status}</span></td><td><div className="student-actions"><button className="student-action edit-action" onClick={() => openFacultyForm(member)} aria-label={`Edit ${member.first_name} ${member.last_name}`} title="Edit faculty"><Pencil size={16} /></button><button className="student-action delete-action" onClick={() => void deleteFaculty(member)} aria-label={`Delete ${member.first_name} ${member.last_name}`} title="Delete faculty"><Trash2 size={16} /></button></div></td></tr>)}</tbody></table></div>}
                <div className="academics-footer"><span>Showing {filteredFaculty.length} of {faculty.length} faculty records</span><button className="text-action" onClick={() => void loadFaculty()} disabled={loadingFaculty}>Refresh records <ArrowRight size={14} /></button></div>
              </article>
            </section>
          ) : activePage === 'Payroll' ? (
            <section className="academics-module">
              <div className="academics-summary">
                <article className="academics-stat"><span>Payroll records</span><strong>{payrollRecords.length}</strong><small>Records returned by the payroll API</small></article>
                <article className="academics-stat"><span>Pending payments</span><strong>{payrollRecords.filter((record) => record.status === 'Pending').length}</strong><small>Awaiting payment</small></article>
                <article className="academics-stat"><span>Net payroll total</span><strong>{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(payrollRecords.reduce((sum, record) => sum + Number(record.net_salary || 0), 0))}</strong><small>Across the listed records</small></article>
              </div>
              {payrollMessage && <div className="academics-alert academics-success" role="status"><CheckCircle2 size={17} /><span>{payrollMessage}</span><button onClick={() => setPayrollMessage('')} aria-label="Dismiss message"><X size={15} /></button></div>}
              {payrollError && <div className="academics-alert academics-error" role="alert"><span>{payrollError}</span><button className="secondary-button" onClick={() => { void loadPayroll(); void loadFaculty() }}>Retry</button></div>}
              <article className="panel academics-panel">
                <div className="academics-toolbar"><div><h2>Faculty payroll</h2><p>Create monthly payroll records and track payment status.</p></div><button className="secondary-button" onClick={() => { void loadPayroll(); void loadFaculty() }} disabled={loadingPayroll}><ArrowRight size={14} /> Refresh records</button></div>
                {loadingPayroll ? <div className="academics-empty"><div className="loading-spinner" /><p>Loading payroll records…</p></div> : payrollRecords.length === 0 ? <div className="academics-empty"><Wallet size={34} /><strong>No payroll records yet</strong><p>Create a payroll record for a faculty member to get started.</p><button className="primary-button" onClick={() => { setPayrollForm({ ...emptyPayrollForm, faculty_id: faculty[0]?.id ?? 0 }); setShowPayrollForm(true) }} disabled={faculty.length === 0}><Plus size={16} /> Create first payroll</button>{faculty.length === 0 && <p>Add a faculty member first.</p>}</div> : <div className="academics-table-wrap"><table className="academics-table"><thead><tr><th>Faculty</th><th>Month</th><th>Department</th><th>Gross salary</th><th>Deductions</th><th>Net salary</th><th>Status</th><th>Action</th></tr></thead><tbody>{payrollRecords.filter((record) => !search.trim() || `${record.employee_id} ${record.first_name} ${record.last_name} ${record.department} ${record.payroll_month} ${record.status}`.toLowerCase().includes(search.trim().toLowerCase())).map((record) => <tr key={record.id}><td><div className="academics-name"><strong>{record.first_name} {record.last_name}</strong><span>{record.employee_id}</span></div></td><td>{String(record.payroll_month || '').slice(0, 7) || '—'}</td><td>{record.department}</td><td>{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(Number(record.gross_salary || 0))}</td><td>{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(Number(record.deductions || 0))}</td><td><strong>{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(Number(record.net_salary || 0))}</strong></td><td><span className={`faculty-status ${record.status === 'Paid' ? 'faculty-status-active' : 'faculty-status-inactive'}`}>{record.status}</span></td><td><button className="secondary-button" onClick={() => void updatePayrollStatus(record, record.status === 'Paid' ? 'Pending' : 'Paid')}>{record.status === 'Paid' ? 'Mark pending' : 'Mark paid'}</button></td></tr>)}</tbody></table></div>}
                <div className="academics-footer"><span>Showing {payrollRecords.filter((record) => !search.trim() || `${record.employee_id} ${record.first_name} ${record.last_name} ${record.department} ${record.payroll_month} ${record.status}`.toLowerCase().includes(search.trim().toLowerCase())).length} of {payrollRecords.length} records</span><span>Amounts displayed in INR</span></div>
              </article>
            </section>
          ) : activePage === 'Research & Publications' ? (
            <ResearchWorkspace />
          ) : activePage === 'Reports & Analytics' ? (
            <ReportsWorkspace />
          ) : activePage === 'Dashboard' ? (
            <>
              <section

                className="metrics-grid"
                aria-label="Institutional summary"
              >
                {metrics.map(
                  ({
                    label,
                    value,
                    change,
                    description,
                    icon: Icon,
                    color,
                    up,
                  }) => (
                    <article className="metric-card" key={label}>
                      <div className="metric-top">
                        <div className={`metric-icon ${color}`}>
                          <Icon size={20} strokeWidth={1.9} />
                        </div>
                        <span className="metric-menu">···</span>
                      </div>

                      <p className="metric-label">{label}</p>
                      <div className="metric-value">{value}</div>

                      <div className="metric-bottom">
                        <span
                          className={`metric-change ${up ? 'positive' : 'negative'
                            }`}
                        >
                          {up ? (
                            <ArrowUpRight size={14} />
                          ) : (
                            <ArrowDownRight size={14} />
                          )}
                          {change}
                        </span>
                        <span className="metric-description">
                          {description}
                        </span>
                      </div>
                    </article>
                  ),
                )}
              </section>

              <section className="dashboard-grid">
                <article className="panel attendance-panel">
                  <div className="panel-heading">
                    <div>
                      <h2>Attendance overview</h2>
                      <p>Illustrative daily attendance figures</p>
                    </div>

                    <select
                      value={period}
                      onChange={(event) => setPeriod(event.target.value)}
                      aria-label="Attendance period"
                      className="period-select"
                    >
                      <option>This week</option>
                      <option>Last week</option>
                      <option>This month</option>
                    </select>
                  </div>

                  <div className="chart-summary">
                    <div>
                      <span className="chart-dot student-dot" />
                      Students <strong>87.6%</strong>
                    </div>
                    <div>
                      <span className="chart-dot faculty-dot" />
                      Faculty <strong>93.2%</strong>
                    </div>
                  </div>

                  <div
                    className="bar-chart"
                    role="img"
                    aria-label="Illustrative weekly attendance chart"
                  >
                    <div className="chart-grid-lines">
                      <span>100%</span>
                      <span>75%</span>
                      <span>50%</span>
                      <span>25%</span>
                      <span>0%</span>
                    </div>

                    <div className="chart-bars">
                      {attendanceData.map((day) => (
                        <div className="chart-day" key={day.day}>
                          <div className="bar-pair">
                            <div className="bar-track">
                              <div
                                className="bar student-bar"
                                style={{ height: `${day.students}%` }}
                              />
                            </div>
                            <div className="bar-track">
                              <div
                                className="bar faculty-bar"
                                style={{ height: `${day.faculty}%` }}
                              />
                            </div>
                          </div>
                          <span>{day.day}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="chart-footer">
                    <span>Sample data · Not connected to attendance records</span>
                    <button onClick={() => selectPage('Attendance')}>
                      Attendance details <ArrowRight size={14} />
                    </button>
                  </div>
                </article>

                <article className="panel requests-panel">
                  <div className="panel-heading">
                    <div>
                      <h2>Pending requests</h2>
                      <p>Sample administrative requests</p>
                    </div>
                    <button
                      className="text-action"
                      onClick={() => selectPage('Students')}
                    >
                      Student records <ArrowRight size={14} />
                    </button>
                  </div>

                  <div className="request-list">
                    {requests
                      .filter(
                        (request) =>
                          !resolved.includes(request.name) &&
                          `${request.name} ${request.detail} ${request.type}`
                            .toLowerCase()
                            .includes(search.toLowerCase()),
                      )
                      .map((request) => (
                        <div className="request-item" key={request.name}>
                          <div
                            className={`avatar request-avatar ${request.color}`}
                          >
                            {request.initials}
                          </div>
                          <div className="request-copy">
                            <strong>{request.name}</strong>
                            <span>{request.detail}</span>
                            <small>{request.type}</small>
                          </div>
                          <button
                            className="review-button"
                            onClick={() =>
                              setResolved((current) => [
                                ...current,
                                request.name,
                              ])
                            }
                          >
                            Review
                          </button>
                        </div>
                      ))}

                    {requests.every(
                      (request) =>
                        resolved.includes(request.name) ||
                        !`${request.name} ${request.detail} ${request.type}`
                          .toLowerCase()
                          .includes(search.toLowerCase()),
                    ) && (
                        <div className="empty-state">
                          <CheckCircle2 size={22} />
                          <span>No matching pending requests.</span>
                        </div>
                      )}
                  </div>

                  <div className="requests-footer">
                    <span>
                      {requests.filter((item) => !resolved.includes(item.name))
                        .length}{' '}
                      sample requests remaining
                    </span>
                    <button onClick={() => setResolved([])}>
                      Reset demo
                    </button>
                  </div>
                </article>
              </section>

              <section className="bottom-grid">
                <article className="panel activity-panel">
                  <div className="panel-heading">
                    <div>
                      <h2>Recent activity</h2>
                      <p>Sample system events</p>
                    </div>
                    <button
                      className="text-action"
                      onClick={() => selectPage('Reports & Analytics')}
                    >
                      Activity log <ArrowRight size={14} />
                    </button>
                  </div>

                  <div className="activity-list">
                    {activities.map((activity, index) => (
                      <div className="activity-row" key={activity.title}>
                        <div className={`activity-icon activity-${index}`}>
                          <activity.icon size={17} />
                        </div>
                        <div className="activity-copy">
                          <strong>{activity.title}</strong>
                          <span>{activity.detail}</span>
                        </div>
                        <time>{activity.time}</time>
                      </div>
                    ))}
                  </div>
                </article>

                <article className="panel quick-panel">
                  <div className="panel-heading">
                    <div>
                      <h2>Quick access</h2>
                      <p>Frequently used workspaces</p>
                    </div>
                  </div>

                  <div className="quick-links">
                    <button onClick={() => selectPage('Students')}>
                      <span className="quick-icon quick-blue">
                        <GraduationCap size={19} />
                      </span>
                      <span>
                        <strong>Student records</strong>
                        <small>Connected to PostgreSQL</small>
                      </span>
                      <ArrowRight size={16} />
                    </button>

                    <button onClick={() => selectPage('Timetable')}>
                      <span className="quick-icon quick-violet">
                        <CalendarDays size={19} />
                      </span>
                      <span>
                        <strong>Class timetable</strong>
                        <small>Schedules and rooms</small>
                      </span>
                      <ArrowRight size={16} />
                    </button>

                    <button onClick={() => selectPage('Faculty & HR')}>
                      <span className="quick-icon quick-teal">
                        <Users size={19} />
                      </span>
                      <span>
                        <strong>Faculty directory</strong>
                        <small>Staff and departments</small>
                      </span>
                      <ArrowRight size={16} />
                    </button>
                  </div>
                </article>
              </section>
            </>
          ) : (
            <section className="module-notice">
              <div className="module-notice-icon">
                <BookOpen size={20} />
              </div>
              <div>
                <strong>{activePage} workspace</strong>
                <p>
                  This module is not connected yet. The Students module is
                  currently connected to PostgreSQL. Other modules will be
                  developed step by step.
                </p>
              </div>
            </section>
          )}

          <footer className="page-footer">
            <span>
              Kirti College ERP <span className="footer-separator">·</span>{' '}
              Development preview
            </span>
            <span>Academic year 2026–27</span>
          </footer>
        </div>
      </main>

      <style>{`
        .attendance-performance-stats{padding:18px 22px;grid-template-columns:repeat(3,minmax(0,1fr));background:#fbfcfe}.attendance-warning-number{color:#b42318!important}.attendance-good-number{color:#16804a!important}.attendance-percent-cell{min-width:100px;display:grid;gap:6px}.attendance-percent-cell strong{font-size:13px}.attendance-percent-track{height:6px;background:#edf0f5;border-radius:99px;overflow:hidden}.attendance-percent-track span{display:block;height:100%;border-radius:99px}.attendance-percent-low{background:#dc5b52}.attendance-percent-ok{background:#24a36a}.attendance-alert-badge,.attendance-ok-badge{display:inline-flex;align-items:center;gap:5px;padding:5px 8px;border-radius:999px;font-size:11px;font-weight:700;white-space:nowrap}.attendance-alert-badge{color:#a3322a;background:#fff0ee;border:1px solid #f4cbc7}.attendance-ok-badge{color:#197346;background:#effaf4;border:1px solid #ccefdc}.attendance-summary-table td{white-space:nowrap}.attendance-summary-table td:first-child{white-space:normal}@media(max-width:700px){.attendance-performance-stats{grid-template-columns:1fr}}
        .attendance-controls{display:grid;grid-template-columns:minmax(180px,230px) minmax(240px,1fr) minmax(200px,1fr);align-items:end;gap:16px;padding:20px 24px;border-bottom:1px solid var(--border,#e7eaf0)}.attendance-controls label{display:grid;gap:7px;font-size:12px;font-weight:650;color:#46536a}.attendance-controls input,.attendance-controls select,.attendance-status-select{box-sizing:border-box;width:100%;border:1px solid #dce2eb;border-radius:9px;padding:10px 11px;background:white;color:#1f2937;font:inherit;font-size:13px}.attendance-control-note{font-size:12px;color:#748095;padding-bottom:10px}.attendance-status-select{min-width:125px;max-width:180px}.attendance-status-select.status-present{border-color:#a7e2bf;background:#effaf4;color:#197346}.attendance-status-select.status-absent{border-color:#f1b9b5;background:#fff3f2;color:#a3322a}.attendance-status-select.status-late{border-color:#f4d28a;background:#fff9e9;color:#8b5b0b}.attendance-table td{vertical-align:middle}@media(max-width:800px){.attendance-controls{grid-template-columns:1fr}.attendance-control-note{padding-bottom:0}}
        .academics-module{display:grid;gap:20px}.academics-summary{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px}.academics-stat{background:var(--panel,#fff);border:1px solid var(--border,#e7eaf0);border-radius:16px;padding:20px;display:flex;flex-direction:column;gap:7px;min-width:0}.academics-stat>span,.academics-stat small{color:var(--muted,#687386);font-size:12px}.academics-stat strong{font-size:27px;color:var(--text,#172033)}.academics-panel{overflow:hidden}.academics-toolbar{display:flex;justify-content:space-between;align-items:center;gap:16px;padding:22px 24px;border-bottom:1px solid var(--border,#e7eaf0);flex-wrap:wrap}.academics-toolbar h2{margin:0 0 5px;font-size:17px}.academics-toolbar p{margin:0;color:var(--muted,#687386);font-size:13px}.academics-tabs{display:flex;gap:5px;padding:4px;border-radius:11px;background:#f1f4f9}.academics-tab{border:0;border-radius:8px;padding:9px 13px;background:transparent;color:#647084;font:inherit;font-size:13px;cursor:pointer}.academics-tab.active{background:white;color:#2457d6;box-shadow:0 1px 4px #17203314;font-weight:650}.academics-tab span{margin-left:5px;color:inherit}.academics-table-wrap{width:100%;overflow-x:auto}.academics-table{width:100%;border-collapse:collapse;text-align:left;font-size:13px}.academics-table th{padding:13px 18px;background:#f8f9fc;color:#69758a;font-size:11px;text-transform:uppercase;letter-spacing:.045em;white-space:nowrap}.academics-table td{padding:15px 18px;border-top:1px solid #edf0f5;color:#39465a;vertical-align:middle}.academics-name{display:flex;flex-direction:column;gap:4px;min-width:130px}.academics-name strong{color:#1e293b;font-weight:650}.academics-name span{color:#788397;font-size:12px}.academics-empty{min-height:220px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;text-align:center;padding:32px;color:#7b8799}.academics-empty strong{color:#263348;font-size:15px}.academics-empty p{margin:0 0 5px;font-size:13px}.academics-footer{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:15px 22px;border-top:1px solid var(--border,#e7eaf0);font-size:12px;color:#748095}.academics-alert{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 15px;border-radius:10px;font-size:13px}.academics-alert button{flex-shrink:0}.academics-success{background:#effaf4;color:#197346;border:1px solid #ccefdc}.academics-error{background:#fff3f2;color:#a3322a;border:1px solid #f5d0cd}.academics-modal-backdrop{position:fixed;inset:0;background:#10182880;z-index:1000;display:flex;align-items:center;justify-content:center;padding:20px;overflow-y:auto}.academics-modal{width:min(620px,100%);max-height:calc(100vh - 40px);overflow-y:auto;background:white;border-radius:18px;box-shadow:0 24px 80px #11182735}.academics-modal-head{display:flex;justify-content:space-between;align-items:flex-start;gap:14px;padding:23px 25px;border-bottom:1px solid #e9edf3}.academics-modal-head h2{margin:5px 0;font-size:20px;color:#172033}.academics-modal-head p{margin:0;color:#7a8598;font-size:13px}.academics-form{padding:22px 25px;display:grid;gap:15px}.academics-form label{display:grid;gap:7px;font-size:12px;font-weight:650;color:#46536a}.academics-form input,.academics-form select,.academics-form textarea{width:100%;box-sizing:border-box;border:1px solid #dce2eb;border-radius:9px;padding:11px 12px;background:white;color:#1f2937;font:inherit;font-size:13px;outline:none}.academics-form input:focus,.academics-form select:focus,.academics-form textarea:focus{border-color:#7195f5;box-shadow:0 0 0 3px #356cf11a}.academics-form textarea{min-height:75px;resize:vertical}.academics-form-row{display:grid;grid-template-columns:1fr 1fr;gap:14px}.academics-form-actions{display:flex;justify-content:flex-end;gap:10px;padding-top:6px}.academics-modal .eyebrow{font-size:10px;color:#5274d8;letter-spacing:.08em;font-weight:750}@media(max-width:700px){.academics-summary{grid-template-columns:1fr}.academics-toolbar{align-items:flex-start}.academics-form-row{grid-template-columns:1fr}.academics-modal-backdrop{padding:10px}.academics-form,.academics-modal-head{padding:18px}.academics-footer{align-items:flex-start;flex-direction:column}}
      `}</style>

      {showTimetableForm && (
        <div className="academics-modal-backdrop" onMouseDown={(event) => {
          if (event.target === event.currentTarget && !savingTimetable) setShowTimetableForm(false)
        }}>
          <section className="academics-modal" role="dialog" aria-modal="true" aria-labelledby="timetable-form-title">
            <div className="academics-modal-head">
              <div><span className="eyebrow">TIMETABLE MANAGEMENT</span><h2 id="timetable-form-title">{editingTimetable ? 'Edit session' : 'Add timetable session'}</h2><p>Set the class, subject, faculty, room, and session time.</p></div>
              <button className="icon-button" onClick={() => setShowTimetableForm(false)} disabled={savingTimetable} aria-label="Close form"><X size={19} /></button>
            </div>
            <form className="academics-form" onSubmit={saveTimetable}>
              <div className="academics-form-row">
                <label>Day *
                  <select required value={timetableForm.day_of_week} onChange={(event) => setTimetableForm((current) => ({ ...current, day_of_week: event.target.value }))}>
                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => <option key={day} value={day}>{day}</option>)}
                  </select>
                </label>
                <label>Class / division *
                  <input required maxLength={100} value={timetableForm.class_name} onChange={(event) => setTimetableForm((current) => ({ ...current, class_name: event.target.value }))} placeholder="e.g. TYBSc IT A" />
                </label>
              </div>
              <label>Subject *
                <select required value={timetableForm.subject_name} onChange={(event) => setTimetableForm((current) => ({ ...current, subject_name: event.target.value }))}>
                  <option value="" disabled>Select a subject</option>
                  {subjects.map((subject) => <option key={subject.id} value={subject.subject_name}>{subject.subject_code} — {subject.subject_name}</option>)}
                </select>
              </label>
              <label>Faculty *
                <select required value={timetableForm.faculty_id} onChange={(event) => setTimetableForm((current) => ({ ...current, faculty_id: Number(event.target.value) }))}>
                  <option value={0} disabled>Select faculty</option>
                  {faculty.filter((member) => member.employment_status === 'Active').map((member) => <option key={member.id} value={member.id}>{member.employee_id} — {member.first_name} {member.last_name}</option>)}
                </select>
              </label>
              <label>Room *
                <input required maxLength={100} value={timetableForm.room_name} onChange={(event) => setTimetableForm((current) => ({ ...current, room_name: event.target.value }))} placeholder="e.g. Room 204" />
              </label>
              <div className="academics-form-row">
                <label>Start time *
                  <input required type="time" value={timetableForm.start_time} onChange={(event) => setTimetableForm((current) => ({ ...current, start_time: event.target.value }))} />
                </label>
                <label>End time *
                  <input required type="time" min={timetableForm.start_time} value={timetableForm.end_time} onChange={(event) => setTimetableForm((current) => ({ ...current, end_time: event.target.value }))} />
                </label>
              </div>
              {timetableError && <div className="academics-alert academics-error" role="alert">{timetableError}</div>}
              <div className="academics-form-actions">
                <button type="button" className="secondary-button" disabled={savingTimetable} onClick={() => setShowTimetableForm(false)}>Cancel</button>
                <button type="submit" className="primary-button" disabled={savingTimetable || subjects.length === 0 || faculty.filter((member) => member.employment_status === 'Active').length === 0}>{savingTimetable ? 'Saving…' : editingTimetable ? 'Save changes' : 'Add session'}</button>
              </div>
              {(subjects.length === 0 || faculty.filter((member) => member.employment_status === 'Active').length === 0) && <p style={{ padding: '0 25px 18px', margin: 0, color: '#a3322a', fontSize: 12 }}>Add at least one subject in Academics and one active faculty member in Faculty &amp; HR before creating a session.</p>}
            </form>
          </section>
        </div>
      )}

      {academicsModal && (
        <div className="academics-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget && !savingAcademic) setAcademicsModal(null) }}>
          <section className="academics-modal" role="dialog" aria-modal="true" aria-labelledby="academics-form-title">
            <div className="academics-modal-head"><div><span className="eyebrow">ACADEMIC MANAGEMENT</span><h2 id="academics-form-title">{academicsModal === 'course' ? (editingCourse ? 'Edit course' : 'Add course') : (editingSubject ? 'Edit subject' : 'Add subject')}</h2><p>{academicsModal === 'course' ? 'Enter the course details for your academic catalogue.' : 'Link the subject to a course and semester.'}</p></div><button className="icon-button" onClick={() => setAcademicsModal(null)} disabled={savingAcademic} aria-label="Close form"><X size={19} /></button></div>
            <form className="academics-form" onSubmit={saveAcademic}>
              {academicsModal === 'course' ? <>
                <div className="academics-form-row"><label>Course code *<input required maxLength={30} value={courseForm.course_code} onChange={(e) => setCourseForm((f) => ({ ...f, course_code: e.target.value }))} placeholder="e.g. BSCIT" /></label><label>Course name *<input required maxLength={150} value={courseForm.course_name} onChange={(e) => setCourseForm((f) => ({ ...f, course_name: e.target.value }))} placeholder="e.g. B.Sc. Information Technology" /></label></div>
                <label>Department *<input required maxLength={100} value={courseForm.department} onChange={(e) => setCourseForm((f) => ({ ...f, department: e.target.value }))} placeholder="Department name" /></label>
                <div className="academics-form-row"><label>Duration (years) *<select value={courseForm.duration_years} onChange={(e) => setCourseForm((f) => ({ ...f, duration_years: Number(e.target.value) }))}>{[1, 2, 3, 4, 5, 6].map((n) => <option key={n} value={n}>{n} {n === 1 ? 'year' : 'years'}</option>)}</select></label><label>Total semesters *<select value={courseForm.total_semesters} onChange={(e) => setCourseForm((f) => ({ ...f, total_semesters: Number(e.target.value) }))}>{Array.from({ length: 12 }, (_, i) => i + 1).map((n) => <option key={n} value={n}>{n} semesters</option>)}</select></label></div>
                <label>Description<textarea maxLength={1000} value={courseForm.description} onChange={(e) => setCourseForm((f) => ({ ...f, description: e.target.value }))} placeholder="Optional course description" /></label>
              </> : <>
                <div className="academics-form-row"><label>Subject code *<input required maxLength={30} value={subjectForm.subject_code} onChange={(e) => setSubjectForm((f) => ({ ...f, subject_code: e.target.value }))} placeholder="e.g. IT601" /></label><label>Subject name *<input required maxLength={150} value={subjectForm.subject_name} onChange={(e) => setSubjectForm((f) => ({ ...f, subject_name: e.target.value }))} placeholder="Subject name" /></label></div>
                <label>Course *<select required value={subjectForm.course_id} onChange={(e) => { const courseId = Number(e.target.value); const max = courses.find((c) => c.id === courseId)?.total_semesters ?? 1; setSubjectForm((f) => ({ ...f, course_id: courseId, semester: Math.min(f.semester, max) })) }}><option value={0} disabled>Select a course</option>{courses.map((course) => <option key={course.id} value={course.id}>{course.course_code} — {course.course_name}</option>)}</select></label>
                <div className="academics-form-row"><label>Semester *<select required value={subjectForm.semester} onChange={(e) => setSubjectForm((f) => ({ ...f, semester: Number(e.target.value) }))}>{Array.from({ length: Math.max(1, courses.find((c) => c.id === subjectForm.course_id)?.total_semesters ?? 1) }, (_, i) => i + 1).map((n) => <option key={n} value={n}>Semester {n}</option>)}</select></label><label>Credits *<select required value={subjectForm.credits} onChange={(e) => setSubjectForm((f) => ({ ...f, credits: Number(e.target.value) }))}>{Array.from({ length: 10 }, (_, i) => i + 1).map((n) => <option key={n} value={n}>{n} {n === 1 ? 'credit' : 'credits'}</option>)}</select></label></div>
                <label>Description<textarea maxLength={1000} value={subjectForm.description} onChange={(e) => setSubjectForm((f) => ({ ...f, description: e.target.value }))} placeholder="Optional subject description" /></label>
              </>}
              {academicsError && <div className="academics-alert academics-error" role="alert">{academicsError}</div>}
              <div className="academics-form-actions"><button type="button" className="secondary-button" disabled={savingAcademic} onClick={() => setAcademicsModal(null)}>Cancel</button><button type="submit" className="primary-button" disabled={savingAcademic || (academicsModal === 'subject' && courses.length === 0)}>{savingAcademic ? 'Saving…' : academicsModal === 'course' ? (editingCourse ? 'Save changes' : 'Add course') : (editingSubject ? 'Save changes' : 'Add subject')}</button></div>
            </form>
          </section>
        </div>
      )}

      {showFacultyForm && (
        <div className="academics-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget && !savingFaculty) setShowFacultyForm(false) }}>
          <section className="academics-modal" role="dialog" aria-modal="true" aria-labelledby="faculty-form-title">
            <div className="academics-modal-head"><div><span className="eyebrow">FACULTY &amp; HR</span><h2 id="faculty-form-title">{editingFaculty ? 'Edit faculty member' : 'Add faculty member'}</h2><p>Enter faculty employment and contact details.</p></div><button className="icon-button" onClick={() => setShowFacultyForm(false)} disabled={savingFaculty} aria-label="Close form"><X size={19} /></button></div>
            <form className="academics-form" onSubmit={saveFaculty}>
              <div className="academics-form-row"><label>Employee ID *<input required maxLength={40} value={facultyForm.employee_id} onChange={(event) => updateFacultyField('employee_id', event.target.value)} placeholder="e.g. FAC002" /></label><label>Designation *<input required maxLength={100} value={facultyForm.designation} onChange={(event) => updateFacultyField('designation', event.target.value)} placeholder="e.g. Assistant Professor" /></label></div>
              <div className="academics-form-row"><label>First name *<input required maxLength={100} value={facultyForm.first_name} onChange={(event) => updateFacultyField('first_name', event.target.value)} /></label><label>Last name *<input required maxLength={100} value={facultyForm.last_name} onChange={(event) => updateFacultyField('last_name', event.target.value)} /></label></div>
              <label>Department *<select required value={facultyForm.department} onChange={(event) => updateFacultyField('department', event.target.value)}>{['Information Technology', 'Computer Science', 'Commerce', 'Arts', 'Science', 'Management Studies', 'Administration', 'Library'].map((department) => <option key={department} value={department}>{department}</option>)}</select></label>
              <div className="academics-form-row"><label>Email<input type="email" maxLength={150} value={facultyForm.email} onChange={(event) => updateFacultyField('email', event.target.value)} placeholder="name@college.edu" /></label><label>Phone<input type="tel" maxLength={30} value={facultyForm.phone} onChange={(event) => updateFacultyField('phone', event.target.value)} /></label></div>
              <div className="academics-form-row"><label>Joining date<input type="date" value={facultyForm.joining_date} onChange={(event) => updateFacultyField('joining_date', event.target.value)} /></label><label>Employment status<select value={facultyForm.employment_status} onChange={(event) => updateFacultyField('employment_status', event.target.value as FacultyForm['employment_status'])}><option value="Active">Active</option><option value="Inactive">Inactive</option></select></label></div>
              {facultyError && <div className="academics-alert academics-error" role="alert">{facultyError}</div>}
              <div className="academics-form-actions"><button type="button" className="secondary-button" disabled={savingFaculty} onClick={() => setShowFacultyForm(false)}>Cancel</button><button type="submit" className="primary-button" disabled={savingFaculty}>{savingFaculty ? 'Saving…' : editingFaculty ? 'Save changes' : 'Add faculty'}</button></div>
            </form>
          </section>
        </div>
      )}

      {showPayrollForm && (
        <div className="academics-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget && !savingPayroll) setShowPayrollForm(false) }}>
          <section className="academics-modal" role="dialog" aria-modal="true" aria-labelledby="payroll-form-title">
            <div className="academics-modal-head"><div><span className="eyebrow">PAYROLL MANAGEMENT</span><h2 id="payroll-form-title">Create payroll record</h2><p>Add one monthly payroll record for a faculty member.</p></div><button className="icon-button" onClick={() => setShowPayrollForm(false)} disabled={savingPayroll} aria-label="Close form"><X size={19} /></button></div>
            <form className="academics-form" onSubmit={savePayroll}>
              <label>Faculty member *<select required value={payrollForm.faculty_id || ''} onChange={(event) => setPayrollForm((current) => ({ ...current, faculty_id: Number(event.target.value) }))}><option value="" disabled>Select faculty</option>{faculty.filter((member) => member.employment_status === 'Active').map((member) => <option key={member.id} value={member.id}>{member.employee_id} — {member.first_name} {member.last_name}</option>)}</select></label>
              <label>Payroll month *<input type="month" required value={payrollForm.payroll_month} onChange={(event) => setPayrollForm((current) => ({ ...current, payroll_month: event.target.value }))} /></label>
              <div className="academics-form-row"><label>Basic salary (₹) *<input type="number" required min="0" step="0.01" value={payrollForm.basic_salary} onChange={(event) => setPayrollForm((current) => ({ ...current, basic_salary: Number(event.target.value) }))} /></label><label>Allowances (₹)<input type="number" required min="0" step="0.01" value={payrollForm.allowances} onChange={(event) => setPayrollForm((current) => ({ ...current, allowances: Number(event.target.value) }))} /></label></div>
              <label>Deductions (₹)<input type="number" required min="0" step="0.01" value={payrollForm.deductions} onChange={(event) => setPayrollForm((current) => ({ ...current, deductions: Number(event.target.value) }))} /></label>
              <p style={{ margin: 0, fontSize: 12, color: '#748095' }}>Estimated net salary: {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(Number(payrollForm.basic_salary) + Number(payrollForm.allowances) - Number(payrollForm.deductions))}</p>
              {payrollError && <div className="academics-alert academics-error" role="alert">{payrollError}</div>}
              <div className="academics-form-actions"><button type="button" className="secondary-button" disabled={savingPayroll} onClick={() => setShowPayrollForm(false)}>Cancel</button><button type="submit" className="primary-button" disabled={savingPayroll || faculty.filter((member) => member.employment_status === 'Active').length === 0}>{savingPayroll ? 'Saving…' : 'Create payroll'}</button></div>
              {faculty.filter((member) => member.employment_status === 'Active').length === 0 && <p style={{ margin: 0, fontSize: 12, color: '#a3322a' }}>Add an active faculty member before creating payroll.</p>}
            </form>
          </section>
        </div>
      )}

      {showStudentForm && (
        <div
          className="student-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !savingStudent) {
              setShowStudentForm(false)
            }
          }}
        >
          <section
            className="student-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="student-form-title"
          >
            <div className="student-modal-header">
              <div>
                <span className="eyebrow">STUDENT MANAGEMENT</span>
                <h2 id="student-form-title">
                  {editingStudent ? 'Edit student' : 'Add new student'}
                </h2>
                <p>
                  {editingStudent
                    ? 'Update the student information below.'
                    : 'Enter the information to create a student record.'}
                </p>
              </div>

              <button
                className="icon-button"
                onClick={() => setShowStudentForm(false)}
                disabled={savingStudent}
                aria-label="Close form"
              >
                <X size={20} />
              </button>
            </div>

            <form className="student-form" onSubmit={saveStudent}>
              <label>
                Roll number *
                <input
                  required
                  maxLength={30}
                  value={studentForm.roll_number}
                  onChange={(event) =>
                    updateStudentField('roll_number', event.target.value)
                  }
                  placeholder="e.g. TYIT001"
                />
              </label>

              <div className="student-form-row">
                <label>
                  First name *
                  <input
                    required
                    maxLength={100}
                    value={studentForm.first_name}
                    onChange={(event) =>
                      updateStudentField('first_name', event.target.value)
                    }
                    placeholder="First name"
                  />
                </label>

                <label>
                  Last name *
                  <input
                    required
                    maxLength={100}
                    value={studentForm.last_name}
                    onChange={(event) =>
                      updateStudentField('last_name', event.target.value)
                    }
                    placeholder="Last name"
                  />
                </label>
              </div>

              <label>
                Email address
                <input
                  type="email"
                  maxLength={150}
                  value={studentForm.email}
                  onChange={(event) =>
                    updateStudentField('email', event.target.value)
                  }
                  placeholder="student@example.com"
                />
              </label>

              <label>
                Phone number
                <input
                  type="tel"
                  maxLength={20}
                  value={studentForm.phone}
                  onChange={(event) =>
                    updateStudentField('phone', event.target.value)
                  }
                  placeholder="Phone number"
                />
              </label>

              <label>
                Department *
                <select
                  required
                  value={studentForm.department}
                  onChange={(event) =>
                    updateStudentField('department', event.target.value)
                  }
                >
                  <option>Information Technology</option>
                  <option>Computer Science</option>
                  <option>Commerce</option>
                  <option>Arts</option>
                  <option>Science</option>
                  <option>Management Studies</option>
                </select>
              </label>

              <div className="student-form-row">
                <label>
                  Academic year *
                  <input
                    required
                    maxLength={20}
                    value={studentForm.academic_year}
                    onChange={(event) =>
                      updateStudentField('academic_year', event.target.value)
                    }
                    placeholder="2026-2027"
                  />
                </label>

                <label>
                  Semester *
                  <select
                    required
                    value={studentForm.semester}
                    onChange={(event) =>
                      updateStudentField(
                        'semester',
                        Number(event.target.value),
                      )
                    }
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((semester) => (
                      <option key={semester} value={semester}>
                        Semester {semester}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              {studentsError && (
                <div className="student-alert error-alert" role="alert">
                  {studentsError}
                </div>
              )}

              <div className="student-form-actions">
                <button
                  type="button"
                  className="secondary-button"
                  disabled={savingStudent}
                  onClick={() => setShowStudentForm(false)}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="primary-button"
                  disabled={savingStudent}
                >
                  {savingStudent
                    ? 'Saving…'
                    : editingStudent
                      ? 'Save changes'
                      : 'Add student'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  )
}

export default App