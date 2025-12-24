"use client";

import React, { useState, useMemo } from 'react';
import styles from './PortfolioTerminal.module.css';

interface TreeNode {
  name: string;
  children: TreeNode[];
}

export const StructureVisualizer = () => {
  const [input, setInput] = useState(`src/
  text_generation.py
  hf_model.py
  api_model.py
  config.py
outputs/
  sample_outputs.json
requirements.txt
.env
README.md`);

  // Parse indented text into a tree structure
  const parseTree = (text: string): TreeNode[] => {
    const lines = text.split('\n').filter(line => line.trim().length > 0);
    const root: TreeNode[] = [];
    const stack: { node: TreeNode, level: number }[] = [];

    lines.forEach(line => {
      const indentMatch = line.match(/^(\s*)/);
      const spaces = indentMatch ? indentMatch[1].length : 0;
      // Assume 2 spaces or 1 tab per level, roughly
      // Use 2 as standard, but handle anything > previous as child
      const level = spaces; 
      
      const newNode: TreeNode = {
        name: line.trim(),
        children: []
      };

      if (root.length === 0 || level === 0) {
        root.push(newNode);
        stack.length = 0;
        stack.push({ node: newNode, level: 0 }); // Root is always level 0 effectively for the stack base
      } else {
        // Find parent: the immediate previous node with level < current level
        // Actually for a strict tree, parent is the last node seen with level < current
        
        // Simple heuristic: 
        // We look at the stack. We pop until we find a node with strictly less indent than current.
        while (stack.length > 0 && stack[stack.length - 1].level >= level) {
          stack.pop();
        }

        if (stack.length > 0) {
           stack[stack.length - 1].node.children.push(newNode);
        } else {
           // Fallback if indentation is weird, treat as root sibling
           root.push(newNode);
        }
        stack.push({ node: newNode, level });
      }
    });

    return root;
  };

  // Generate ASCII lines from TreeNodes
  const generateAscii = (nodes: TreeNode[], prefix: string = '', isLastChildren: boolean[] = []): string[] => {
    let result: string[] = [];
    
    nodes.forEach((node, index) => {
      const isLast = index === nodes.length - 1;
      const connector = isLast ? '└── ' : '├── ';
      
      result.push(`${prefix}${connector}${node.name}`);
      
      if (node.children.length > 0) {
        const childPrefix = prefix + (isLast ? '    ' : '│   ');
        result = result.concat(generateAscii(node.children, childPrefix));
      }
    });

    return result;
  };

  const treeOutput = useMemo(() => {
     const nodes = parseTree(input);
     // For the very top level roots, we don't usually print connectors if we want to emulate 'tree .'
     // But usually 'tree' command shows top level items with connectors if there are multiple.
     // Let's standardise: list of roots behaves like children of an invisible root.
     return generateAscii(nodes);
  }, [input]);

  return (
    <div className={styles.visualizerContainer}>
        <div className={styles.visualizerHeader}>
            DIRECTORY_GENERATOR // ASCII_MODE
        </div>
        
        <div className={styles.splitView}>
            {/* INPUT PANEL */}
            <div className={styles.inputPanel}>
                <div className={styles.panelLabel}>INPUT_SOURCE</div>
                <textarea 
                   className={styles.structureInput}
                   value={input}
                   onChange={e => setInput(e.target.value)}
                   onKeyDown={e => e.stopPropagation()}
                   onClick={e => e.stopPropagation()}
                   onFocus={e => e.stopPropagation()}
                   spellCheck={false}
                   placeholder="Type folder names... indent with spaces to nest."
                />
            </div>

            {/* PREVIEW PANEL */}
            <div className={styles.previewPanel}>
                <div className={styles.panelLabel}>ASCII_OUTPUT</div>
                <div className={styles.asciiOutput}>
                    {treeOutput.map((line, i) => (
                        <div key={i} className={styles.asciiLine}>{line}</div>
                    ))}
                </div>
            </div>
        </div>
    </div>
  );
};
