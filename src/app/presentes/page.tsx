'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  FaGift,
  FaPlus,
  FaEdit,
  FaTrash,
  FaSearch,
  FaArrowLeft,
  FaTimes,
  FaSpinner,
  FaExternalLinkAlt,
  FaCheck,
  FaShoppingCart,
  FaEuroSign,
  FaStar,
  FaFilter,
  FaUserFriends,
} from 'react-icons/fa';
import { supabase } from '@/lib/supabase';
import { GiftIdea, Friend, PriceRange, Priority } from '@/types/database';
import toast from 'react-hot-toast';

interface GiftIdeaWithFriend extends GiftIdea {
  friend?: Friend;
}

interface GiftFormData {
  friend_id: string;
  title: string;
  description: string;
  price_range: PriceRange | '';
  url: string;
  priority: Priority;
}

const initialFormData: GiftFormData = {
  friend_id: '',
  title: '',
  description: '',
  price_range: '',
  url: '',
  priority: 'medium',
};

const priceRangeLabels: Record<PriceRange, string> = {
  low: '€ (até 15€)',
  medium: '€€ (15€ - 30€)',
  high: '€€€ (30€ - 50€)',
  luxury: '€€€€ (50€+)',
};

const priorityLabels: Record<Priority, string> = {
  low: 'Baixa',
  medium: 'Média',
  high: 'Alta',
};

const priorityColors: Record<Priority, string> = {
  low: 'bg-gray-500/20 text-gray-300',
  medium: 'bg-yellow-500/20 text-yellow-300',
  high: 'bg-red-500/20 text-red-300',
};

