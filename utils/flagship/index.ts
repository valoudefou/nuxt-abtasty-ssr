import { Flagship, LogLevel, type Visitor } from '@flagship.io/js-sdk'

import { flagshipLogStore } from '@/utils/flagship/logStore'
import { flagshipLogManager } from '@/utils/flagship/logManager'

type InitializeOptions = {
  visitorId: string
  context?: Record<string, string | number | boolean>
  authenticated?: boolean
}

let flagshipStarted = false

const ensureClientFlagshipStarted = () => {
  if (!import.meta.client) {
    throw new Error('Flagship client SDK can only be started in the browser.')
  }

  if (flagshipStarted) return

  const config = useRuntimeConfig()
  const envId = config.public?.flagship?.envId
  const apiKey = config.public?.flagship?.apiKey

  if (!envId || !apiKey) {
    throw new Error('Flagship credentials are missing from runtimeConfig.public.flagship.')
  }

  Flagship.start(envId, apiKey, {
    fetchNow: false,
    logLevel: LogLevel.ALL,
    logManager: flagshipLogManager
  })

  flagshipStarted = true
}

const timestamp = () =>
  new Date().toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  })

export const initializeFlagship = async ({
  visitorId,
  context = {},
  authenticated = false
}: InitializeOptions): Promise<Visitor> => {
  if (!import.meta.client) {
    throw new Error('initializeFlagship must be called on the client.')
  }

  if (!visitorId) {
    throw new Error('A visitorId is required to initialize Flagship.')
  }

  ensureClientFlagshipStarted()

  const visitor = Flagship.newVisitor({
    visitorId,
    hasConsented: true,
    context,
    isAuthenticated: authenticated
  })

  await visitor.fetchFlags()

  flagshipLogStore.addLog({
    timestamp: timestamp(),
    level: 'INFO',
    tag: 'flagship-client',
    message: 'Flagship visitor initialized on client',
    visitorId,
    context,
    authenticated
  })

  return visitor
}

export { fakeLookerClient, logApplePayPdpExposure, logFlagExposureToLooker } from '@/utils/flagship/lookerLogging'
