// En Hub "eliminar" desactiva el procedimiento propio (o deshabilita el maestro en la línea); el registro se conserva.
export default defineEventHandler(async (event) => {
  const res = await hubProcedures(event, 'DELETE', `/${parseProcedureId(event)}`)
  return fromCms(res.data)
})
