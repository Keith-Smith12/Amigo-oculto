'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  FaListAlt,
  FaPlus,
  FaEdit,
  FaTrash,
  FaArrowLeft,
  FaTimes,
  FaSpinner,
  FaExternalLinkAlt,
  FaEuroSign,
  FaStar,
  FaShare,
  FaCopy,
  FaCheck,
} from 'react-icons/fa';
import { supabase } from '@/lib/supabase';
import { Wishlist, Group, Priority } from '@/types/database';
import toast from 'react-hot-toast';

interface WishlistFormData {
  title: string;
  description: string;
  url: string;
  price: string;
  priority: Priority;
  group_id: string;
}

const initialFormData: WishlistFormData = {
  title: '',
  description: '',
  url: '',
  price: '',
  priority: 'medium',
  group_id: '',
};

const priorityLabels: Record<Priority, string> = {
  low: 'Gostava',
  medium: 'Queria muito',
  high: 'Preciso!',
};

const priorityColors: Record<Priority, string> = {
  low: 'bg-gray-500/20 text-gray-300 border-gray-500/30',
  medium: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  high: 'bg-red-500/20 text-red-300 border-red-500/30',
};

const priorityEmojis: Record<Priority, string> = {
  low: '😊',
  medium: '🤩',
  high: '🙏',
};