export default function PresentesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const friendIdParam = searchParams.get('friend');

  const [gifts, setGifts] = useState<GiftIdeaWithFriend[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [filteredGifts, setFilteredGifts] = useState<GiftIdeaWithFriend[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterFriend, setFilterFriend] = useState<string>(friendIdParam || '');
  const [filterPurchased, setFilterPurchased] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);
  const [editingGift, setEditingGift] = useState<GiftIdea | null>(null);
  const [formData, setFormData] = useState<GiftFormData>(initialFormData);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  useEffect(() => {
    checkAuthAndLoadData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [searchTerm, filterFriend, filterPurchased, gifts]);

  useEffect(() => {
    if (friendIdParam) {
      setFilterFriend(friendIdParam);
    }
  }, [friendIdParam]);

  const checkAuthAndLoadData = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.push('/login');
        return;
      }

      await Promise.all([
        loadGifts(session.user.id),
        loadFriends(session.user.id),
      ]);
    } catch (error) {
      console.error('Error checking auth:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const loadGifts = async (userId: string) => {
    try {
      const { data: giftsData, error } = await supabase
        .from('gift_ideas')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Load friend info for each gift
      const giftsWithFriends: GiftIdeaWithFriend[] = await Promise.all(
        (giftsData || []).map(async (gift) => {
          const { data: friend } = await supabase
            .from('friends')
            .select('*')
            .eq('id', gift.friend_id)
            .single();

          return {
            ...gift,
            friend: friend || undefined,
          };
        })
      );

      setGifts(giftsWithFriends);
    } catch (error) {
      console.error('Error loading gifts:', error);
      toast.error('Erro ao carregar presentes');
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
    } catch (error) {
      console.error('Error loading friends:', error);
    }
  };

  const applyFilters = () => {
    let filtered = [...gifts];

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (gift) =>
          gift.title.toLowerCase().includes(term) ||
          gift.description?.toLowerCase().includes(term) ||
          gift.friend?.name.toLowerCase().includes(term)
      );
    }

    // Friend filter
    if (filterFriend) {
      filtered = filtered.filter((gift) => gift.friend_id === filterFriend);
    }

    // Purchased filter
    if (filterPurchased === 'purchased') {
      filtered = filtered.filter((gift) => gift.is_purchased);
    } else if (filterPurchased === 'pending') {
      filtered = filtered.filter((gift) => !gift.is_purchased);
    }

    setFilteredGifts(filtered);
  };

  const handleOpenModal = (gift?: GiftIdea) => {
    if (gift) {
      setEditingGift(gift);
      setFormData({
        friend_id: gift.friend_id,
        title: gift.title,
        description: gift.description || '',
        price_range: gift.price_range || '',
        url: gift.url || '',
        priority: gift.priority,
      });
    } else {
      setEditingGift(null);
      setFormData({
        ...initialFormData,
        friend_id: filterFriend || '',
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingGift(null);
    setFormData(initialFormData);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.friend_id) {
      toast.error('Seleciona um amigo');
      return;
    }

    if (!formData.title.trim()) {
      toast.error('O título é obrigatório');
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

      const giftData = {
        friend_id: formData.friend_id,
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        price_range: formData.price_range || null,
        url: formData.url.trim() || null,
        priority: formData.priority,
      };

      if (editingGift) {
        const { error } = await supabase
          .from('gift_ideas')
          .update({
            ...giftData,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingGift.id)
          .eq('user_id', session.user.id);

        if (error) throw error;
        toast.success('Presente atualizado!');
      } else {
        const { error } = await supabase.from('gift_ideas').insert({
          ...giftData,
          user_id: session.user.id,
        });

        if (error) throw error;
        toast.success('Presente adicionado!');
      }

      handleCloseModal();
      await loadGifts(session.user.id);
    } catch (error) {
      console.error('Error saving gift:', error);
      toast.error('Erro ao guardar presente');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (giftId: string) => {
    if (!confirm('Tens a certeza que queres eliminar esta ideia de presente?')) {
      return;
    }

    setDeletingId(giftId);

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
        .from('gift_ideas')
        .delete()
        .eq('id', giftId)
        .eq('user_id', session.user.id);

      if (error) throw error;

      toast.success('Presente eliminado');
      await loadGifts(session.user.id);
    } catch (error) {
      console.error('Error deleting gift:', error);
      toast.error('Erro ao eliminar presente');
    } finally {
      setDeletingId(null);
    }
  };

  const handleTogglePurchased = async (gift: GiftIdea) => {
    setTogglingId(gift.id);

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
        .from('gift_ideas')
        .update({
          is_purchased: !gift.is_purchased,
          updated_at: new Date().toISOString(),
        })
        .eq('id', gift.id)
        .eq('user_id', session.user.id);

      if (error) throw error;

      toast.success(gift.is_purchased ? 'Marcado como não comprado' : 'Marcado como comprado! 🎉');
      await loadGifts(session.user.id);
    } catch (error) {
      console.error('Error toggling purchased:', error);
      toast.error('Erro ao atualizar estado');
    } finally {
      setTogglingId(null);
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

  const clearFilters = () => {
    setSearchTerm('');
    setFilterFriend('');
    setFilterPurchased('all');
    router.push('/presentes');
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
              <FaGift className="w-6 h-6 text-yellow-400" />
              <h1 className="text-xl font-bold text-white">Ideias de Presentes</h1>
            </div>
          </div>
          <button
            onClick={() => handleOpenModal()}
            disabled={friends.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-yellow-500 hover:bg-yellow-400 text-gray-900 font-semibold rounded-lg transition transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FaPlus />
            <span className="hidden sm:inline">Adicionar Presente</span>
          </button>
        </div>
      </header>

      {/* Filters */}
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-4">
        {/* Search */}
        <div className="relative">
          <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Pesquisar presentes..."
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

        {/* Filter Row */}
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <FaFilter className="text-white/60" />
            <select
              value={filterFriend}
              onChange={(e) => setFilterFriend(e.target.value)}
              className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-400 transition"
            >
              <option value="" className="text-gray-900">Todos os amigos</option>
              {friends.map((friend) => (
                <option key={friend.id} value={friend.id} className="text-gray-900">
                  {friend.name}
                </option>
              ))}
            </select>
          </div>

          <select
            value={filterPurchased}
            onChange={(e) => setFilterPurchased(e.target.value)}
            className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-400 transition"
          >
            <option value="all" className="text-gray-900">Todos</option>
            <option value="pending" className="text-gray-900">Por comprar</option>
            <option value="purchased" className="text-gray-900">Comprados</option>
          </select>

          {(filterFriend || filterPurchased !== 'all' || searchTerm) && (
            <button
              onClick={clearFilters}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-white transition flex items-center gap-2"
            >
              <FaTimes />
              Limpar filtros
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 pb-8">
        {friends.length === 0 ? (
          <div className="text-center py-16">
            <FaUserFriends className="w-16 h-16 text-white/30 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">
              Primeiro adiciona amigos
            </h2>
            <p className="text-white/60 mb-6">
              Precisas de adicionar amigos antes de guardar ideias de presentes
            </p>
            <Link
              href="/amigos"
              className="inline-flex items-center gap-2 px-6 py-3 bg-yellow-500 hover:bg-yellow-400 text-gray-900 font-semibold rounded-lg transition"
            >
              <FaPlus />
              Adicionar Amigos
            </Link>
          </div>
        ) : filteredGifts.length === 0 ? (
          <div className="text-center py-16">
            <FaGift className="w-16 h-16 text-white/30 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">
              {gifts.length === 0
                ? 'Ainda não tens ideias de presentes'
                : 'Nenhum presente encontrado'}
            </h2>
            <p className="text-white/60 mb-6">
              {gifts.length === 0
                ? 'Guarda ideias de presentes para os teus amigos'
                : 'Tenta ajustar os filtros'}
            </p>
            {gifts.length === 0 && (
              <button
                onClick={() => handleOpenModal()}
                className="inline-flex items-center gap-2 px-6 py-3 bg-yellow-500 hover:bg-yellow-400 text-gray-900 font-semibold rounded-lg transition"
              >
                <FaPlus />
                Adicionar Primeira Ideia
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredGifts.map((gift) => (
              <div
                key={gift.id}
                className={`bg-white/10 backdrop-blur-sm rounded-xl p-5 transition group ${
                  gift.is_purchased ? 'opacity-75' : 'hover:bg-white/15'
                }`}
              >
                {/* Friend Header */}
                {gift.friend && (
                  <div className="flex items-center gap-3 mb-4 pb-3 border-b border-white/10">
                    <div
                      className={`${getAvatarColor(gift.friend.name)} w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}
                    >
                      {getInitials(gift.friend.name)}
                    </div>
                    <span className="text-white font-medium truncate">
                      {gift.friend.name}
                    </span>
                  </div>
                )}

                {/* Gift Info */}
                <div className="mb-4">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className={`text-lg font-semibold text-white ${gift.is_purchased ? 'line-through' : ''}`}>
                      {gift.title}
                    </h3>
                    {gift.is_purchased && (
                      <span className="flex-shrink-0 px-2 py-0.5 bg-green-500/30 text-green-300 rounded-full text-xs">
                        Comprado
                      </span>
                    )}
                  </div>

                  {gift.description && (
                    <p className="text-white/60 text-sm mt-2 line-clamp-2">
                      {gift.description}
                    </p>
                  )}

                  {/* Tags */}
                  <div className="flex flex-wrap gap-2 mt-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${priorityColors[gift.priority]}`}>
                      <FaStar className="inline mr-1" />
                      {priorityLabels[gift.priority]}
                    </span>
                    {gift.price_range && (
                      <span className="px-2 py-0.5 bg-green-500/20 text-green-300 rounded-full text-xs">
                        <FaEuroSign className="inline mr-1" />
                        {priceRangeLabels[gift.price_range]}
                      </span>
                    )}
                  </div>

                  {/* Link */}
                  {gift.url && (
                    <a
                      href={gift.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-blue-300 hover:text-blue-200 text-sm mt-3 transition"
                    >
                      <FaExternalLinkAlt className="w-3 h-3" />
                      Ver produto
                    </a>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-4 border-t border-white/10">
                  <button
                    onClick={() => handleTogglePurchased(gift)}
                    disabled={togglingId === gift.id}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg transition text-sm ${
                      gift.is_purchased
                        ? 'bg-gray-500/20 text-gray-300 hover:bg-gray-500/30'
                        : 'bg-green-500/20 text-green-300 hover:bg-green-500/30'
                    }`}
                  >
                    {togglingId === gift.id ? (
                      <FaSpinner className="animate-spin" />
                    ) : gift.is_purchased ? (
                      <FaTimes />
                    ) : (
                      <FaShoppingCart />
                    )}
                    {gift.is_purchased ? 'Desmarcar' : 'Comprado'}
                  </button>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleOpenModal(gift)}
                      className="p-2 text-blue-400 hover:bg-blue-400/20 rounded-lg transition"
                      title="Editar"
                    >
                      <FaEdit />
                    </button>
                    <button
                      onClick={() => handleDelete(gift.id)}
                      disabled={deletingId === gift.id}
                      className="p-2 text-red-400 hover:bg-red-400/20 rounded-lg transition disabled:opacity-50"
                      title="Eliminar"
                    >
                      {deletingId === gift.id ? (
                        <FaSpinner className="animate-spin" />
                      ) : (
                        <FaTrash />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Stats */}
        {gifts.length > 0 && (
          <div className="mt-8 text-center text-white/60">
            <p>
              Total: {gifts.length} ideia{gifts.length !== 1 ? 's' : ''} de presente
              {' • '}
              {gifts.filter((g) => g.is_purchased).length} comprado{gifts.filter((g) => g.is_purchased).length !== 1 ? 's' : ''}
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
                {editingGift ? 'Editar Presente' : 'Nova Ideia de Presente'}
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
              {/* Friend Select */}
              <div>
                <label htmlFor="friend_id" className="block text-sm font-medium text-gray-700 mb-1">
                  Para quem? *
                </label>
                <select
                  id="friend_id"
                  name="friend_id"
                  value={formData.friend_id}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition"
                  required
                >
                  <option value="">Seleciona um amigo</option>
                  {friends.map((friend) => (
                    <option key={friend.id} value={friend.id}>
                      {friend.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Title */}
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                  Nome do Presente *
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="Ex: Livro de receitas"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  Descrição
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Detalhes sobre o presente..."
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition resize-none"
                />
              </div>

              {/* Price Range & Priority */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="price_range" className="block text-sm font-medium text-gray-700 mb-1">
                    Preço
                  </label>
                  <select
                    id="price_range"
                    name="price_range"
                    value={formData.price_range}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition"
                  >
                    <option value="">Não definido</option>
                    <option value="low">€ (até 15€)</option>
                    <option value="medium">€€ (15-30€)</option>
                    <option value="high">€€€ (30-50€)</option>
                    <option value="luxury">€€€€ (50€+)</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">
                    Prioridade
                  </label>
                  <select
                    id="priority"
                    name="priority"
                    value={formData.priority}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition"
                  >
                    <option value="low">Baixa</option>
                    <option value="medium">Média</option>
                    <option value="high">Alta</option>
                  </select>
                </div>
              </div>

              {/* URL */}
              <div>
                <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-1">
                  Link do produto
                </label>
                <input
                  type="url"
                  id="url"
                  name="url"
                  value={formData.url}
                  onChange={handleChange}
                  placeholder="https://..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition"
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
                  ) : editingGift ? (
                    'Guardar Alterações'
                  ) : (
                    'Adicionar Presente'
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
