import type { TestimonialsContent } from '~/types/testimonials'

export interface TestimonialsProvider {
  getContent(): Promise<TestimonialsContent>
  saveContent(data: TestimonialsContent): Promise<TestimonialsContent>
}