export default function WishlistPage() {
  const router = useRouter();
  const [wishlistItems, setWishlistItems] = useState<Wishlist[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<Wishlist | null>(null);
  const [formData, setFormData] = useState<WishlistFormData>(initialFormData);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [filterGroup, setFilterGroup] = useState<string>('');

  useEffect(() => {
    checkAuthAndLoadData();
  }, []);

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
        loadWishlist(session.user.id),
        loadGroups(session.user.id),
      ]);
    } catch (error) {
      console.error('Error checking auth:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const loadWishlist = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('wishlists')
        .select('*')
        .eq('user_id', userId)
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setWishlistItems(data || []);
    } catch (error) {
      console.error('Error loading wishlist:', error);
      toast.error('Erro ao carregar lista de desejos');
    }
  };

  const loadGroups = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('groups')
        .select('*')
        .eq('owner_id', userId)
        .order('name', { ascending: true });

      if (error) throw error;
      setGroups(data || []);
    } catch (error) {
      console.error('Error loading groups:', error);
    }
  };

  const handleOpenModal = (item?: Wishlist) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        title: item.title,
        description: item.description || '',
        url: item.url || '',
        price: item.price?.toString() || '',
        priority: item.priority,
        group_id: item.group_id || '',
      });
    } else {
      setEditingItem(null);
      setFormData(initialFormData);
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingItem(null);
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

      const itemData = {
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        url: formData.url.trim() || null,
        price: formData.price ? parseFloat(formData.price) : null,
        priority: formData.priority,
        group_id: formData.group_id || null,
      };

      if (editingItem) {
        const { error } = await supabase
          .from('wishlists')
          .update({
            ...itemData,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingItem.id)
          .eq('user_id', session.user.id);

        if (error) throw error;
        toast.success('Item atualizado!');
      } else {
        const { error } = await supabase.from('wishlists').insert({
          ...itemData,
          user_id: session.user.id,
        });

        if (error) throw error;
        toast.success('Item adicionado à tua lista!');
      }

      handleCloseModal();
      await loadWishlist(session.user.id);
    } catch (error) {
      console.error('Error saving item:', error);
      toast.error('Erro ao guardar item');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (itemId: string) => {
    if (!confirm('Tens a certeza que queres eliminar este item?')) {
      return;
    }

    setDeletingId(itemId);

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
        .from('wishlists')
        .delete()
        .eq('id', itemId)
        .eq('user_id', session.user.id);

      if (error) throw error;

      toast.success('Item eliminado');
      await loadWishlist(session.user.id);
    } catch (error) {
      console.error('Error deleting item:', error);
      toast.error('Erro ao eliminar item');
    } finally {
      setDeletingId(null);
    }
  };

  const handleCopyLink = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        const shareUrl = `${window.location.origin}/wishlist/public/${session.user.id}`;
        await navigator.clipboard.writeText(shareUrl);
        setCopiedLink(true);
        toast.success('Link copiado!');
        setTimeout(() => setCopiedLink(false), 2000);
      }
    } catch (error) {
      toast.error('Erro ao copiar link');
    }
  };

  const filteredItems = filterGroup
    ? wishlistItems.filter((item) => item.group_id === filterGroup)
    : wishlistItems;

  const getGroupName = (groupId: string | null) => {
    if (!groupId) return null;
    const group = groups.find((g) => g.id === groupId);
    return group?.name || null;
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
              <FaListAlt className="w-6 h-6 text-yellow-400" />
              <h1 className="text-xl font-bold text-white">A Minha Lista de Desejos</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyLink}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition"
              title="Partilhar lista"
            >
              {copiedLink ? <FaCheck /> : <FaShare />}
              <span className="hidden sm:inline">{copiedLink ? 'Copiado!' : 'Partilhar'}</span>
            </button>
            <button
              onClick={() => handleOpenModal()}
              className="flex items-center gap-2 px-4 py-2 bg-yellow-500 hover:bg-yellow-400 text-gray-900 font-semibold rounded-lg transition transform hover:-translate-y-0.5"
            >
              <FaPlus />
              <span className="hidden sm:inline">Adicionar</span>
            </button>
          </div>
        </div>
      </header>

      {/* Filter */}
      {groups.length > 0 && (
        <div className="max-w-6xl mx-auto px-4 py-4">
          <select
            value={filterGroup}
            onChange={(e) => setFilterGroup(e.target.value)}
            className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-400 transition"
          >
            <option value="" className="text-gray-900">Todos os grupos</option>
            {groups.map((group) => (
              <option key={group.id} value={group.id} className="text-gray-900">
                {group.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {filteredItems.length === 0 ? (
          <div className="text-center py-16">
            <FaListAlt className="w-16 h-16 text-white/30 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">
              {wishlistItems.length === 0
                ? 'A tua lista de desejos está vazia'
                : 'Nenhum item neste grupo'}
            </h2>
            <p className="text-white/60 mb-6">
              Adiciona coisas que gostarias de receber
            </p>
            {wishlistItems.length === 0 && (
              <button
                onClick={() => handleOpenModal()}
                className="inline-flex items-center gap-2 px-6 py-3 bg-yellow-500 hover:bg-yellow-400 text-gray-900 font-semibold rounded-lg transition"
              >
                <FaPlus />
                Adicionar Primeiro Item
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className="bg-white/10 backdrop-blur-sm rounded-xl p-5 hover:bg-white/15 transition group"
              >
                {/* Priority Badge */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium border ${priorityColors[item.priority]}`}
                  >
                    {priorityEmojis[item.priority]} {priorityLabels[item.priority]}
                  </span>
                  {getGroupName(item.group_id) && (
                    <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-1 rounded-full">
                      {getGroupName(item.group_id)}
                    </span>
                  )}
                </div>

                {/* Item Info */}
                <h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>

                {item.description && (
                  <p className="text-white/60 text-sm mb-3 line-clamp-2">{item.description}</p>
                )}

                {/* Price */}
                {item.price && (
                  <div className="flex items-center gap-1 text-green-300 mb-3">
                    <FaEuroSign />
                    <span className="font-semibold">{item.price.toFixed(2)}</span>
                  </div>
                )}

                {/* Link */}
                {item.url && (
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-blue-300 hover:text-blue-200 text-sm mb-3 transition"
                  >
                    <FaExternalLinkAlt className="w-3 h-3" />
                    Ver produto
                  </a>
                )}

                {/* Actions */}
                <div className="flex items-center justify-end gap-2 pt-4 border-t border-white/10">
                  <button
                    onClick={() => handleOpenModal(item)}
                    className="p-2 text-blue-400 hover:bg-blue-400/20 rounded-lg transition"
                    title="Editar"
                  >
                    <FaEdit />
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    disabled={deletingId === item.id}
                    className="p-2 text-red-400 hover:bg-red-400/20 rounded-lg transition disabled:opacity-50"
                    title="Eliminar"
                  >
                    {deletingId === item.id ? (
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
        {wishlistItems.length > 0 && (
          <div className="mt-8 text-center text-white/60">
            <p>
              {wishlistItems.length} item{wishlistItems.length !== 1 ? 's' : ''} na tua lista
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
                {editingItem ? 'Editar Item' : 'Adicionar à Lista'}
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
              {/* Title */}
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                  O que queres? *
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="Ex: Airpods Pro"
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
                  placeholder="Mais detalhes (cor, tamanho, modelo...)"
                  rows={2}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition resize-none"
                />
              </div>

              {/* Price & Priority */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
                    Preço (€)
                  </label>
                  <input
                    type="number"
                    id="price"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    placeholder="29.99"
                    min="0"
                    step="0.01"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition"
                  />
                </div>
                <div>
                  <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">
                    Quanto queres?
                  </label>
                  <select
                    id="priority"
                    name="priority"
                    value={formData.priority}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition"
                  >
                    <option value="low">😊 Gostava</option>
                    <option value="medium">🤩 Queria muito</option>
                    <option value="high">🙏 Preciso!</option>
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

              {/* Group */}
              {groups.length > 0 && (
                <div>
                  <label htmlFor="group_id" className="block text-sm font-medium text-gray-700 mb-1">
                    Associar a um grupo (opcional)
                  </label>
                  <select
                    id="group_id"
                    name="group_id"
                    value={formData.group_id}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition"
                  >
                    <option value="">Nenhum grupo específico</option>
                    {groups.map((group) => (
                      <option key={group.id} value={group.id}>
                        {group.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

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
                  ) : editingItem ? (
                    'Guardar Alterações'
                  ) : (
                    'Adicionar à Lista'
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
