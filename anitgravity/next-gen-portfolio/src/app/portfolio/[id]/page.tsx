import React from 'react';
import { notFound } from 'next/navigation';
import { PROJECTS } from '@/features/portfolio/projects.data';
import { ProjectTerminal } from '@/features/portfolio/ProjectTerminal';
import '@/app/globals.css';

// Generate static params for all projects
export function generateStaticParams() {
  return PROJECTS.map((project) => ({
    id: project.id,
  }));
}

export default function ProjectDetailsPage({ params }: { params: { id: string } }) {
  const project = PROJECTS.find((p) => p.id === params.id);

  if (!project) {
    notFound();
  }

  return <ProjectTerminal project={project} />;
}
