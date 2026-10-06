export default defineEventHandler(async (event) => {
  assertSameOrigin(event)
  setHeader(event, 'Cache-Control', 'no-store')

  const session = await useAdminSession(event)
  const token = session.data.token

  try {
    if (token) await wellezyLogout(event, token)
  } finally {
    // La sesión local se destruye aunque Wellezy falle.
    await session.clear()
  }
  return { ok: true }
})
