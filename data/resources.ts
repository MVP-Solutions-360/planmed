export interface Document {
  id: string;
  title: string;
  description: string;
  type: 'pdf' | 'link' | 'form';
  url: string;
}

export const documents: Document[] = [];
