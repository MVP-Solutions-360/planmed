import type { ProcedureProvider } from './ProcedureProvider'
import type { Procedure } from '~/types/procedure'
import { procedures } from '~/data/procedures'

// Hacer una copia local mutable para que el CRUD de desarrollo funcione y persista en memoria
let mockData: Procedure[] = [...procedures]

export class MockProcedureProvider implements ProcedureProvider {
  async getProcedures(): Promise<Procedure[]> {
    return [...mockData]
  }

  async getProcedureBySlug(slug: string): Promise<Procedure | null> {
    const proc = mockData.find(p => p.slug === slug)
    return proc || null
  }

  async createProcedure(data: Omit<Procedure, 'id' | 'slug'>): Promise<Procedure> {
    const newId = String(Math.max(0, ...mockData.map(p => parseInt(p.id) || 0)) + 1)
    const slug = data.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, '-')
    const newProcedure: Procedure = { ...data, id: newId, slug }
    mockData.push(newProcedure)
    return newProcedure
  }

  async updateProcedure(slug: string, data: Partial<Procedure>): Promise<Procedure> {
    const index = mockData.findIndex(p => p.slug === slug)
    if (index === -1) throw new Error('Procedure not found')
    
    // Si cambia el nombre, podríamos cambiar el slug, pero para el MVP mock mantendremos el slug original o lo actualizamos.
    // Lo más seguro en un update es mantener el slug o generar uno nuevo. Mantenemos el slug para simplificar.
    const updatedProcedure = { ...mockData[index]!, ...data } as Procedure
    mockData[index] = updatedProcedure
    return updatedProcedure
  }

  async deleteProcedure(slug: string): Promise<boolean> {
    const index = mockData.findIndex(p => p.slug === slug)
    if (index === -1) return false
    mockData.splice(index, 1)
    return true
  }
}