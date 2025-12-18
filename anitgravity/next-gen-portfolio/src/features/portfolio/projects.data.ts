import { Project } from './types';

export const PROJECTS: Project[] = [
  {
    id: '1',
    title: 'Neon Commerce',
    description: 'A futuristic e-commerce platform built with Next.js 14 and WebGL product visualizations.',
    tags: ['Next.js', 'WebGL', 'Three.js', 'Stripe'],
    imageUrl: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    link: '#',
    featured: true,
    stats: [
      { label: 'Performance', value: '100%' },
      { label: 'Users', value: '10k+' }
    ]
  },
  {
    id: '2',
    title: 'AI Architect',
    description: 'Generative design tool for architects using Stable Diffusion and ControlNet.',
    tags: ['Python', 'React', 'FastAPI', 'AI'],
    imageUrl: 'linear-gradient(to right, #43e97b 0%, #38f9d7 100%)',
    link: '#',
    stats: [
      { label: 'Gen Time', value: '<2s' }
    ]
  },
  {
    id: '3',
    title: 'Cyber Dashboard',
    description: 'Real-time analytics dashboard with glassmorphism UI and websocket updates.',
    tags: ['Vue 3', 'D3.js', 'Socket.io'],
    imageUrl: 'linear-gradient(to top, #30cfd0 0%, #330867 100%)',
    link: '#',
  },
  {
    id: '4',
    title: 'Quantum Finance',
    description: 'DeFi protocol aggregator with zero-knowledge proof identity verification.',
    tags: ['Solidity', 'Web3.js', 'Rust'],
    imageUrl: 'linear-gradient(to top, #fcc5e4 0%, #fda34b 15%, #ff7882 35%, #c8699e 52%, #7046aa 71%, #0c1db8 87%, #020f75 100%)',
    link: '#',
  }
];
