import axios from 'axios'

const api = axios.create({ baseURL: 'http://localhost:8080/api' })

// Attach auth token from session to every request
api.interceptors.request.use(config => {
  try {
    const session = JSON.parse(localStorage.getItem('ebp_session') || '{}')
    if (session.token) config.headers.Authorization = `Bearer ${session.token}`
  } catch {}
  return config
})

// ─── RAG store (localStorage) ────────────────────────────────────────────────
const RAG_KEY = 'ebp_rag_corpus'

export function getRagCorpus() {
  try { return JSON.parse(localStorage.getItem(RAG_KEY) || '[]') } catch { return [] }
}

export function saveRagChunk(title, content) {
  const corpus = getRagCorpus()
  const chunk  = { id: Date.now(), title, content, addedAt: new Date().toISOString() }
  localStorage.setItem(RAG_KEY, JSON.stringify([...corpus, chunk]))
  return chunk
}

export function clearRagCorpus() {
  localStorage.removeItem(RAG_KEY)
}

// ─── Simple keyword tokeniser for RAG retrieval ───────────────────────────────
function tokenise(text) {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(Boolean)
}

function score(query, chunk) {
  const qTokens  = new Set(tokenise(query))
  const cTokens  = tokenise(chunk.title + ' ' + chunk.content)
  return cTokens.filter(t => qTokens.has(t)).length
}

