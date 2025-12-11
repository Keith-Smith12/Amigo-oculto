'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  FaUsers,
  FaPlus,
  FaEdit,
  FaTrash,
  FaRandom,
  FaCalendarAlt,
  FaEuroSign,
  FaArrowLeft,
  FaTimes,
  FaSpinner,
  FaUserPlus,
  FaCheck,
  FaCrown,
  FaGift,
  FaEye,
} from 'react-icons/fa';
import { supabase } from '@/lib/supabase';
import { Group, GroupMember, Friend } from '@/types/database';
import toast from 'react-hot-toast';

interface GroupWithMembers extends Group {
  members: GroupMember[];
}

interface GroupFormData {
  name: string;
  description: string;
  budget_min: string;
  budget_max: string;
  draw_date: string;
  exchange_date: string;
}

const initialFormData: GroupFormData = {
  name: '',
  description: '',
  budget_min: '',
  budget_max: '',
  draw_date: '',
  exchange_date: '',
};

export default function GruposPage() {
  const router = useRouter();
  const [groups, setGroups] = useState<GroupWithMembers[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<GroupWithMembers | null>(null);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [formData, setFormData] = useState<GroupFormData>(initialFormData);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [addingMember, setAddingMember] = useState(false);
  const [drawingGroup, setDrawingGroup] = useState<string | null>(null);

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
        loadGroups(session.user.id),
        loadFriends(session.user.id),
      ]);
    } catch (error) {
      console.error('Error checking auth:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const loadGroups = async (userId: string) => {
    try {
      const { data: groupsData, error: groupsError } = await supabase
        .from('groups')
        .select('*')
        .eq('owner_id', userId)
        .order('created_at', { ascending: false });

      if (groupsError) throw groupsError;

      // Load members for each group
      const groupsWithMembers: GroupWithMembers[] = await Promise.all(
        (groupsData || []).map(async (group) => {
          const { data: members } = await supabase
            .from('group_members')
            .select('*')
            .eq('group_id', group.id);

          return {
            ...group,
            members: members || [],
          };
        })
      );

      setGroups(groupsWithMembers);
    } catch (error) {
      console.error('Error loading groups:', error);
      toast.error('Erro ao carregar grupos');
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

  const handleOpenModal = (group?: Group) => {
    if (group) {
      setEditingGroup(group);
      setFormData({
        name: group.name,
        description: group.description || '',
        budget_min: group.budget_min?.toString() || '',
        budget_max: group.budget_max?.toString() || '',
        draw_date: group.draw_date || '',
        exchange_date: group.exchange_date || '',
      });
    } else {
      setEditingGroup(null);
      setFormData(initialFormData);
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingGroup(null);
    setFormData(initialFormData);
  };

  const handleOpenMembersModal = (group: GroupWithMembers) => {
    setSelectedGroup(group);
    setShowMembersModal(true);
  };

  const handleCloseMembersModal = () => {
    setShowMembersModal(false);
    setSelectedGroup(null);
    setNewMemberName('');
    setNewMemberEmail('');
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
      toast.error('O nome do grupo é obrigatório');
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

      const groupData = {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        budget_min: formData.budget_min ? parseFloat(formData.budget_min) : null,
        budget_max: formData.budget_max ? parseFloat(formData.budget_max) : null,
        draw_date: formData.draw_date || null,
        exchange_date: formData.exchange_date || null,
      };

      if (editingGroup) {
        const { error } = await supabase
          .from('groups')
          .update({
            ...groupData,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingGroup.id)
          .eq('owner_id', session.user.id);

        if (error) throw error;
        toast.success('Grupo atualizado com sucesso!');
      } else {
        const { error } = await supabase.from('groups').insert({
          ...groupData,
          owner_id: session.user.id,
        });

        if (error) throw error;
        toast.success('Grupo criado com sucesso!');
      }

      handleCloseModal();
      await loadGroups(session.user.id);
    } catch (error) {
      console.error('Error saving group:', error);
      toast.error('Erro ao guardar grupo');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (groupId: string) => {
    if (!confirm('Tens a certeza que queres eliminar este grupo? Esta ação não pode ser desfeita.')) {
      return;
    }

    setDeletingId(groupId);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        toast.error('Sessão expirada');
        router.push('/login');
        return;
      }

      // Delete members first
      await supabase
        .from('group_members')
        .delete()
        .eq('group_id', groupId);

      // Delete draw results
      await supabase
        .from('draw_results')
        .delete()
        .eq('group_id', groupId);

      // Delete group
      const { error } = await supabase
        .from('groups')
        .delete()
        .eq('id', groupId)
        .eq('owner_id', session.user.id);

      if (error) throw error;

      toast.success('Grupo eliminado');
      await loadGroups(session.user.id);
    } catch (error) {
      console.error('Error deleting group:', error);
      toast.error('Erro ao eliminar grupo');
    } finally {
      setDeletingId(null);
    }
  };

  const handleAddMember = async () => {
    if (!selectedGroup) return;
    if (!newMemberName.trim()) {
      toast.error('O nome é obrigatório');
      return;
    }

    setAddingMember(true);

    try {
      const { error } = await supabase.from('group_members').insert({
        group_id: selectedGroup.id,
        name: newMemberName.trim(),
        email: newMemberEmail.trim() || null,
      });

      if (error) throw error;

      toast.success('Participante adicionado!');
      setNewMemberName('');
      setNewMemberEmail('');

      // Reload group members
      const { data: members } = await supabase
        .from('group_members')
        .select('*')
        .eq('group_id', selectedGroup.id);

      setSelectedGroup({ ...selectedGroup, members: members || [] });

      // Also update the groups list
      setGroups((prev) =>
        prev.map((g) =>
          g.id === selectedGroup.id ? { ...g, members: members || [] } : g
        )
      );
    } catch (error) {
      console.error('Error adding member:', error);
      toast.error('Erro ao adicionar participante');
    } finally {
      setAddingMember(false);
    }
  };

  const handleAddFriendAsMember = async (friend: Friend) => {
    if (!selectedGroup) return;

    // Check if friend is already a member
    if (selectedGroup.members.some((m) => m.friend_id === friend.id)) {
      toast.error('Este amigo já está no grupo');
      return;
    }

    setAddingMember(true);

    try {
      const { error } = await supabase.from('group_members').insert({
        group_id: selectedGroup.id,
        friend_id: friend.id,
        name: friend.name,
        email: friend.email || null,
      });

      if (error) throw error;

      toast.success(`${friend.name} adicionado ao grupo!`);

      // Reload group members
      const { data: members } = await supabase
        .from('group_members')
        .select('*')
        .eq('group_id', selectedGroup.id);

      setSelectedGroup({ ...selectedGroup, members: members || [] });

      setGroups((prev) =>
        prev.map((g) =>
          g.id === selectedGroup.id ? { ...g, members: members || [] } : g
        )
      );
    } catch (error) {
      console.error('Error adding friend as member:', error);
      toast.error('Erro ao adicionar amigo');
    } finally {
      setAddingMember(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!selectedGroup) return;

    try {
      const { error } = await supabase
        .from('group_members')
        .delete()
        .eq('id', memberId);

      if (error) throw error;

      toast.success('Participante removido');

      // Update local state
      const updatedMembers = selectedGroup.members.filter((m) => m.id !== memberId);
      setSelectedGroup({ ...selectedGroup, members: updatedMembers });

      setGroups((prev) =>
        prev.map((g) =>
          g.id === selectedGroup.id ? { ...g, members: updatedMembers } : g
        )
      );
    } catch (error) {
      console.error('Error removing member:', error);
      toast.error('Erro ao remover participante');
    }
  };

  const handleDraw = async (group: GroupWithMembers) => {
    if (group.members.length < 3) {
      toast.error('O grupo precisa de pelo menos 3 participantes para o sorteio');
      return;
    }

    if (group.is_drawn) {
      if (!confirm('O sorteio já foi realizado. Queres fazer um novo sorteio?')) {
        return;
      }
    }

    setDrawingGroup(group.id);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        toast.error('Sessão expirada');
        router.push('/login');
        return;
      }

      // Shuffle members
      const shuffled = [...group.members].sort(() => Math.random() - 0.5);

      // Delete existing draw results
      await supabase.from('draw_results').delete().eq('group_id', group.id);

      // Create assignments (each person gives to the next in shuffled list)
      const drawResults = shuffled.map((member, index) => ({
        group_id: group.id,
        giver_id: member.id,
        receiver_id: shuffled[(index + 1) % shuffled.length].id,
      }));

      const { error: drawError } = await supabase
        .from('draw_results')
        .insert(drawResults);

      if (drawError) throw drawError;

      // Update group as drawn
      const { error: updateError } = await supabase
        .from('groups')
        .update({ is_drawn: true, updated_at: new Date().toISOString() })
        .eq('id', group.id);

      if (updateError) throw updateError;

      toast.success('🎉 Sorteio realizado com sucesso!');
      await loadGroups(session.user.id);
    } catch (error) {
      console.error('Error performing draw:', error);
      toast.error('Erro ao realizar o sorteio');
    } finally {
      setDrawingGroup(null);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString('pt-PT', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatBudget = (min: number | null, max: number | null) => {
    if (!min && !max) return null;
    if (min && max) return `${min}€ - ${max}€`;
    if (min) return `Mín: ${min}€`;
    return `Máx: ${max}€`;
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
              <FaUsers className="w-6 h-6 text-yellow-400" />
              <h1 className="text-xl font-bold text-white">Os Meus Grupos</h1>
            </div>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 px-4 py-2 bg-yellow-500 hover:bg-yellow-400 text-gray-900 font-semibold rounded-lg transition transform hover:-translate-y-0.5"
          >
            <FaPlus />
            <span className="hidden sm:inline">Criar Grupo</span>
          </button>
        </div>
      </header>

      {/* Groups Grid */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {groups.length === 0 ? (
          <div className="text-center py-16">
            <FaUsers className="w-16 h-16 text-white/30 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">
              Ainda não tens grupos
            </h2>
            <p className="text-white/60 mb-6">
              Cria um grupo para organizar o teu amigo oculto
            </p>
            <button
              onClick={() => handleOpenModal()}
              className="inline-flex items-center gap-2 px-6 py-3 bg-yellow-500 hover:bg-yellow-400 text-gray-900 font-semibold rounded-lg transition"
            >
              <FaPlus />
              Criar Primeiro Grupo
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {groups.map((group) => (
              <div
                key={group.id}
                className="bg-white/10 backdrop-blur-sm rounded-xl overflow-hidden hover:bg-white/15 transition"
              >
                {/* Card Header */}
                <div className="p-5 pb-0">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        {group.name}
                        {group.is_drawn && (
                          <span className="text-xs bg-green-500/30 text-green-300 px-2 py-0.5 rounded-full">
                            Sorteado
                          </span>
                        )}
                      </h3>
                      {group.description && (
                        <p className="text-white/60 text-sm mt-1 line-clamp-2">
                          {group.description}
                        </p>
                      )}
                    </div>
                    <FaCrown className="text-yellow-400 flex-shrink-0" title="Tu és o organizador" />
                  </div>

                  {/* Stats */}
                  <div className="flex flex-wrap gap-3 text-sm text-white/70">
                    <span className="flex items-center gap-1">
                      <FaUsers />
                      {group.members.length} participante{group.members.length !== 1 ? 's' : ''}
                    </span>
                    {formatBudget(group.budget_min, group.budget_max) && (
                      <span className="flex items-center gap-1">
                        <FaEuroSign />
                        {formatBudget(group.budget_min, group.budget_max)}
                      </span>
                    )}
                    {group.exchange_date && (
                      <span className="flex items-center gap-1">
                        <FaCalendarAlt />
                        {formatDate(group.exchange_date)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="p-5 pt-4 mt-4 border-t border-white/10">
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => handleOpenMembersModal(group)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded-lg transition text-sm"
                    >
                      <FaUserPlus />
                      Participantes
                    </button>
                    <button
                      onClick={() => handleDraw(group)}
                      disabled={drawingGroup === group.id || group.members.length < 3}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 rounded-lg transition text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      title={group.members.length < 3 ? 'Mínimo 3 participantes' : ''}
                    >
                      {drawingGroup === group.id ? (
                        <FaSpinner className="animate-spin" />
                      ) : (
                        <FaRandom />
                      )}
                      Sortear
                    </button>
                  </div>
                  <div className="flex gap-2 mt-2">
                    {group.is_drawn && (
                      <Link
                        href={`/sorteio?group=${group.id}`}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-300 rounded-lg transition text-sm"
                      >
                        <FaEye />
                        Ver Resultado
                      </Link>
                    )}
                    <button
                      onClick={() => handleOpenModal(group)}
                      className="flex items-center justify-center p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition"
                    >
                      <FaEdit />
                    </button>
                    <button
                      onClick={() => handleDelete(group.id)}
                      disabled={deletingId === group.id}
                      className="flex items-center justify-center p-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg transition disabled:opacity-50"
                    >
                      {deletingId === group.id ? (
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
      </div>

      {/* Create/Edit Group Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900">
                {editingGroup ? 'Editar Grupo' : 'Criar Grupo'}
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
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Nome do Grupo *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Ex: Natal da Família"
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
                  placeholder="Descrição opcional do evento..."
                  rows={2}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition resize-none"
                />
              </div>

              {/* Budget */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="budget_min" className="block text-sm font-medium text-gray-700 mb-1">
                    Orçamento Mín (€)
                  </label>
                  <input
                    type="number"
                    id="budget_min"
                    name="budget_min"
                    value={formData.budget_min}
                    onChange={handleChange}
                    placeholder="10"
                    min="0"
                    step="0.01"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition"
                  />
                </div>
                <div>
                  <label htmlFor="budget_max" className="block text-sm font-medium text-gray-700 mb-1">
                    Orçamento Máx (€)
                  </label>
                  <input
                    type="number"
                    id="budget_max"
                    name="budget_max"
                    value={formData.budget_max}
                    onChange={handleChange}
                    placeholder="30"
                    min="0"
                    step="0.01"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition"
                  />
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="draw_date" className="block text-sm font-medium text-gray-700 mb-1">
                    Data do Sorteio
                  </label>
                  <input
                    type="date"
                    id="draw_date"
                    name="draw_date"
                    value={formData.draw_date}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition"
                  />
                </div>
                <div>
                  <label htmlFor="exchange_date" className="block text-sm font-medium text-gray-700 mb-1">
                    Data da Troca
                  </label>
                  <input
                    type="date"
                    id="exchange_date"
                    name="exchange_date"
                    value={formData.exchange_date}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition"
                  />
                </div>
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
                  ) : editingGroup ? (
                    'Guardar Alterações'
                  ) : (
                    'Criar Grupo'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Members Modal */}
      {showMembersModal && selectedGroup && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Participantes</h2>
                <p className="text-sm text-gray-500">{selectedGroup.name}</p>
              </div>
              <button
                onClick={handleCloseMembersModal}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition"
              >
                <FaTimes />
              </button>
            </div>

            {/* Add Member Form */}
            <div className="p-6 border-b bg-gray-50">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Adicionar Participante</h3>
              <div className="space-y-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newMemberName}
                    onChange={(e) => setNewMemberName(e.target.value)}
                    placeholder="Nome"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition text-sm"
                  />
                  <input
                    type="email"
                    value={newMemberEmail}
                    onChange={(e) => setNewMemberEmail(e.target.value)}
                    placeholder="Email (opcional)"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition text-sm"
                  />
                  <button
                    onClick={handleAddMember}
                    disabled={addingMember || !newMemberName.trim()}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition disabled:opacity-50 flex items-center gap-2"
                  >
                    {addingMember ? <FaSpinner className="animate-spin" /> : <FaPlus />}
                  </button>
                </div>

                {/* Add from friends */}
                {friends.length > 0 && (
                  <div>
                    <p className="text-xs text-gray-500 mb-2">Ou adiciona dos teus amigos:</p>
                    <div className="flex flex-wrap gap-2">
                      {friends
                        .filter((f) => !selectedGroup.members.some((m) => m.friend_id === f.id))
                        .slice(0, 5)
                        .map((friend) => (
                          <button
                            key={friend.id}
                            onClick={() => handleAddFriendAsMember(friend)}
                            disabled={addingMember}
                            className="px-3 py-1 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-full text-sm transition disabled:opacity-50"
                          >
                            + {friend.name}
                          </button>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Members List */}
            <div className="p-6">
              {selectedGroup.members.length === 0 ? (
                <p className="text-center text-gray-500 py-8">
                  Ainda não há participantes neste grupo
                </p>
              ) : (
                <ul className="space-y-3">
                  {selectedGroup.members.map((member) => (
                    <li
                      key={member.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-gray-900">{member.name}</p>
                        {member.email && (
                          <p className="text-sm text-gray-500">{member.email}</p>
                        )}
                      </div>
                      <button
                        onClick={() => handleRemoveMember(member.id)}
                        className="p-2 text-red-500 hover:bg-red-100 rounded-lg transition"
                      >
                        <FaTrash className="w-4 h-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              {selectedGroup.members.length >= 3 && !selectedGroup.is_drawn && (
                <div className="mt-6 pt-6 border-t">
                  <button
                    onClick={() => {
                      handleCloseMembersModal();
                      handleDraw(selectedGroup);
                    }}
                    className="w-full py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold rounded-lg transition flex items-center justify-center gap-2"
                  >
                    <FaRandom />
                    Fazer Sorteio
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
