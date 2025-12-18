export interface Project {
  id: string;
  title: string;
  description: string;
  tags: string[];
  imageUrl: string; // We'll use gradients/placeholders for now
  link: string;
  featured?: boolean;
  stats?: {
    label: string;
    value: string;
  }[];
}
