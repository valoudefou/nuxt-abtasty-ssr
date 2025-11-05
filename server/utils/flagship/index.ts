import { Flagship, LogLevel, Visitor } from '@flagship.io/js-sdk'
import { useRuntimeConfig } from '#imports'
import { createError } from 'h3'

import type { FlagshipLogEntry, FlagshipLogLevel } from '@/utils/flagship/logStore'
import { flagshipLogStore } from '@/utils/flagship/logStore'

type InitializeFlagshipOptions = {
  visitorId: string
  context?: Record<string, string | number | boolean>
  authenticated?: boolean
}

const resolveLevelName = (level: LogLevel): FlagshipLogLevel => {
  const value = (typeof level === 'number' ? LogLevel[level] : level) as FlagshipLogLevel | undefined
  return value ?? 'INFO'
}

const customLog = {
  emergency(message: string, tag?: string) {
    this.log(LogLevel.EMERGENCY, message, tag)
  },
  alert(message: string, tag?: string) {
    this.log(LogLevel.ALERT, message, tag)
  },
  critical(message: string, tag?: string) {
    this.log(LogLevel.CRITICAL, message, tag)
  },
  error(message: string, tag?: string) {
    this.log(LogLevel.ERROR, message, tag)
  },
  warning(message: string, tag?: string) {
    this.log(LogLevel.WARNING, message, tag)
  },
  notice(message: string, tag?: string) {
    this.log(LogLevel.NOTICE, message, tag)
  },
  info(message: string, tag?: string) {
    this.log(LogLevel.INFO, message, tag)
  },
  debug(message: string, tag?: string) {
    this.log(LogLevel.DEBUG, message, tag)
  },
  log(level: LogLevel, message: string, tag?: string) {
    const levelName = resolveLevelName(level)

    const logEntry: FlagshipLogEntry = {
      timestamp: new Date().toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      }),
      level: levelName,
      message,
      tag
    }

    console.log(`[${logEntry.level}] [${tag ?? 'flagship'}]: ${message}`)
    flagshipLogStore.addLog(logEntry)
  }
}

let flagshipStarted = false

const ensureFlagshipStarted = () => {
  if (flagshipStarted) return

  const config = useRuntimeConfig()
  const flagshipConfig = (config.flagship ?? {}) as { envId?: string; apiKey?: string }
  const publicFlagship = (config.public?.flagship ?? {}) as { envId?: string; apiKey?: string }
  const envId = flagshipConfig.envId || publicFlagship.envId
  const apiKey = flagshipConfig.apiKey || publicFlagship.apiKey

  if (!envId || !apiKey) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Flagship credentials are missing. Please configure runtimeConfig.flagship.'
    })
  }

  Flagship.start(envId, apiKey, {
    fetchNow: false,
    logManager: customLog,
    logLevel: LogLevel.ALL
  })

  flagshipStarted = true
}

export const initializeFlagship = async ({
  visitorId,
  context = {},
  authenticated = false
}: InitializeFlagshipOptions): Promise<Visitor> => {
  if (!visitorId) {
    throw createError({ statusCode: 400, statusMessage: 'A visitorId is required to initialize Flagship.' })
  }

  ensureFlagshipStarted()

  const visitor = Flagship.newVisitor({
    visitorId,
    hasConsented: true,
    context,
    isAuthenticated: authenticated
  })

  await visitor.fetchFlags()

  return visitor
}

export { flagshipLogStore }
