declare global {
  const defineEventHandler: typeof import('h3').defineEventHandler
  const getQuery: typeof import('h3').getQuery
  const setHeader: typeof import('h3').setHeader
  const getRouterParam: typeof import('h3').getRouterParam
  const sendRedirect: typeof import('h3').sendRedirect
}

export {}