export function retrieveContext(query, topK = 3) {
  const corpus = getRagCorpus()
  if (!corpus.length) return []
  return corpus
    .map(c => ({ ...c, score: score(query, c) }))
    .filter(c => c.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
}

// ─── Intent detection ─────────────────────────────────────────────────────────
function detectIntent(msg) {
  const m = msg.toLowerCase()
  if (/\b(predict|upcoming|leave|off|absent)\b/.test(m) && /\bstore\b/.test(m))  return 'STORE_PREDICT'
  if (/\b(predict|upcoming|leave|off|absent)\b/.test(m) && /\bemp|employee\b/.test(m)) return 'EMP_PREDICT'
  if (/\b(holiday|bank holiday|public holiday)\b/.test(m))  return 'HOLIDAYS'
  if (/\b(store|location|branch)\b/.test(m))                return 'STORES'
  if (/\b(employee|staff|worker|team)\b/.test(m))           return 'EMPLOYEES'
  if (/\b(help|what can|how|commands)\b/.test(m))           return 'HELP'
  return 'UNKNOWN'
}

function extractNumber(msg) {
  const m = msg.match(/\b(\d+)\b/)
  return m ? parseInt(m[1]) : null
}

// ─── Store Manager response engine ───────────────────────────────────────────
export async function managerReply(message, mode = 'business') {
  // General mode — send straight to GPT with no business context
  if (mode === 'general') {
    try {
      const { data } = await api.post('/chat', { message })
      return data.reply || 'No response received.'
    } catch {
      return '⚠️ Could not reach the AI service. Make sure the backend is running.'
    }
  }

  // Business mode — resolve intent from EBP data, then polish with GPT
  const intent = detectIntent(message)
  const num    = extractNumber(message)

  try {
    let rawReply = ''

    switch (intent) {

      case 'STORES': {
        const { data } = await api.get('/locations')
        const list = data.map(l => `• ${l.name} (${l.city}, ${l.region})`).join('\n')
        rawReply = `We have ${data.length} stores across the UK:\n\n${list}`
        break
      }

      case 'EMPLOYEES': {
        if (num) {
          const { data } = await api.get('/employees', { params: { locationId: num } })
          if (!data.length) { rawReply = `No active employees found at store ID ${num}.`; break }
          const sample = data.slice(0, 5).map(e => `• ${e.name} — ${e.role}`).join('\n')
          rawReply = `Store ${num} has ${data.length} active employees. Here are a few:\n\n${sample}\n\n...and ${Math.max(0, data.length - 5)} more.`
        } else {
          rawReply = `Please specify a store ID. Example: "show employees at store 1"`
        }
        break
      }

      case 'STORE_PREDICT': {
        const id = num || 1
        const { data } = await api.get(`/predictions/store/${id}`, { params: { days: 30, topN: 5 } })
        if (!data.predictions?.length) { rawReply = `No strong leave signals detected for store ${id} in the next 30 days.`; break }
        const list = data.predictions.map(p =>
          `• ${p.employeeName} (${p.role}) — ${p.predictedDate} [${Math.round(p.confidence * 100)}% confidence]\n  Reason: ${p.reason}`
        ).join('\n\n')
        rawReply = `Top predicted leaves at ${data.storeName} (next 30 days):\n\n${list}`
        break
      }

      case 'EMP_PREDICT': {
        const id = num
        if (!id) { rawReply = `Please provide an employee ID. Example: "predict leave for employee 42"`; break }
        const { data } = await api.get(`/predictions/employee/${id}`, { params: { days: 60 } })
        if (!data.length) { rawReply = `No strong leave signal detected for employee ${id} in the next 60 days.`; break }
        const p = data[0]
        rawReply = `Prediction for employee ${id}:\n• Predicted date: ${p.predictedDate}\n• Leave type: ${p.leaveType}\n• Confidence: ${Math.round(p.confidence * 100)}%\n• Reason: ${p.reason}`
        break
      }

      case 'HOLIDAYS': {
        const id = num || 1
        const from = new Date().toISOString().slice(0, 10)
        const to   = new Date(Date.now() + 90 * 86400000).toISOString().slice(0, 10)
        const { data } = await api.get(`/leaves/holidays/${id}`, { params: { from, to } })
        if (!data.length) { rawReply = `No upcoming holidays found for store ${id} in the next 90 days.`; break }
        const list = data.map(h => `• ${h.holidayDate} — ${h.holidayName}`).join('\n')
        rawReply = `Upcoming holidays for store ${id}:\n\n${list}`
        break
      }

      case 'HELP':
        rawReply = `Here's what you can ask me:\n\n• "Show all stores"\n• "Show employees at store 3"\n• "Predict leaves for store 1"\n• "Predict leave for employee 42"\n• "Show holidays for store 7"\n\nJust include the store or employee ID in your message!`
        break

      default:
        rawReply = null
    }

    // Polish the EBP data reply with GPT in a business context
    if (rawReply) {
      try {
        const prompt = `You are a professional retail workforce assistant for EBP (Employee & Branch Portal), a UK retail leave management system. A store manager asked: "${message}". Here is the raw data retrieved from the system:\n\n${rawReply}\n\nRewrite this as a clear, professional, business-focused response. Keep all the data accurate. Be concise and helpful. Do not add information that is not in the data. Do not use any greeting or salutation like "Dear" at the start.`
        const { data } = await api.post('/chat', { message: prompt })
        return data.reply || rawReply
      } catch {
        return rawReply
      }
    }

    // Fallback — unknown intent, ask GPT with business context
    const prompt = `You are a professional retail workforce assistant for EBP (Employee & Branch Portal), a UK retail leave management system. Answer the following question from a store manager in a business-focused, professional manner: "${message}". Do not use any greeting or salutation like "Dear" at the start.`
    const { data } = await api.post('/chat', { message: prompt })
    return data.reply || `I couldn't find specific data for that. Try asking about stores, employees, predictions or holidays.`

  } catch {
    return `⚠️ Could not fetch data from the backend. Make sure the server is running on port 8080.`
  }
}

// ─── Admin RAG response engine ────────────────────────────────────────────────
export function adminReply(message) {
  const context = retrieveContext(message)
  if (!context.length) {
    return `No relevant context found in the trained data for: "${message}".\n\nTry training more data using the panel above, then ask again.`
  }
  const contextText = context.map(c => `[${c.title}]\n${c.content}`).join('\n\n---\n\n')
  return `📚 Based on trained data (${context.length} relevant chunk${context.length > 1 ? 's' : ''} retrieved):\n\n${contextText}\n\n---\n💡 Tip: The answer above is retrieved directly from your trained corpus. Add more specific data chunks for better answers.`
}
