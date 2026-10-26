import { useCallback, useEffect, useState } from 'react'

const API_BASE = `${import.meta.env.VITE_API_URL}/api`

type Student = {
  id: number
  department?: string
  academic_year?: string
}

type Faculty = {
  id: number
  department?: string
  employment_status?: string
}

type PayrollRecord = {
  id: number
  status?: string
  net_salary?: string | number
  payroll_month?: string
  department?: string
}

type ReportData = {
  students: Student[]
  faculty: Faculty[]
  payroll: PayrollRecord[]
  attendance: unknown
}

const money = (amount: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)

function getAttendanceText(value: unknown): string {
  if (value == null) return 'No attendance summary returned.'
  if (typeof value === 'string' || typeof value === 'number') return String(value)
  if (Array.isArray(value)) return `${value.length} summary entries returned.`
  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, item]) => ['string', 'number', 'boolean'].includes(typeof item))
      .slice(0, 6)
    if (entries.length) {
      return entries.map(([key, item]) =>
        `${key.replaceAll('_', ' ')}: ${String(item)}`,
      ).join(' · ')
    }
    return 'Attendance API connected; summary data is available.'
  }
  return 'Attendance API responded.'
}

export default function ReportsWorkspace() {
  const [data, setData] = useState<ReportData>({
    students: [],
    faculty: [],
    payroll: [],
    attendance: null,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [lastUpdated, setLastUpdated] = useState('')

  const loadReports = useCallback(async () => {
    setLoading(true)
    setError('')
    const endpoints = [
      fetch(`${API_BASE}/students`),
      fetch(`${API_BASE}/faculty`),
      fetch(`${API_BASE}/payroll`),
      fetch(`${API_BASE}/attendance/summary?threshold=75`),
    ]

    try {
      const responses = await Promise.all(endpoints)
      const failed = responses.find((response) => !response.ok)
      if (failed) {
        throw new Error(`A report API returned HTTP ${failed.status}. Check that the backend is running and the module API is available.`)
      }

      const [students, faculty, payroll, attendance] = await Promise.all(
        responses.map((response) => response.json()),
      )

      if (!Array.isArray(students) || !Array.isArray(faculty) || !Array.isArray(payroll)) {
        throw new Error('Students, faculty, or payroll API returned an unexpected response.')
      }

      setData({
        students,
        faculty,
        payroll,
        attendance,
      })
      setLastUpdated(new Date().toLocaleString())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load reports.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadReports()
  }, [loadReports])

  const activeFaculty = data.faculty.filter(
    (member) => member.employment_status === 'Active',
  ).length
  const pendingPayroll = data.payroll.filter(
    (record) => record.status === 'Pending',
  ).length
  const netPayroll = data.payroll.reduce(
    (sum, record) => sum + Number(record.net_salary || 0),
    0,
  )
  const departments = Array.from(
    new Set([
      ...data.students.map((student) => student.department),
      ...data.faculty.map((member) => member.department),
    ]),
  ).filter((department): department is string => Boolean(department)).sort()

  return (
    <section className="academics-module">
      <div className="academics-summary">
        <article className="academics-stat">
          <span>Total students</span>
          <strong>{loading ? '…' : data.students.length}</strong>
          <small>Live records from PostgreSQL</small>
        </article>
        <article className="academics-stat">
          <span>Total faculty</span>
          <strong>{loading ? '…' : data.faculty.length}</strong>
          <small>{loading ? 'Loading records' : `${activeFaculty} active faculty`}</small>
        </article>
        <article className="academics-stat">
          <span>Net payroll</span>
          <strong>{loading ? '…' : money(netPayroll)}</strong>
          <small>Across records returned by payroll API</small>
        </article>
        <article className="academics-stat">
          <span>Pending payments</span>
          <strong>{loading ? '…' : pendingPayroll}</strong>
          <small>Payroll records marked Pending</small>
        </article>
      </div>

      {error && (
        <div className="academics-alert academics-error" role="alert">
          <span>{error}</span>
          <button className="secondary-button" onClick={() => void loadReports()} disabled={loading}>
            Retry
          </button>
        </div>
      )}

      <div className="report-panels" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16, marginTop: 18 }}>
        <article className="academics-stat" style={{ minHeight: 180 }}>
          <span>Attendance summary</span>
          <strong style={{ fontSize: 16, marginTop: 12 }}>
            {loading ? 'Loading…' : error ? 'Unavailable' : 'API response'}
          </strong>
          <small style={{ marginTop: 8, lineHeight: 1.6, whiteSpace: 'normal' }}>
            {getAttendanceText(data.attendance)}
          </small>
          <small style={{ marginTop: 8 }}>
            Attendance summary uses the 75% threshold.
          </small>
        </article>

        <article className="academics-stat" style={{ minHeight: 180 }}>
          <span>Department overview</span>
          <strong style={{ fontSize: 16, marginTop: 12 }}>
            {loading ? 'Loading…' : `${departments.length} departments`}
          </strong>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
            {departments.length ? departments.map((department) => (
              <span key={department} style={{ padding: '6px 9px', borderRadius: 8, background: 'var(--surface-secondary, #f3f4f6)', fontSize: 12 }}>
                {department}
              </span>
            )) : <small>Department data will appear when records are available.</small>}
          </div>
        </article>
      </div>

      <div className="academics-footer" style={{ marginTop: 16 }}>
        <span>{lastUpdated ? `Last updated: ${lastUpdated}` : 'Reports load from your existing APIs.'}</span>
        <button className="primary-button" onClick={() => void loadReports()} disabled={loading}>
          {loading ? 'Refreshing…' : 'Refresh reports'}
        </button>
      </div>
    </section>
  )
}
