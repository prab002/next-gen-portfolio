import { Node, Edge } from '@xyflow/react';

export const initialNodes: Node[] = [
  // Core
  { id: 'core', type: 'input', data: { label: 'Core Engineering' }, position: { x: 250, y: 0 } },
  
  // Languages
  { id: 'ts', data: { label: 'TypeScript' }, position: { x: 100, y: 100 } },
  { id: 'js', data: { label: 'JavaScript' }, position: { x: 400, y: 100 } },
  
  // Frontend
  { id: 'react', data: { label: 'React 19' }, position: { x: 100, y: 200 } },
  { id: 'next', data: { label: 'Next.js 16' }, position: { x: 100, y: 300 } },
  { id: 'tailwind', data: { label: 'Tailwind' }, position: { x: 250, y: 200 } },
  
  // Backend/Infra
  { id: 'node', data: { label: 'Node.js' }, position: { x: 400, y: 200 } },
  { id: 'db', data: { label: 'PostgreSQL' }, position: { x: 400, y: 300 } },
  { id: 'cloud', data: { label: 'Vercel / AWS' }, position: { x: 250, y: 400 } },

  // AI
  { id: 'ai', data: { label: 'GenAI / LLMs' }, position: { x: 550, y: 150 } },
];

export const initialEdges: Edge[] = [
  { id: 'e-core-ts', source: 'core', target: 'ts', animated: true },
  { id: 'e-core-js', source: 'core', target: 'js', animated: true },
  { id: 'e-ts-react', source: 'ts', target: 'react', animated: true },
  { id: 'e-js-node', source: 'js', target: 'node', animated: true },
  { id: 'e-react-next', source: 'react', target: 'next', animated: true },
  { id: 'e-react-tailwind', source: 'react', target: 'tailwind', animated: true },
  { id: 'e-node-db', source: 'node', target: 'db', animated: true },
  { id: 'e-next-cloud', source: 'next', target: 'cloud', animated: true },
  { id: 'e-js-ai', source: 'js', target: 'ai', animated: true },
];
