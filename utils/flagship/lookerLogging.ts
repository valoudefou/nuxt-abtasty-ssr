import { flagshipLogStore } from '@/utils/flagship/logStore'

// Flagship exposes metadata for every evaluated flag, which we map into a Looker-style
// event payload. The fakeLookerClient keeps the interface isolated so swapping in a
// real Looker SDK (or HTTP client) later only requires updating this object.
export const fakeLookerClient = {
  sendEvent(event: Record<string, unknown>) {
    console.info('[FakeLooker] Event dispatched', event)
  }
}

type LookerLogOptions = {
  visitorId?: string
  anonymousId?: string
  extraProps?: Record<string, unknown>
}

export type IFSFlagMetadata = {
  campaignId: string
  campaignName: string
  variationGroupId: string
  variationGroupName: string
  variationId: string
  variationName: string
  isReference: boolean
  campaignType: string
  slug?: string | null
}

type IFSFlagCollection = {
  getMetadata(): Map<string, IFSFlagMetadata>
  forEach(callbackfn: (value: unknown, key: string, collection: IFSFlagCollection) => void): void
}

export type LookerFlagExposureEvent = {
  eventName: 'flag_exposure'
  flagKey: string
  campaignId: string | null
  campaignName: string | null
  variationGroupId: string | null
  variationGroupName: string | null
  variationId: string | null
  variationName: string | null
  isReference: boolean
  campaignType: string | null
  slug?: string | null
  visitorId?: string
  anonymousId?: string
  timestamp: string
  [key: string]: unknown
}

const LOOKER_EVENT_NAME: LookerFlagExposureEvent['eventName'] = 'flag_exposure'
const LOOKER_LOG_TAG = 'segments-demo'

const buildLookerPayload = (
  flagKey: string,
  metadata: IFSFlagMetadata | undefined,
  options: LookerLogOptions
): LookerFlagExposureEvent => {
  const { visitorId, anonymousId, extraProps = {} } = options
  const timestamp = new Date().toISOString()

  return {
    eventName: LOOKER_EVENT_NAME,
    flagKey,
    campaignId: metadata?.campaignId ?? null,
    campaignName: metadata?.campaignName ?? null,
    variationGroupId: metadata?.variationGroupId ?? null,
    variationGroupName: metadata?.variationGroupName ?? null,
    variationId: metadata?.variationId ?? null,
    variationName: metadata?.variationName ?? null,
    isReference: metadata?.isReference ?? false,
    campaignType: metadata?.campaignType ?? null,
    slug: metadata?.slug ?? null,
    ...(visitorId ? { visitorId } : {}),
    ...(anonymousId ? { anonymousId } : {}),
    timestamp,
    ...extraProps
  }
}

const logEventToPanel = (event: LookerFlagExposureEvent) => {
  // Surface the entire payload plus key fields so the log panel can display and search them.
  flagshipLogStore.addLog({
    timestamp: event.timestamp,
    level: 'INFO',
    tag: LOOKER_LOG_TAG,
    message: 'Flag exposure event sent to Segments',
    event,
    eventName: event.eventName,
    flagKey: event.flagKey,
    campaignId: event.campaignId,
    campaignName: event.campaignName,
    variationGroupId: event.variationGroupId,
    variationGroupName: event.variationGroupName,
    variationId: event.variationId,
    variationName: event.variationName,
    isReference: event.isReference,
    campaignType: event.campaignType,
    slug: event.slug,
    visitorId: event.visitorId,
    anonymousId: event.anonymousId
  })
}

const sendEventSafely = (event: LookerFlagExposureEvent) => {
  try {
    fakeLookerClient.sendEvent(event)
  } catch (error) {
    flagshipLogStore.addLog({
      timestamp: new Date().toISOString(),
      level: 'ERROR',
      tag: LOOKER_LOG_TAG,
      message: 'Failed to send Segments event via fake client',
      error: error instanceof Error ? error.message : String(error),
      flagKey: event.flagKey
    })
  }
}

export const logFlagExposureToLooker = (
  flagCollection: IFSFlagCollection,
  logger: { info: (msg: string, meta?: unknown) => void },
  options: LookerLogOptions = {}
) => {
  const metadataByKey = flagCollection.getMetadata()

  flagCollection.forEach((_, flagKey) => {
    const eventPayload = buildLookerPayload(flagKey, metadataByKey.get(flagKey), options)

    logger.info('Flag exposure event sent to Segments', eventPayload)
    logEventToPanel(eventPayload)
    sendEventSafely(eventPayload)
  })
}

const APPLE_PAY_PDP_FLAG_KEY = 'apple_pay_pdp'

export const logApplePayPdpExposure = (
  flagCollection: IFSFlagCollection,
  logger: { info: (msg: string, meta?: unknown) => void },
  options: LookerLogOptions = {}
) => {
  const metadataByKey = flagCollection.getMetadata()

  flagCollection.forEach((_, flagKey) => {
    if (flagKey !== APPLE_PAY_PDP_FLAG_KEY) return

    const eventPayload = buildLookerPayload(flagKey, metadataByKey.get(flagKey), options)

    logger.info('Flag exposure event sent to Segments', eventPayload)
    logEventToPanel(eventPayload)
    sendEventSafely(eventPayload)
  })
}
