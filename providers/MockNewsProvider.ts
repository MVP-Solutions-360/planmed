import type { NewsProvider } from './NewsProvider'
import type { NewsArticle } from '~/types/news'
import { mockNewsData } from '~/data/news'

const STORAGE_KEY = 'planmed-mock-news'

// El mock vive en memoria; en el navegador se persiste en localStorage para que
// los cambios del panel admin sobrevivan a recargas completas de la página.
function load(): NewsArticle[] {
  if (import.meta.client) {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) return JSON.parse(raw)
    } catch {}
  }
  return [...mockNewsData]
}

function save() {
  if (!import.meta.client) return
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(mockData)) } catch {}
}

let mockData: NewsArticle[] = load()

export class MockNewsProvider implements NewsProvider {
  async getNews(): Promise<NewsArticle[]> {
    return [...mockData]
  }

  async getNewsBySlug(slug: string): Promise<NewsArticle | null> {
    const article = mockData.find(n => n.slug === slug);
    return article || null;
  }

  async createNews(data: Omit<NewsArticle, 'id' | 'slug'>): Promise<NewsArticle> {
    const newId = String(Math.max(0, ...mockData.map(n => parseInt(n.id) || 0)) + 1)
    const slug = data.title.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, '-')
    
    // Validar slug unico
    if (mockData.some(n => n.slug === slug)) {
      throw new Error('Ya existe una noticia con un título similar (slug duplicado).')
    }

    const newArticle: NewsArticle = { ...data, id: newId, slug }
    mockData.push(newArticle)
    save()
    return newArticle
  }

  async updateNews(slug: string, data: Partial<NewsArticle>): Promise<NewsArticle> {
    const index = mockData.findIndex(n => n.slug === slug)
    if (index === -1) throw new Error('Noticia no encontrada')
    
    if (data.slug && data.slug !== slug) {
      if (mockData.some(n => n.slug === data.slug)) {
        throw new Error('El slug indicado ya está en uso.')
      }
    }

    const updated = { ...mockData[index]!, ...data } as NewsArticle
    mockData[index] = updated
    save()
    return updated
  }

  async deleteNews(slug: string): Promise<boolean> {
    const index = mockData.findIndex(n => n.slug === slug)
    if (index === -1) return false
    mockData.splice(index, 1)
    save()
    return true
  }
}