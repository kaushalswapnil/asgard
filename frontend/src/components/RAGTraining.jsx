import { useState, useEffect } from 'react'
import axios from 'axios'
import { Spinner, ErrorMsg } from './UI'
import './RAGTraining.css'

export default function RAGTraining() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [stats, setStats] = useState(null)
  const [trainingMode, setTrainingMode] = useState('single')
  const [employeeId, setEmployeeId] = useState('')
  const [selectedEmployees, setSelectedEmployees] = useState([])

  const api = axios.create({ baseURL: 'http://localhost:8080' })

  const handleTrainSingle = async () => {
    if (!employeeId) {
      setError('Please enter an employee ID')
      return
    }

    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await api.post('/api/rag/train', {
        employeeId: parseInt(employeeId)
      })
      setSuccess(`Employee ${employeeId} trained successfully`)
      setEmployeeId('')
      await fetchStats()
    } catch (err) {
      setError(err.response?.data?.error || 'Training failed')
    } finally {
      setLoading(false)
    }
  }

  const handleTrainBatch = async () => {
    if (selectedEmployees.length === 0) {
      setError('Please select at least one employee')
      return
    }

    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await api.post('/api/rag/train/batch', {
        employeeIds: selectedEmployees
      })
      setSuccess(`${response.data.trained_count} employees trained successfully`)
      setSelectedEmployees([])
      await fetchStats()
    } catch (err) {
      setError(err.response?.data?.error || 'Batch training failed')
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await api.get('/api/rag/stats')
      setStats(response.data)
    } catch (err) {
      console.error('Failed to fetch stats:', err)
    }
  }

  const handleClear = async () => {
    if (!window.confirm('Are you sure? This will delete all trained embeddings.')) return

    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      await api.delete('/api/rag/clear')
      setSuccess('All embeddings cleared')
      setStats(null)
    } catch (err) {
      setError(err.response?.data?.error || 'Clear failed')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [])

  return (
    <div className="rag-training-container">
      <div className="rag-header">
        <h2>RAG Model Training</h2>
        <p>Train the AI model with employee leave patterns for enhanced predictions</p>
      </div>

      {error && <ErrorMsg message={error} />}
      {success && <div className="success-msg">Success: {success}</div>}

      {stats && (
        <div className="stats-card">
          <div className="stat-item">
            <span className="stat-label">Trained Embeddings</span>
            <span className="stat-value">{stats.total_embeddings}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Collection</span>
            <span className="stat-value">{stats.collection_name}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Vector Store</span>
            <span className="stat-value">{stats.milvus_host}:{stats.milvus_port}</span>
          </div>
        </div>
      )}

      <div className="mode-selector">
        <button
          className={`mode-btn ${trainingMode === 'single' ? 'active' : ''}`}
          onClick={() => setTrainingMode('single')}
        >
          Single Employee
        </button>
        <button
          className={`mode-btn ${trainingMode === 'batch' ? 'active' : ''}`}
          onClick={() => setTrainingMode('batch')}
        >
          Batch Training
        </button>
      </div>

      {trainingMode === 'single' && (
        <div className="training-section">
          <h3>Train Single Employee</h3>
          <div className="input-group">
            <input
              type="number"
              placeholder="Enter Employee ID"
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              disabled={loading}
            />
            <button
              onClick={handleTrainSingle}
              disabled={loading || !employeeId}
              className="btn-primary"
            >
              {loading ? <Spinner /> : 'Train'}
            </button>
          </div>
          <p className="hint">Enter an employee ID to generate and store their leave pattern embedding</p>
        </div>
      )}

      {trainingMode === 'batch' && (
        <div className="training-section">
          <h3>Batch Training</h3>
          <div className="batch-input">
            <textarea
              placeholder="Enter employee IDs (comma-separated). Example: 1,2,3,4,5"
              onChange={(e) => {
                const ids = e.target.value
                  .split(',')
                  .map(id => parseInt(id.trim()))
                  .filter(id => !isNaN(id))
                setSelectedEmployees(ids)
              }}
              disabled={loading}
              rows="4"
            />
          </div>
          <div className="batch-info">
            <span>{selectedEmployees.length} employees selected</span>
          </div>
          <button
            onClick={handleTrainBatch}
            disabled={loading || selectedEmployees.length === 0}
            className="btn-primary"
          >
            {loading ? <Spinner /> : 'Train All'}
          </button>
          <p className="hint">Train multiple employees at once to build a comprehensive pattern database</p>
        </div>
      )}

      <div className="actions-section">
        <button
          onClick={fetchStats}
          disabled={loading}
          className="btn-secondary"
        >
          Refresh Stats
        </button>
        <button
          onClick={handleClear}
          disabled={loading}
          className="btn-danger"
        >
          Clear All
        </button>
      </div>

      <div className="info-box">
        <h4>How RAG Training Works</h4>
        <ul>
          <li><strong>Embedding Generation:</strong> Converts employee leave patterns into vector representations</li>
          <li><strong>Vector Storage:</strong> Stores embeddings in Milvus for fast similarity search</li>
          <li><strong>Pattern Matching:</strong> Finds similar employees to enhance predictions</li>
          <li><strong>Confidence Boost:</strong> Increases prediction confidence when similar patterns exist</li>
        </ul>
      </div>
    </div>
  )
}
