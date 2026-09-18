const mockNewsData = [
  {
    id: "1",
    slug: "en-planmed-financiamos-pensionados",
    title: "EN PLANMED FINANCIAMOS: PENSIONADOS",
    excerpt: "Muchas personas pensionadas también desean realizarse procedimientos estéticos y hoy pueden acceder a opciones de financiación adaptadas a su perfil. Requisitos...",
    coverImage: "/images/branding/logo_fondo_transparente.png",
    content: "<p>Si eres pensionado y deseas realizarte un procedimiento estético, en Planmed contamos con opciones de financiación adaptadas a tu perfil. Evaluamos tu capacidad de pago basándonos en tus ingresos pensionales.</p><h2>Requisitos básicos</h2><ul><li>Copia de la cédula de ciudadanía.</li><li>Últimos desprendibles de pago de pensión.</li><li>Extractos bancarios.</li></ul><p>Nuestro equipo de asesores te acompañará en cada paso para asegurar que tu plan de pago sea viable y cómodo.</p>",
    publishedAt: "2026-05-15T21:08:20+00:00",
    author: "gerencia Planmed",
    seo: {
      metaTitle: "FINANCIACION CIRUGIA PLASTICA - FINANCIAMOS PENSIONADOS",
      metaDescription: "Muchas personas pensionadas también desean realizarse procedimientos estéticos y hoy pueden acceder a opciones de financiación adaptadas a su perfil. Requisitos..."
    }
  },
  {
    id: "2",
    slug: "una-cirugia-es-un-gasto-o-una-inversion-la-decision-que-muchos-estan-replanteando",
    title: "¿Una cirugía es un gasto o una inversión? La decisión que muchos están replanteando",
    excerpt: "Descubre por qué cada vez más personas consideran que invertir en su bienestar físico y emocional a través de la cirugía plástica es una decisión transformadora.",
    coverImage: "/images/branding/logo_fondo_transparente.png",
    content: "<p>Históricamente, la cirugía plástica se ha visto como un lujo. Sin embargo, en la actualidad, muchas personas han comenzado a verla como una inversión en su bienestar, salud mental y calidad de vida.</p><h2>El impacto emocional</h2><p>Más allá del cambio físico, los pacientes reportan un aumento significativo en su autoestima y confianza. Esto se traduce en un mejor desempeño laboral y relaciones interpersonales más saludables.</p><h2>Financiación inteligente</h2><p>Con herramientas como las que ofrece Planmed, no es necesario descapitalizarse. Diseñar un plan de pagos permite obtener los beneficios hoy y pagarlos a un ritmo manejable.</p>",
    publishedAt: "2026-04-21T14:48:37+00:00",
    author: "Planmed"
  },
  {
    id: "3",
    slug: "antes-y-despues-paciente-feliz-con-mamoplastia",
    title: "ANTES Y DESPUÉS PACIENTE FELIZ CON MAMOPLASTIA",
    excerpt: "Conoce la historia de Arelis Gomez, luego de dos meses de su cirugía de Mamoplastia de Aumento, y descubre cómo Planmed facilitó su proceso.",
    coverImage: "/images/branding/logo_fondo_transparente.png",
    content: "<p>Arelis Gomez, luego de dos meses de su cirugía de Mamoplastia de Aumento nos comparte su increíble resultado.</p><p>Su proceso de recuperación ha sido excelente y su confianza se ha renovado por completo.</p><p>¿Deseas financiar tu cirugía? Mira nuestro video para conocer cómo funciona nuestro modelo y únete a nuestra comunidad de pacientes felices.</p>",
    publishedAt: "2021-04-26T17:52:21+00:00",
    author: "Prisly",
    youtubeUrl: "https://www.youtube.com/embed/tPAVprOsJF0",
    instagramUrl: "https://www.instagram.com/p/CL7pTzuLxg4/"
  }
];
let mockData = [...mockNewsData];
class MockNewsProvider {
  async getNews() {
    return [...mockData];
  }
  async getNewsBySlug(slug) {
    const article = mockData.find((n) => n.slug === slug);
    return article || null;
  }
  async createNews(data) {
    const newId = String(Math.max(0, ...mockData.map((n) => parseInt(n.id) || 0)) + 1);
    const slug = data.title.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-");
    if (mockData.some((n) => n.slug === slug)) {
      throw new Error("Ya existe una noticia con un ttulo similar (slug duplicado).");
    }
    const newArticle = { ...data, id: newId, slug };
    mockData.push(newArticle);
    return newArticle;
  }
  async updateNews(slug, data) {
    const index = mockData.findIndex((n) => n.slug === slug);
    if (index === -1) throw new Error("Noticia no encontrada");
    if (data.slug && data.slug !== slug) {
      if (mockData.some((n) => n.slug === data.slug)) {
        throw new Error("El slug indicado ya está en uso.");
      }
    }
    const updated = { ...mockData[index], ...data };
    mockData[index] = updated;
    return updated;
  }
  async deleteNews(slug) {
    const index = mockData.findIndex((n) => n.slug === slug);
    if (index === -1) return false;
    mockData.splice(index, 1);
    return true;
  }
}
class NewsService {
  constructor(provider) {
    this.provider = provider || new MockNewsProvider();
  }
  async getNews() {
    return this.provider.getNews();
  }
  async getNewsBySlug(slug) {
    return this.provider.getNewsBySlug(slug);
  }
  async createNews(data) {
    return this.provider.createNews(data);
  }
  async updateNews(slug, data) {
    return this.provider.updateNews(slug, data);
  }
  async deleteNews(slug) {
    return this.provider.deleteNews(slug);
  }
}
const newsService = new NewsService();

export { newsService as n };
//# sourceMappingURL=NewsService-Bc9lP8_0.mjs.map
