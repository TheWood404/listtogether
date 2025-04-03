'use client';

import { useEffect, useState } from 'react';
import { getTasks, subscribeToList } from '@/app/lib/supabase';
import TaskItem from './TaskItem';
import AddTaskForm from './AddTaskForm';

export default function TaskList({ listId }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const fetchTasks = async () => {
    try {
      const { data, error } = await getTasks(listId);
      
      if (error) {
        throw error;
      }
      
      setTasks(data || []);
    } catch (error) {
      setError(error.message || 'Une erreur est survenue lors du chargement des tâches');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
    
    // Set up realtime subscription
    const subscription = subscribeToList(listId, (payload) => {
      // Handle realtime updates
      console.log('Realtime update:', payload);
      
      if (payload.eventType === 'INSERT') {
        setTasks((prevTasks) => [payload.new, ...prevTasks]);
      } else if (payload.eventType === 'UPDATE') {
        setTasks((prevTasks) => 
          prevTasks.map((task) => 
            task.id === payload.new.id ? payload.new : task
          )
        );
      } else if (payload.eventType === 'DELETE') {
        setTasks((prevTasks) => 
          prevTasks.filter((task) => task.id !== payload.old.id)
        );
      }
    });
    
    // Clean up subscription on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, [listId]);

  const handleTaskAdded = (newTask) => {
    // The task will be added via the realtime subscription,
    // but we can also add it manually for immediate feedback
    setTasks((prevTasks) => [newTask, ...prevTasks]);
  };
  
  const handleTaskDeleted = (taskId) => {
    // Supprimer la tâche localement pour un feedback immédiat
    // (la suppression sera aussi gérée par la subscription)
    setTasks((prevTasks) => prevTasks.filter(task => task.id !== taskId));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-6">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AddTaskForm listId={listId} onTaskAdded={handleTaskAdded} />
      
      {error && (
        <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}
      
      <div className="divide-y divide-gray-200">
        {tasks.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <p className="text-gray-500">Aucune tâche dans cette liste</p>
          </div>
        ) : (
          tasks.map((task) => (
            <TaskItem 
              key={task.id} 
              task={task} 
              onTaskDeleted={handleTaskDeleted}
            />
          ))
        )}
      </div>
    </div>
  );
}