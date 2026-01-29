import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

type Primitive = string | number | boolean

type UpstreamFetchOptions = {
  params?: Record<string, Primitive | null | undefined>
  headers?: Record<string, string>
}

const execFileAsync = promisify(execFile)

const shouldUseCurlFallback = () => process.dev || process.env.NUXT_UPSTREAM_CURL === '1'

const buildUrl = (base: string, pathname: string, params?: UpstreamFetchOptions['params']) => {
  const url = new URL(pathname, base.endsWith('/') ? base : `${base}/`)
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value === null || value === undefined) continue
      url.searchParams.set(key, String(value))
    }
  }
  return url.toString()
}

const curlJson = async <T>(url: string, options: Pick<UpstreamFetchOptions, 'headers'> = {}): Promise<T> => {
  const args: string[] = [
    '-sS',
    '--fail-with-body',
    '--max-time',
    '20',
    url
  ]

  const headers = options.headers ?? {}
  for (const [key, value] of Object.entries(headers)) {
    args.push('-H', `${key}: ${value}`)
  }

  const { stdout } = await execFileAsync('curl', args, {
    timeout: 25_000,
    maxBuffer: 10 * 1024 * 1024
  })

  const raw = String(stdout).trim()
  return JSON.parse(raw) as T
}

let warned = false

export const fetchUpstreamJson = async <T>(
  base: string,
  pathname: string,
  options: UpstreamFetchOptions = {}
): Promise<T> => {
  const url = buildUrl(base, pathname, options.params)
  const headers = {
    accept: 'application/json',
    ...options.headers
  }

  try {
    return await $fetch<T>(url, { headers })
  } catch (error) {
    if (!shouldUseCurlFallback()) {
      throw error
    }

    if (!warned) {
      warned = true
      console.warn('[UpstreamFetch] $fetch failed; retrying with curl fallback for dev.', {
        url,
        error: (error as Error)?.message ?? String(error)
      })
    }

    return await curlJson<T>(url, { headers })
  }
}

