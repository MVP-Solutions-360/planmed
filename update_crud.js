const fs = require('fs');

const providerPath = 'providers/ProcedureProvider.ts';
const mockProviderPath = 'providers/MockProcedureProvider.ts';
const servicePath = 'services/ProcedureService.ts';

// 1. Update ProcedureProvider.ts
let providerContent = fs.readFileSync(providerPath, 'utf8');
if (!providerContent.includes('createProcedure')) {
  providerContent = providerContent.replace(
    /}\s*$/,
    \  createProcedure(data: Omit<Procedure, 'id' | 'slug'>): Promise<Procedure>\n  updateProcedure(slug: string, data: Partial<Procedure>): Promise<Procedure>\n  deleteProcedure(slug: string): Promise<boolean>\n}\
  );
  fs.writeFileSync(providerPath, providerContent, 'utf8');
}

// 2. Update MockProcedureProvider.ts
let mockContent = fs.readFileSync(mockProviderPath, 'utf8');
if (!mockContent.includes('createProcedure')) {
  mockContent = mockContent.replace(
    /}\s*$/,
    \  async createProcedure(data: Omit<Procedure, 'id' | 'slug'>): Promise<Procedure> {
    const newId = String(Math.max(...proceduresData.map(p => parseInt(p.id || '0'))) + 1)
    const slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    const newProcedure: Procedure = { ...data, id: newId, slug }
    proceduresData.push(newProcedure)
    return newProcedure
  }

  async updateProcedure(slug: string, data: Partial<Procedure>): Promise<Procedure> {
    const index = proceduresData.findIndex(p => p.slug === slug)
    if (index === -1) throw new Error('Procedure not found')
    proceduresData[index] = { ...proceduresData[index], ...data }
    return proceduresData[index]
  }

  async deleteProcedure(slug: string): Promise<boolean> {
    const index = proceduresData.findIndex(p => p.slug === slug)
    if (index === -1) return false
    proceduresData.splice(index, 1)
    return true
  }
}\
  );
  // Need to import Procedure from types if not already imported or ensure proceduresData is mutable.
  // Let's rewrite the whole mock file to be safe, since I need to make proceduresData mutable if it is imported from data/procedures.ts.
}

// 3. Update ProcedureService.ts
let serviceContent = fs.readFileSync(servicePath, 'utf8');
if (!serviceContent.includes('createProcedure')) {
  serviceContent = serviceContent.replace(
    /}\s*$/,
    \
  async createProcedure(data: Omit<Procedure, 'id' | 'slug'>): Promise<Procedure> {
    return this.provider.createProcedure(data);
  }

  async updateProcedure(slug: string, data: Partial<Procedure>): Promise<Procedure> {
    return this.provider.updateProcedure(slug, data);
  }

  async deleteProcedure(slug: string): Promise<boolean> {
    return this.provider.deleteProcedure(slug);
  }
}\
  );
  fs.writeFileSync(servicePath, serviceContent, 'utf8');
}