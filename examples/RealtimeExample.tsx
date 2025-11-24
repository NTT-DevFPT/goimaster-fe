// Example component showing how to use Supabase Realtime
// This is just for reference, you can integrate this pattern into your existing components

import { useEffect, useState } from 'react';
import { supabase } from '../config/supabase';
import { Group } from '../types';

interface RealtimeGroupsProps {
  userId: string;
}

export const RealtimeGroupsExample: React.FC<RealtimeGroupsProps> = ({ userId }) => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Load initial groups
    loadGroups();

    // Subscribe to realtime changes
    const channel = supabase
      .channel('groups-realtime')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'groups',
          filter: `user_id=eq.${userId}` // Only current user's groups
        },
        (payload) => {
          console.log('Realtime event received:', payload);

          switch (payload.eventType) {
            case 'INSERT':
              // New group created
              if (payload.new) {
                setGroups(prev => [...prev, payload.new as Group]);
                console.log('✅ New group added:', payload.new);
              }
              break;

            case 'UPDATE':
              // Group updated
              if (payload.new) {
                setGroups(prev =>
                  prev.map(group =>
                    group.id === payload.new.id ? (payload.new as Group) : group
                  )
                );
                console.log('✅ Group updated:', payload.new);
              }
              break;

            case 'DELETE':
              // Group deleted
              if (payload.old) {
                setGroups(prev =>
                  prev.filter(group => group.id !== payload.old.id)
                );
                console.log('✅ Group deleted:', payload.old);
              }
              break;
          }
        }
      )
      .subscribe((status) => {
        console.log('Subscription status:', status);
        setIsConnected(status === 'SUBSCRIBED');
      });

    // Cleanup: unsubscribe when component unmounts
    return () => {
      console.log('Unsubscribing from realtime channel');
      channel.unsubscribe();
    };
  }, [userId]);

  const loadGroups = async () => {
    // Your existing load groups logic
    // This will be replaced by realtime updates
  };

  return (
    <div>
      <div className="mb-4">
        <span
          className={`px-3 py-1 rounded-full text-sm ${
            isConnected
              ? 'bg-green-100 text-green-800'
              : 'bg-gray-100 text-gray-800'
          }`}
        >
          {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
        </span>
      </div>

      <div>
        <h2>Groups (Realtime)</h2>
        {groups.map(group => (
          <div key={group.id}>{group.name}</div>
        ))}
      </div>
    </div>
  );
};

// Example: Listen to words in a lesson
export const RealtimeWordsExample: React.FC<{ lessonId: string }> = ({ lessonId }) => {
  const [wordCount, setWordCount] = useState(0);

  useEffect(() => {
    const channel = supabase
      .channel(`words-${lessonId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'words',
          filter: `lesson_id=eq.${lessonId}`
        },
        (payload) => {
          console.log('Word changed:', payload);

          if (payload.eventType === 'INSERT') {
            setWordCount(prev => prev + 1);
          } else if (payload.eventType === 'DELETE') {
            setWordCount(prev => prev - 1);
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [lessonId]);

  return <div>Words in lesson: {wordCount}</div>;
};



