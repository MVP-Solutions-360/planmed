import type { TestimonialsProvider } from '~/providers/TestimonialsProvider'
import type { TestimonialsContent } from '~/types/testimonials'
import { HubTestimonialsProvider } from '~/providers/HubTestimonialsProvider'

export class TestimonialsService {
  private provider: TestimonialsProvider

  constructor(provider?: TestimonialsProvider) {
    this.provider = provider || new HubTestimonialsProvider()
  }

  getContent(): Promise<TestimonialsContent> {
    return this.provider.getContent()
  }

  saveContent(data: TestimonialsContent): Promise<TestimonialsContent> {
    return this.provider.saveContent(data)
  }
}

export const testimonialsService = new TestimonialsService()
