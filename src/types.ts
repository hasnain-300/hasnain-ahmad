export interface Project {
  id: string;
  title: string;
  description: string;
  image: string;
  tags: string[];
  link: string;
  github: string;
}

export interface Skill {
  id: string;
  name: string;
  category: 'Frontend' | 'Backend' | 'Database' | 'Tools';
  icon: string;
}

export interface Message {
  id: string;
  name: string;
  email: string;
  message: string;
  date: string;
}

export interface Profile {
  name: string;
  title: string;
  bio: string;
  aboutText: string;
  experienceYears: string;
  projectsCompleted: string;
  clientSatisfaction: string;
  aboutImage1: string;
  aboutImage2: string;
  image: string;
  github: string;
  linkedin: string;
  email: string;
  twitter: string;
  facebook?: string;
  instagram?: string;
  whatsapp?: string;
}
