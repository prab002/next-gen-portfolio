"use client";

import React, { useCallback } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  BackgroundVariant,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { initialNodes, initialEdges } from '../data/skills-graph';
import styles from '../styles/PortfolioTerminal.module.css'; // Re-use or separate? Let's keep it inline for now or create new

interface TechGraphProps {
  onNodeSelect?: (tag: string) => void;
}

const TechGraph = ({ onNodeSelect }: TechGraphProps) => {
  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  );

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    if (onNodeSelect && node.data.label) {
        onNodeSelect(node.data.label as string);
    }
  }, [onNodeSelect]);

  return (
    <div style={{ height: '500px', width: '100%', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '8px', overflow: 'hidden' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        fitView
        attributionPosition="bottom-right"
        colorMode="dark"
      >
        <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
        <Controls />
      </ReactFlow>
    </div>
  );
};

export default TechGraph;
