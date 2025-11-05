export type FlagshipLogLevel =
  | 'EMERGENCY'
  | 'ALERT'
  | 'CRITICAL'
  | 'ERROR'
  | 'WARNING'
  | 'NOTICE'
  | 'INFO'
  | 'DEBUG'

export type FlagshipLogEntry = {
  timestamp: string
  level: FlagshipLogLevel
  message: string
  tag?: string
  [key: string]: unknown
}

type LogListener = (logs: FlagshipLogEntry[]) => void

const listeners: LogListener[] = []
const logs: FlagshipLogEntry[] = []
const MAX_LOGS = 200

const SENSITIVE_KEYS = ['_envId', 'x-api-key', '_apiKey', 'envId', 'apiKey', 'env_id', 'api_key']

const simpleHash = (value: string) => {
  let hash = 0

  for (let index = 0; index < value.length; index += 1) {
    const char = value.charCodeAt(index)
    hash = (hash << 5) - hash + char
    hash &= hash // Convert to 32-bit integer
  }

  return Math.abs(hash).toString(16)
}

const hashSensitiveValue = (value: unknown) => {
  if (typeof value !== 'string' || value.length === 0) {
    return value
  }

  if (value.length <= 6) {
    return `${value.charAt(0)}***${simpleHash(value.slice(1))}`
  }

  return `${value.substring(0, 3)}***${simpleHash(value.slice(3))}`
}

const processSensitiveStrings = (value: string) => {
  let processed = value

  SENSITIVE_KEYS.forEach((key) => {
    const patterns = [
      new RegExp(`(${key}\\s*[=:]\\s*["']?)([^"'\\s,}&]+)(["']?)`, 'gi'),
      new RegExp(`("${key}"\\s*:\\s*["']?)([^"'\\s,}&]+)(["']?)`, 'gi')
    ]

    patterns.forEach((pattern) => {
      processed = processed.replace(pattern, (match, prefix, payload, suffix) => {
        return `${prefix}${hashSensitiveValue(payload)}${suffix}`
      })
    })
  })

  return processed
}

const processSensitiveData = <T>(input: T): T => {
  if (input === null) {
    return input
  }

  if (typeof input === 'string') {
    return processSensitiveStrings(input) as unknown as T
  }

  if (Array.isArray(input)) {
    return input.map((item) => processSensitiveData(item)) as unknown as T
  }

  if (typeof input === 'object') {
    const record = input as Record<string, unknown>
    const processed: Record<string, unknown> = {}

    Object.entries(record).forEach(([key, value]) => {
      const isSensitiveKey = SENSITIVE_KEYS.some((sensitiveKey) => sensitiveKey.toLowerCase() === key.toLowerCase())

      if (isSensitiveKey) {
        processed[key] = hashSensitiveValue(value)
        return
      }

      if (typeof value === 'string') {
        processed[key] = processSensitiveStrings(value)
        return
      }

      if (typeof value === 'object') {
        processed[key] = processSensitiveData(value)
        return
      }

      processed[key] = value
    })

    return processed as T
  }

  return input
}

const notifyListeners = () => {
  const snapshot = [...logs].reverse()
  listeners.forEach((listener) => {
    try {
      listener(snapshot)
    } catch (error) {
      console.error('Flagship log listener error', error)
    }
  })
}

export const flagshipLogStore = {
  addLog(entry: FlagshipLogEntry) {
    const processedLog = processSensitiveData(entry)

    logs.push(processedLog)

    if (logs.length > MAX_LOGS) {
      logs.shift()
    }

    notifyListeners()
  },
  subscribe(callback: LogListener) {
    listeners.push(callback)
    callback([...logs].reverse())

    return () => {
      const index = listeners.indexOf(callback)
      if (index !== -1) {
        listeners.splice(index, 1)
      }
    }
  },
  getLogs() {
    return [...logs]
  },
  clear() {
    logs.length = 0
  }
}
