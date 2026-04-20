import axios from 'axios'

const api = axios.create({ baseURL: 'http://localhost:8080/api' })

// Attach Bearer token from localStorage on every request
api.interceptors.request.use(config => {
  const session = localStorage.getItem('ebp_session')
  if (session) {
    try {
      const { token } = JSON.parse(session)
      if (token) config.headers.Authorization = `Bearer ${token}`
    } catch {}
  }
  return config
})

export const getLocations = () => api.get('/locations')
export const getLocationsByRegion = (region) => api.get(`/locations/region/${region}`)

export const getEmployees = (locationId) =>
  api.get('/employees', { params: locationId ? { locationId } : {} })
export const getEmployee = (id) => api.get(`/employees/${id}`)

export const getEmployeeLeaves = (id) => api.get(`/leaves/employee/${id}`)
export const getEmployeeHalfLeaves = (id) => api.get(`/leaves/employee/${id}/half-day`)
export const getStoreLeaves = (locationId, from, to) =>
  api.get(`/leaves/store/${locationId}`, { params: { from, to } })
export const getHolidays = (locationId, from, to) =>
  api.get(`/leaves/holidays/${locationId}`, { params: { from, to } })

export const predictStore = (locationId, days = 30, topN = 5) =>
  api.get(`/predictions/store/${locationId}`, { params: { days, topN } })
export const predictEmployee = (employeeId, days = 60) =>
  api.get(`/predictions/employee/${employeeId}`, { params: { days } })

export const getStoreReplacements = (locationId, days = 30) =>
  api.get(`/replacements/store/${locationId}`, { params: { days } })
export const getEmployeeReplacement = (employeeId, days = 30) =>
  api.get(`/replacements/employee/${employeeId}`, { params: { days } })
export const submitSwapAction = (payload) =>
  api.post('/replacements/action', payload)
