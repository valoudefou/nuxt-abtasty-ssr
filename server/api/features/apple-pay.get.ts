import { defineEventHandler, getCookie, getHeader, setCookie } from 'h3'

import { flagshipLogStore } from '@/utils/flagship/logStore'
import { initializeFlagship } from '@/server/utils/flagship'

const FLAGSHIP_VISITOR_COOKIE = 'fsVisitorId'
const APPLE_PAY_FLAG_KEY = 'paymentFeature1Click'
const generateVisitorId = () => `${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`

export default defineEventHandler(async (event) => {
  let visitorId = getCookie(event, FLAGSHIP_VISITOR_COOKIE)

  if (!visitorId) {
    visitorId = generateVisitorId()
    setCookie(event, FLAGSHIP_VISITOR_COOKIE, visitorId, {
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
      httpOnly: true,
      sameSite: 'lax',
      secure: !import.meta.dev
    })
  }

  try {
    const visitor = await initializeFlagship({
      visitorId,
      context: {
        page: 'product',
        userAgent: getHeader(event, 'user-agent') ?? 'unknown'
      },
      authenticated: false
    })

    const flag = visitor.getFlag(APPLE_PAY_FLAG_KEY)
    const rawValue = flag.getValue('false')
    const enabled =
      typeof rawValue === 'string'
        ? rawValue.trim().toLowerCase() === 'true'
        : Boolean(rawValue)

    flagshipLogStore.addLog({
      timestamp: new Date().toISOString(),
      level: 'INFO',
      tag: 'flagship-server',
      message: `Flag ${APPLE_PAY_FLAG_KEY} evaluated during SSR`,
      visitorId,
      rawValue,
      enabled
    })

    console.log('Flagship feature evaluation', {
      visitorId,
      flagKey: APPLE_PAY_FLAG_KEY,
      rawValue,
      enabled,
      flagsStatus: visitor.flagsStatus
    })

    return { enabled }
  } catch (error) {
    console.error('Failed to evaluate Apple Pay flag via Flagship', error)

    flagshipLogStore.addLog({
      timestamp: new Date().toISOString(),
      level: 'ERROR',
      tag: 'flagship-server',
      message: `Failed to evaluate ${APPLE_PAY_FLAG_KEY}`,
      error: error instanceof Error ? error.message : String(error)
    })
    return { enabled: false }
  }
})
