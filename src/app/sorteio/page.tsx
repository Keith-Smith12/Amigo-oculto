'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  FaRandom,
  FaArrowLeft,
  FaGift,
  FaEye,
  FaEyeSlash,
  FaUsers,
  FaSpinner,
  FaEnvelope,
  FaCalendarAlt,
  FaEuroSign,
  FaCrown,
  FaArrowRight,
  FaRedo,
} from 'react-icons/fa';
import { supabase } from '@/lib/supabase';
import { Group, GroupMember, DrawResult } from '@/types/database';
import toast from 'react-hot-toast';

interface GroupWithDetails extends Group {
  members: GroupMember[];
  draw_results: DrawResultWithNames[];
}

interface DrawResultWithNames extends DrawResult {
  giver_name: string;
  receiver_name: string;
}

export default function SorteioPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const groupIdParam = searchParams.get('group');

  const [groups, setGroups] = useState<GroupWithDetails[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<GroupWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [revealedResults, setRevealedResults] = useState<Set<string>>(new Set());
  const [drawingGroup, setDrawingGroup] = useState<string | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    checkAuthAndLoadData();
  }, []);

  useEffect(() => {
    if (groupIdParam && groups.length > 0) {
      const group = groups.find((g) => g.id === groupIdParam);
      if (group) {
        setSelectedGroup(group);
      }
    }
  }, [groupIdParam, groups]);

  const checkAuthAndLoadData = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.push('/login');
        return;
      }

      await loadGroups(session.user.id);
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

      // Load members and draw results for each group
      const groupsWithDetails: GroupWithDetails[] = await Promise.all(
        (groupsData || []).map(async (group) => {
          const { data: members } = await supabase
            .from('group_members')
            .select('*')
            .eq('group_id', group.id);

          const { data: drawResults } = await supabase
            .from('draw_results')
            .select('*')
            .eq('group_id', group.id);

          // Map draw results with names
          const drawResultsWithNames: DrawResultWithNames[] = (drawResults || []).map(
            (result) => {
              const giver = (members || []).find((m) => m.id === result.giver_id);
              const receiver = (members || []).find((m) => m.id === result.receiver_id);
              return {
                ...result,
                giver_name: giver?.name || 'Desconhecido',
                receiver_name: receiver?.name || 'Desconhecido',
              };
            }
          );

          return {
            ...group,
            members: members || [],
            draw_results: drawResultsWithNames,
          };
        })
      );

      setGroups(groupsWithDetails);
    } catch (error) {
      console.error('Error loading groups:', error);
      toast.error('Erro ao carregar grupos');
    }
  };

  const handleDraw = async (group: GroupWithDetails) => {
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

      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);

      toast.success('🎉 Sorteio realizado com sucesso!');
      await loadGroups(session.user.id);
    } catch (error) {
      console.error('Error performing draw:', error);
      toast.error('Erro ao realizar o sorteio');
    } finally {
      setDrawingGroup(null);
    }
  };

  const toggleReveal = (resultId: string) => {
    setRevealedResults((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(resultId)) {
        newSet.delete(resultId);
      } else {
        newSet.add(resultId);
      }
      return newSet;
    });
  };

  const revealAll = () => {
    if (selectedGroup) {
      const allIds = new Set(selectedGroup.draw_results.map((r) => r.id));
      setRevealedResults(allIds);
    }
  };

  const hideAll = () => {
    setRevealedResults(new Set());
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
    <main className="min-h-screen bg-gradient-to-br from-red-600 via-red-700 to-green-700 relative overflow-hidden">
      {/* Confetti Effect */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-bounce"
              style={{
                left: `${Math.random() * 100}%`,
                top: `-20px`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${2 + Math.random() * 2}s`,
              }}
            >
              {['🎁', '🎄', '⭐', '🎅', '❄️'][Math.floor(Math.random() * 5)]}
            </div>
          ))}
        </div>
      )}

      {/* Header */}
      <header className="bg-black/20 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href={selectedGroup ? '/sorteio' : '/'}
              onClick={(e) => {
                if (selectedGroup) {
                  e.preventDefault();
                  setSelectedGroup(null);
                  router.push('/sorteio');
                }
              }}
              className="text-white/80 hover:text-white transition flex items-center gap-2"
            >
              <FaArrowLeft />
              <span className="hidden sm:inline">
                {selectedGroup ? 'Voltar aos Grupos' : 'Voltar'}
              </span>
            </Link>
            <div className="flex items-center gap-2">
              <FaRandom className="w-6 h-6 text-yellow-400" />
              <h1 className="text-xl font-bold text-white">
                {selectedGroup ? selectedGroup.name : 'Sorteio'}
              </h1>
            </div>
          </div>
          {selectedGroup && selectedGroup.draw_results.length > 0 && (
            <div className="flex gap-2">
              <button
                onClick={revealAll}
                className="flex items-center gap-2 px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-300 rounded-lg transition text-sm"
              >
                <FaEye />
                <span className="hidden sm:inline">Mostrar Todos</span>
              </button>
              <button
                onClick={hideAll}
                className="flex items-center gap-2 px-4 py-2 bg-gray-500/20 hover:bg-gray-500/30 text-gray-300 rounded-lg transition text-sm"
              >
                <FaEyeSlash />
                <span className="hidden sm:inline">Esconder</span>
              </button>
            </div>
          )}
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {!selectedGroup ? (
          /* Groups List */
          <>
            {groups.length === 0 ? (
              <div className="text-center py-16">
                <FaUsers className="w-16 h-16 text-white/30 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-white mb-2">
                  Ainda não tens grupos
                </h2>
                <p className="text-white/60 mb-6">
                  Cria um grupo para fazer o sorteio do amigo oculto
                </p>
                <Link
                  href="/grupos"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-yellow-500 hover:bg-yellow-400 text-gray-900 font-semibold rounded-lg transition"
                >
                  <FaUsers />
                  Criar Grupo
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {groups.map((group) => (
                  <div
                    key={group.id}
                    className="bg-white/10 backdrop-blur-sm rounded-xl p-5 hover:bg-white/15 transition"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                          {group.name}
                          {group.is_drawn && (
                            <span className="text-xs bg-green-500/30 text-green-300 px-2 py-0.5 rounded-full">
                              ✓ Sorteado
                            </span>
                          )}
                        </h3>
                        {group.description && (
                          <p className="text-white/60 text-sm mt-1">{group.description}</p>
                        )}
                      </div>
                      <FaCrown className="text-yellow-400 flex-shrink-0" />
                    </div>

                    <div className="flex flex-wrap gap-3 text-sm text-white/70 mb-4">
                      <span className="flex items-center gap-1">
                        <FaUsers />
                        {group.members.length} participantes
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

                    <div className="flex gap-2">
                      {group.is_drawn ? (
                        <button
                          onClick={() => setSelectedGroup(group)}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-300 rounded-lg transition"
                        >
                          <FaEye />
                          Ver Resultado
                        </button>
                      ) : (
                        <button
                          onClick={() => handleDraw(group)}
                          disabled={drawingGroup === group.id || group.members.length < 3}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                          title={group.members.length < 3 ? 'Mínimo 3 participantes' : ''}
                        >
                          {drawingGroup === group.id ? (
                            <FaSpinner className="animate-spin" />
                          ) : (
                            <FaRandom />
                          )}
                          Fazer Sorteio
                        </button>
                      )}
                      {group.is_drawn && (
                        <button
                          onClick={() => handleDraw(group)}
                          disabled={drawingGroup === group.id}
                          className="flex items-center justify-center p-2 bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 rounded-lg transition"
                          title="Refazer sorteio"
                        >
                          {drawingGroup === group.id ? (
                            <FaSpinner className="animate-spin" />
                          ) : (
                            <FaRedo />
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          /* Draw Results View */
          <>
            {/* Group Info */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 mb-6">
              <div className="flex flex-wrap gap-4 text-white/80">
                <span className="flex items-center gap-2">
                  <FaUsers />
                  {selectedGroup.members.length} participantes
                </span>
                {formatBudget(selectedGroup.budget_min, selectedGroup.budget_max) && (
                  <span className="flex items-center gap-2">
                    <FaEuroSign />
                    Orçamento: {formatBudget(selectedGroup.budget_min, selectedGroup.budget_max)}
                  </span>
                )}
                {selectedGroup.exchange_date && (
                  <span className="flex items-center gap-2">
                    <FaCalendarAlt />
                    Troca: {formatDate(selectedGroup.exchange_date)}
                  </span>
                )}
              </div>
            </div>

            {selectedGroup.draw_results.length === 0 ? (
              <div className="text-center py-16">
                <FaRandom className="w-16 h-16 text-white/30 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-white mb-2">
                  Sorteio ainda não realizado
                </h2>
                <p className="text-white/60 mb-6">
                  {selectedGroup.members.length < 3
                    ? `Adiciona mais ${3 - selectedGroup.members.length} participante${3 - selectedGroup.members.length > 1 ? 's' : ''} para fazer o sorteio`
                    : 'Clica no botão abaixo para fazer o sorteio'}
                </p>
                <button
                  onClick={() => handleDraw(selectedGroup)}
                  disabled={drawingGroup === selectedGroup.id || selectedGroup.members.length < 3}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-yellow-500 hover:bg-yellow-400 text-gray-900 font-semibold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {drawingGroup === selectedGroup.id ? (
                    <>
                      <FaSpinner className="animate-spin" />
                      A sortear...
                    </>
                  ) : (
                    <>
                      <FaRandom />
                      Fazer Sorteio
                    </>
                  )}
                </button>
              </div>
            ) : (
              <>
                <h2 className="text-2xl font-bold text-white mb-6 text-center">
                  🎁 Resultados do Sorteio
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {selectedGroup.draw_results.map((result) => {
                    const isRevealed = revealedResults.has(result.id);
                    return (
                      <div
                        key={result.id}
                        className="bg-white/10 backdrop-blur-sm rounded-xl p-5 transition hover:bg-white/15"
                      >
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-green-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                            {result.giver_name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-white font-semibold">{result.giver_name}</p>
                            <p className="text-white/60 text-sm">vai dar presente a</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <FaArrowRight className="text-yellow-400" />
                          <div
                            className={`flex-1 p-3 rounded-lg transition-all duration-300 ${
                              isRevealed
                                ? 'bg-yellow-500/20 border border-yellow-500/30'
                                : 'bg-gray-500/20 border border-gray-500/30'
                            }`}
                          >
                            {isRevealed ? (
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-full flex items-center justify-center text-white font-bold">
                                  {result.receiver_name.charAt(0).toUpperCase()}
                                </div>
                                <span className="text-white font-semibold">
                                  {result.receiver_name}
                                </span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gray-500/50 rounded-full flex items-center justify-center">
                                  <FaGift className="text-gray-400" />
                                </div>
                                <span className="text-gray-400">??? Clica para revelar</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <button
                          onClick={() => toggleReveal(result.id)}
                          className={`w-full mt-4 py-2 rounded-lg transition flex items-center justify-center gap-2 text-sm ${
                            isRevealed
                              ? 'bg-gray-500/20 text-gray-300 hover:bg-gray-500/30'
                              : 'bg-yellow-500/20 text-yellow-300 hover:bg-yellow-500/30'
                          }`}
                        >
                          {isRevealed ? (
                            <>
                              <FaEyeSlash />
                              Esconder
                            </>
                          ) : (
                            <>
                              <FaEye />
                              Revelar
                            </>
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>

                {/* Re-draw button */}
                <div className="mt-8 text-center">
                  <button
                    onClick={() => handleDraw(selectedGroup)}
                    disabled={drawingGroup === selectedGroup.id}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 border border-orange-500/30 rounded-lg transition"
                  >
                    {drawingGroup === selectedGroup.id ? (
                      <>
                        <FaSpinner className="animate-spin" />
                        A sortear...
                      </>
                    ) : (
                      <>
                        <FaRedo />
                        Refazer Sorteio
                      </>
                    )}
                  </button>
                  <p className="text-white/50 text-sm mt-2">
                    Atenção: isto irá eliminar os resultados atuais
                  </p>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </main>
  );
}
