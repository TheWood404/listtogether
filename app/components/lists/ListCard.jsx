'use client';

import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function ListCard({ list }) {
  if (!list || !list.id) {
    console.error('ListCard reçu avec des données invalides:', list);
    return null;
  }

  const getFormattedDate = () => {
    try {
      if (!list.updated_at) return '';
      return formatDistanceToNow(new Date(list.updated_at), { 
        addSuffix: true, 
        locale: fr 
      });
    } catch (e) {
      console.error('Erreur de formatage de date:', e);
      return '';
    }
  };

  const formattedDate = getFormattedDate();
  const cardId = `list-${list.id}-${list.role || 'member'}`;

  return (
    <Link 
      href={`/list/${list.id}`}
      className="block bg-gradient-to-br from-white to-gray-100 rounded-2xl shadow-lg hover:shadow-xl transition-all p-5 border border-gray-200 hover:border-gray-300 transform hover:scale-[1.02] w-full max-w-md mx-auto md:max-w-lg"
      data-card-id={cardId}
    >
      <h3 className="text-base md:text-lg font-bold text-gray-900 truncate tracking-wide">{list.title}</h3>
      
      {list.description && (
        <p className="mt-2 text-sm md:text-base text-gray-700 line-clamp-2 italic">{list.description}</p>
      )}
      
      <div className="mt-4 flex flex-col md:flex-row md:justify-between md:items-center text-xs text-gray-600 gap-2">
        <span className="text-gray-500 text-center md:text-left">{formattedDate ? `📅 Mis à jour ${formattedDate}` : ''}</span>
        <span className={`px-3 py-1 rounded-full text-xs font-medium shadow-md self-center md:self-auto ${list.role === 'owner' ? 'bg-blue-500 text-white' : 'bg-gray-300 text-gray-800'}`}>
          {list.role === 'owner' ? '👑 Propriétaire' : '🙌 Membre'}
        </span>
      </div>
    </Link>
  );
}
