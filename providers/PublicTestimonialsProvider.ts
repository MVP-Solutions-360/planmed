import type { TestimonialsContent } from '~/types/testimonials'

export interface PublicTestimonialsProvider {
  getContent(): Promise<TestimonialsContent>
}
