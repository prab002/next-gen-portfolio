"use client";

import React, { useState, useEffect } from 'react';
import styles from '../styles/PortfolioTerminal.module.css';

interface Task {
  id: string;
  displayId: string;
  title: string;
  status: 'todo' | 'in-progress' | 'done';
  type: 'feature' | 'bug' | 'research';
  assignee: string;
}

export const KanbanBoard = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [isClient, setIsClient] = useState(false);

  // Load from local storage
  useEffect(() => {
    setIsClient(true);
    const saved = localStorage.getItem('kanban_tasks_v2');
    if (saved) {
      setTasks(JSON.parse(saved));
    } else {
        // Default tasks matching the theme
      setTasks([
        { id: '1', displayId: 'Task-52', title: 'Conduct thorough analysis of target market', status: 'todo', type: 'research', assignee: 'Victor Brooks' },
        { id: '2', displayId: 'Task-10', title: 'Establish basic operational processes', status: 'todo', type: 'feature', assignee: 'Cameron W.' },
        { id: '3', displayId: 'Task-102', title: 'Design logo, choose color scheme', status: 'done', type: 'feature', assignee: 'Jerome Bell' },
        { id: '4', displayId: 'Task-98', title: 'Build relationships with startup ecosystem', status: 'in-progress', type: 'bug', assignee: 'Jerome Bell' }
      ]);
    }
  }, []);

  // Save to local storage
  useEffect(() => {
    if (isClient) {
      localStorage.setItem('kanban_tasks_v2', JSON.stringify(tasks));
    }
  }, [tasks, isClient]);

  const addTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    
    const randomId = Math.floor(Math.random() * 1000);
    const newTask: Task = {
      id: Date.now().toString(),
      displayId: `Task-${randomId}`,
      title: newTaskTitle,
      status: 'todo',
      type: 'feature',
      assignee: 'Visitor'
    };
    
    setTasks([...tasks, newTask]);
    setNewTaskTitle('');
  };

  const onDragStart = (e: React.DragEvent, id: string) => {
      e.dataTransfer.setData("taskId", id);
  };

  const onDragOver = (e: React.DragEvent) => {
      e.preventDefault();
  };

  const onDrop = (e: React.DragEvent, status: Task['status']) => {
      const id = e.dataTransfer.getData("taskId");
      
      setTasks(tasks.map(t => {
          if (t.id === id) {
              return { ...t, status };
          }
          return t;
      }));
  };
  
  const deleteTask = (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      setTasks(tasks.filter(t => t.id !== id));
  }

  const getTypeIcon = (type: Task['type']) => {
      switch(type) {
          case 'feature': return '☂'; // Umbrella/Parachute icon from ref
          case 'bug': return '⚡'; // Lightning
          case 'research': return '☂'; 
          default: return '●';
      }
  };

  const getTypeColor = (type: Task['type']) => {
      switch(type) {
          case 'feature': return styles.badgeGreen;
          case 'bug': return styles.badgePurple;
          case 'research': return styles.badgePurple;
          default: return styles.badgeGold;
      }
  };

  const renderColumn = (status: Task['status'], title: string) => {
      const colTasks = tasks.filter(t => t.status === status);
      
      return (
          <div 
             className={styles.kanbanColumn}
             onDragOver={onDragOver}
             onDrop={(e) => onDrop(e, status)}
          >
             <div className={styles.kanbanHeader}>
                {title} <span className={styles.countBadge}>{colTasks.length}</span>
             </div>
             <div className={styles.kanbanList}>
               {colTasks.map(task => (
                   <div 
                     key={task.id} 
                     draggable 
                     onDragStart={(e) => onDragStart(e, task.id)}
                     className={styles.kanbanCard}
                   >
                     <div className={styles.cardTopRow}>
                         <div className={`${styles.cardBadge} ${getTypeColor(task.type)}`}>
                             {getTypeIcon(task.type)}
                         </div>
                         <div className={styles.cardId}>{task.displayId}</div>
                     </div>
                     
                     <div className={styles.cardTitleText}>{task.title}</div>
                     
                     <div className={styles.cardFooter}>
                         <div className={styles.cardAssignee}>
                             <div className={styles.avatarPlaceholder} /> 
                             {task.assignee}
                         </div>
                         <div className={styles.cardActions}>
                             <button className={styles.iconBtn}>📎</button>
                             <button className={styles.iconBtn} onClick={(e) => deleteTask(task.id, e)}>×</button>
                         </div>
                     </div>
                   </div>
               ))}
               {colTasks.length === 0 && (
                   <div className={styles.emptySlot}>Empty List</div>
               )}
             </div>
          </div>
      );
  };

  return (
    <div className={styles.kanbanContainer}>
       <div className={styles.kanbanTopBar}>
          <div className={styles.kanbanTitle}>PROJECT_MGMT // KANBAN_MODE</div>
          <form onSubmit={addTask} className={styles.addTaskForm}>
             <input 
               type="text" 
               className={styles.addTaskInput}
               placeholder="> Add new directive..."
               value={newTaskTitle}
               onChange={e => setNewTaskTitle(e.target.value)}
             />
             <button type="submit" className={styles.addTaskBtn}>INIT</button>
          </form>
       </div>

       <div className={styles.kanbanBoard}>
          {renderColumn('todo', 'TODO')}
          {renderColumn('in-progress', 'IN_PROGRESS')}
          {renderColumn('done', 'COMPLETED')}
       </div>
    </div>
  );
};
