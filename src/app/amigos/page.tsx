'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  FaUserFriends,
  FaPlus,
  FaEdit,
  FaTrash,
  FaSearch,
  FaGift,
  FaEnvelope,
  FaPhone,
  FaArrowLeft,
  FaTimes,
  FaSpinner,
  FaStickyNote,
} from 'react-icons/fa';
import { supabase } from '@/lib/supabase';
import { Friend } from '@/types/database';
import toast from 'react-hot-toast';

interface FriendFormData {
  name: string;
  email: string;
  phone: string;
  notes: string;
}

const initialFormData: FriendFormData = {
  name: '',
  email: '',
  phone: '',
  notes: '',
};

export default function AmigosPage() {
  const router = useRouter();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [filteredFriends, setFilteredFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingFriend, setEditingFriend] = useState<Friend | null>(null);
  const [formData, setFormData] = useState<FriendFormData>(initialFormData);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    checkAuthAndLoadFriends();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = friends.filter(
        (friend) =>
          friend.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          friend.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          friend.phone?.includes(searchTerm)
      );
      setFilteredFriends(filtered);
    } else {
      setFilteredFriends(friends);
    }
  }, [searchTerm, friends]);

  const checkAuthAndLoadFriends = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.push('/login');
        return;
      }

      await loadFriends(session.user.id);
    } catch (error) {
      console.error('Error checking auth:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const loadFriends = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('friends')
        .select('*')
        .eq('user_id', userId)
        .order('name', { ascending: true });

      if (error) throw error;

      setFriends(data || []);
      setFilteredFriends(data || []);
    } catch (error) {
      console.error('Error loading friends:', error);
      toast.error('Erro ao carregar amigos');
    }
  };

  const handleOpenModal = (friend?: Friend) => {
    if (friend) {
      setEditingFriend(friend);
      setFormData({
        name: friend.name,
        email: friend.email || '',
        phone: friend.phone || '',
        notes: friend.notes || '',
      });
    } else {
      setEditingFriend(null);
      setFormData(initialFormData);
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingFriend(null);
    setFormData(initialFormData);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('O nome é obrigatório');
      return;
    }

    setSubmitting(true);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        toast.error('Sessão expirada. Faz login novamente.');
        router.push('/login');
        return;
      }

      if (editingFriend) {
        // Update existing friend
        const { error } = await supabase
          .from('friends')
          .update({
            name: formData.name.trim(),
            email: formData.email.trim() || null,
            phone: formData.phone.trim() || null,
            notes: formData.notes.trim() || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingFriend.id)
          .eq('user_id', session.user.id);

        if (error) throw error;

        toast.success('Amigo atualizado com sucesso!');
      } else {
        // Create new friend
        const { error } = await supabase.from('friends').insert({
          user_id: session.user.id,
          name: formData.name.trim(),
          email: formData.email.trim() || null,
          phone: formData.phone.trim() || null,
          notes: formData.notes.trim() || null,
        });

        if (error) throw error;

        toast.success('Amigo adicionado com sucesso!');
      }

      handleCloseModal();
      await loadFriends(session.user.id);
    } catch (error) {
      console.error('Error saving friend:', error);
      toast.error('Erro ao guardar amigo');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (friendId: string) => {
    if (!confirm('Tens a certeza que queres eliminar este amigo?')) {
      return;
    }

    setDeletingId(friendId);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        toast.error('Sessão expirada');
        router.push('/login');
        return;
      }

      const { error } = await supabase
        .from('friends')
        .delete()
        .eq('id', friendId)
        .eq('user_id', session.user.id);

      if (error) throw error;

      toast.success('Amigo eliminado');
      await loadFriends(session.user.id);
    } catch (error) {
      console.error('Error deleting friend:', error);
      toast.error('Erro ao eliminar amigo');
    } finally {
      setDeletingId(null);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getAvatarColor = (name: string) => {
    const colors = [
      'bg-red-500',
      'bg-blue-500',
      'bg-green-500',
      'bg-yellow-500',
      'bg-purple-500',
      'bg-pink-500',
      'bg-indigo-500',
      'bg-teal-500',
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-600 via-red-700 to-green-700 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-white"></div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-red-600 via-red-700 to-green-700">
      {/* Header */}
      <header className="bg-black/20 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-white/80 hover:text-white transition flex items-center gap-2"
            >
              <FaArrowLeft />
              <span className="hidden sm:inline">Voltar</span>
            </Link>
            <div className="flex items-center gap-2">
              <FaUserFriends className="w-6 h-6 text-yellow-400" />
              <h1 className="text-xl font-bold text-white">Os Meus Amigos</h1>
            </div>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 px-4 py-2 bg-yellow-500 hover:bg-yellow-400 text-gray-900 font-semibold rounded-lg transition transform hover:-translate-y-0.5"
          >
            <FaPlus />
            <span className="hidden sm:inline">Adicionar Amigo</span>
          </button>
        </div>
      </header>

      {/* Search Bar */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="relative">
          <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Pesquisar amigos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition"
            >
              <FaTimes />
            </button>
          )}
        </div>
      </div>

      {/* Friends Grid */}
      <div className="max-w-6xl mx-auto px-4 pb-8">
        {filteredFriends.length === 0 ? (
          <div className="text-center py-16">
            <FaUserFriends className="w-16 h-16 text-white/30 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">
              {searchTerm
                ? 'Nenhum amigo encontrado'
                : 'Ainda não tens amigos adicionados'}
            </h2>
            <p className="text-white/60 mb-6">
              {searchTerm
                ? 'Tenta pesquisar por outro termo'
                : 'Adiciona os teus amigos para organizar o amigo oculto'}
            </p>
            {!searchTerm && (
              <button
                onClick={() => handleOpenModal()}
                className="inline-flex items-center gap-2 px-6 py-3 bg-yellow-500 hover:bg-yellow-400 text-gray-900 font-semibold rounded-lg transition"
              >
                <FaPlus />
                Adicionar Primeiro Amigo
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredFriends.map((friend) => (
              <div
                key={friend.id}
                className="bg-white/10 backdrop-blur-sm rounded-xl p-5 hover:bg-white/15 transition group"
              >
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <div
                    className={`${getAvatarColor(
                      friend.name
                    )} w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0`}
                  >
                    {friend.avatar_url ? (
                      <img
                        src={friend.avatar_url}
                        alt={friend.name}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      getInitials(friend.name)
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-white truncate">
                      {friend.name}
                    </h3>
                    {friend.email && (
                      <p className="text-white/60 text-sm flex items-center gap-2 truncate">
                        <FaEnvelope className="flex-shrink-0" />
                        <span className="truncate">{friend.email}</span>
                      </p>
                    )}
                    {friend.phone && (
                      <p className="text-white/60 text-sm flex items-center gap-2">
                        <FaPhone className="flex-shrink-0" />
                        {friend.phone}
                      </p>
                    )}
                    {friend.notes && (
                      <p className="text-white/50 text-sm flex items-center gap-2 mt-1 truncate">
                        <FaStickyNote className="flex-shrink-0" />
                        <span className="truncate">{friend.notes}</span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-2 mt-4 pt-4 border-t border-white/10">
                  <Link
                    href={`/presentes?friend=${friend.id}`}
                    className="p-2 text-yellow-400 hover:bg-yellow-400/20 rounded-lg transition"
                    title="Ver presentes"
                  >
                    <FaGift />
                  </Link>
                  <button
                    onClick={() => handleOpenModal(friend)}
                    className="p-2 text-blue-400 hover:bg-blue-400/20 rounded-lg transition"
                    title="Editar"
                  >
                    <FaEdit />
                  </button>
                  <button
                    onClick={() => handleDelete(friend.id)}
                    disabled={deletingId === friend.id}
                    className="p-2 text-red-400 hover:bg-red-400/20 rounded-lg transition disabled:opacity-50"
                    title="Eliminar"
                  >
                    {deletingId === friend.id ? (
                      <FaSpinner className="animate-spin" />
                    ) : (
                      <FaTrash />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Stats */}
        {friends.length > 0 && (
          <div className="mt-8 text-center text-white/60">
            <p>
              Total: {friends.length} amigo{friends.length !== 1 ? 's' : ''}
              {searchTerm &&
                filteredFriends.length !== friends.length &&
                ` (${filteredFriends.length} encontrado${
                  filteredFriends.length !== 1 ? 's' : ''
                })`}
            </p>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900">
                {editingFriend ? 'Editar Amigo' : 'Adicionar Amigo'}
              </h2>
              <button
                onClick={handleCloseModal}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition"
              >
                <FaTimes />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Name */}
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Nome *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Nome do amigo"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition"
                  required
                />
              </div>

              {/* Email */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="email@exemplo.com"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition"
                />
              </div>

              {/* Phone */}
              <div>
                <label
                  htmlFor="phone"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Telefone
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+351 912 345 678"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition"
                />
              </div>

              {/* Notes */}
              <div>
                <label
                  htmlFor="notes"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Notas
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder="Interesses, gostos, tamanhos..."
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition resize-none"
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <FaSpinner className="animate-spin" />
                      A guardar...
                    </>
                  ) : editingFriend ? (
                    'Guardar Alterações'
                  ) : (
                    'Adicionar Amigo'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
