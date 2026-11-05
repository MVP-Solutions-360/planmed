// Alta de un colaborador de la línea en Hub (POST /cms/line-users). Orden: origen → sesión y líder vigente → cuerpo → lista blanca.
// Salario y auxilio los fija el servidor en 0; empresa/línea/contraseña/líder nunca se aceptan del navegador. Sin reintentos.
export default defineEventHandler(async (event) => {
  assertSameOrigin(event)
  setHeader(event, 'Cache-Control', 'no-store')
  await requireAreaLeader(event)
  const input = parseCreateLineUserBody(await readBody(event).catch(() => null))
  const created = await createLineUser(event, input)
  setHeader(event, 'Pragma', 'no-cache') // la respuesta lleva la contraseña temporal
  setResponseStatus(event, 201)
  return created
})
