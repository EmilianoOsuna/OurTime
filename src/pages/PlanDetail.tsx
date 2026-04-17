import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { ArrowLeft, Calendar, Clock, Loader2, DollarSign, Camera, Trash2, Maximize2, Pencil } from 'lucide-react'
import EditorialCard from '../components/ui/EditorialCard'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { getPlanThemeImage } from '../lib/themeUtils'
import CustomModal from '../components/ui/CustomModal'
import ActionSheet from '../components/ui/ActionSheet'
import ImageLightbox from '../components/ui/ImageLightbox'

const PlanDetail: React.FC = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { coupleId } = useAuth()
  
  const [plan, setPlan] = useState<any>(null)
  const [expenses, setExpenses] = useState<any[]>([])
  const [memories, setMemories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // UI States
  const [selectedPhoto, setSelectedPhoto] = useState<any | null>(null)
  const [actionMemory, setActionMemory] = useState<any | null>(null)
  const [isMemorySheetOpen, setIsMemorySheetOpen] = useState(false)
  
  const [isDeletePlanModalOpen, setIsDeletePlanModalOpen] = useState(false)
  const [isDeleteMemoryModalOpen, setIsDeleteMemoryModalOpen] = useState(false)
  const [isDeleteExpenseModalOpen, setIsDeleteExpenseModalOpen] = useState(false)
  const [targetExpenseId, setTargetExpenseId] = useState<string | null>(null)

  const confirmDeleteExpense = async () => {
    if (!targetExpenseId) return;
    try {
      const { error } = await supabase.from('transactions').delete().eq('id', targetExpenseId);
      if (error) throw error;
      setExpenses(prev => prev.filter(e => e.id !== targetExpenseId));
    } catch (e: any) { 
      console.error(e);
      alert('Error al borrar gasto: ' + e.message);
    }
  }

  const confirmDeleteMemory = async () => {
    if (!actionMemory) return;
    try {
      const urlParts = actionMemory.image_url.split('/Fotos/');
      if (urlParts.length > 1) {
        await supabase.storage.from('Fotos').remove([urlParts[1]]);
      }
      const { error } = await supabase.from('memories').delete().eq('id', actionMemory.id);
      if (error) throw error;

      setMemories(prev => prev.filter(m => m.id !== actionMemory.id));
      setSelectedPhoto(null);
      setActionMemory(null);
    } catch (e: any) { 
      console.error(e);
      alert('Error al borrar memoria: ' + e.message);
    }
  }

  const confirmDeletePlan = async () => {
    setLoading(true);
    try {
      for (const m of memories) {
        const urlParts = m.image_url.split('/Fotos/');
        if (urlParts.length > 1) {
          await supabase.storage.from('Fotos').remove([urlParts[1]]);
        }
      }
      const { error: err1 } = await supabase.from('memories').delete().eq('plan_id', id);
      if (err1) throw err1;
      
      const { error: err2 } = await supabase.from('transactions').delete().eq('plan_id', id);
      if (err2) throw err2;

      const { error: err3 } = await supabase.from('plans').delete().eq('id', id);
      if (err3) throw err3;

      navigate('/plans');
    } catch (e: any) {
      console.error(e);
      alert('Error al borrar plan completo: ' + e.message + '. Asegúrate de las políticas SQL en Supabase.');
      setLoading(false);
    }
  }

  const handleDeleteExpense = (trashId: string) => {
    setTargetExpenseId(trashId);
    setIsDeleteExpenseModalOpen(true);
  }

  const handleDeleteMemory = (memory: any) => {
    setActionMemory(memory);
    setIsDeleteMemoryModalOpen(true);
  }

  const handleDeletePlan = () => {
    setIsDeletePlanModalOpen(true);
  }

  useEffect(() => {
    const fetchPlanDetails = async () => {
      if (!coupleId || !id) return;

      // 1. Fetch Plan Data
      const { data: planData } = await supabase
        .from('plans')
        .select('*')
        .eq('id', id)
        .eq('couple_id', coupleId)
        .single();
      
      if (planData) setPlan(planData);

      // 2. Fetch Transactions assigned to this plan
      const { data: trxData } = await supabase
        .from('transactions')
        .select('*')
        .eq('plan_id', id)
        .eq('type', 'gasto');
      
      if (trxData) setExpenses(trxData);

      // 3. Fetch Memories assigned to this plan
      const { data: memData } = await supabase
        .from('memories')
        .select('*')
        .eq('plan_id', id);

      if (memData) setMemories(memData);

      setLoading(false);
    }
    fetchPlanDetails()
  }, [coupleId, id, location.key])

  if (loading) {
    return <div className="min-h-[60vh] flex items-center justify-center"><Loader2 className="animate-spin text-primary" size={32} /></div>
  }

  if (!plan) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-4">
        <h2 className="text-xl font-bold">Plan no encontrado</h2>
        <button onClick={() => navigate('/plans')} className="text-primary hover:underline">Regresar</button>
      </div>
    )
  }

  const totalSpent = expenses.reduce((acc, curr) => acc + Number(curr.amount), 0);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-10 pb-24"
    >
      <header className="relative -mx-6 -mt-6 rounded-b-[3rem] overflow-hidden min-h-[400px] flex flex-col justify-between p-8 text-white">
        {/* Background Visual */}
        <div className="absolute inset-0 z-0">
          <img 
            src={memories?.[0]?.image_url || getPlanThemeImage(plan.type)} 
            alt={plan.title} 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        </div>

        <div className="relative z-10 space-y-6 flex flex-col h-full justify-between">
          <div className="flex justify-between items-center">
            <button 
              onClick={() => navigate('/plans')}
              className="p-3 bg-black/20 backdrop-blur-md rounded-full text-white hover:bg-white hover:text-on-surface shadow-sm transition-all"
            >
              <ArrowLeft size={20} />
            </button>
            
            <div className="flex gap-2">
              <button 
                onClick={() => navigate(`/plans/edit/${id}`)}
                className="p-3 bg-white/20 backdrop-blur-md text-white rounded-full hover:bg-white hover:text-primary transition-all duration-300"
                title="Editar Plan"
              >
                <Pencil size={20} />
              </button>
              <button 
                onClick={handleDeletePlan}
                className="p-3 bg-red-500/20 backdrop-blur-md text-white rounded-full hover:bg-red-500 transition-all duration-300"
                title="Eliminar Plan"
              >
                <Trash2 size={20} />
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <div>
              <span className="px-3 py-1 bg-white/20 backdrop-blur-md text-white font-bold uppercase tracking-widest text-[10px] rounded-full mb-3 inline-block">
                {plan.status === 'completado' ? 'Completado' : 'Próximo'} • {plan.type}
              </span>
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight leading-tight break-words hyphens-auto drop-shadow-lg">
                {plan.title}
              </h1>
              <p className="text-xl text-white/80 mt-2 font-medium max-w-lg drop-shadow-md">
                {plan.description}
              </p>
            </div>

            <div className="flex flex-wrap gap-4 pt-2">
              <div className="flex items-center gap-2 bg-black/20 backdrop-blur-md px-4 py-2 rounded-xl text-sm font-bold text-white">
                <Calendar size={16} className="text-primary" />
                {new Date(plan.plan_date).toLocaleDateString('es-ES', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
              </div>
              {plan.status === 'pendiente' && (
                <div className="flex items-center gap-2 bg-black/20 backdrop-blur-md px-4 py-2 rounded-xl text-sm font-bold text-white">
                  <Clock size={16} className="text-secondary" />
                  Esperando la cita
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Plan Economy */}
      <section className="space-y-4">
        <h3 className="font-bold text-lg text-on-surface/40 uppercase tracking-widest px-2">Impacto Financiero</h3>
        <EditorialCard className="bg-surface-low border-none p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <p className="text-sm font-bold text-on-surface/50">Total Invertido en este Plan</p>
            <p className="text-4xl font-extrabold text-on-surface">
               {totalSpent.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}
            </p>
          </div>
          <div>
             <button onClick={() => navigate('/finances/expense/new')} className="flex items-center gap-2 text-primary font-bold hover:bg-primary/5 px-4 py-2 rounded-full transition-colors duration-300">
               <DollarSign size={16} /> Añadir gasto
             </button>
          </div>
        </EditorialCard>

        {/* Local Expenses list */}
        {expenses.length > 0 && (
          <div className="pl-4 border-l-2 border-outline-variant/30 space-y-3 mt-6">
            {expenses.map(e => (
              <div key={e.id} className="flex justify-between items-center bg-surface p-4 rounded-2xl shadow-sm group">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all duration-300">
                    <button 
                      onClick={() => navigate(`/finances/expense/edit/${e.id}`)}
                      className="p-2 text-primary bg-primary/10 rounded-full hover:bg-primary hover:text-white transition-colors"
                    >
                      <Pencil size={14} />
                    </button>
                    <button 
                      onClick={() => handleDeleteExpense(e.id)}
                      className="p-2 text-red-500 bg-red-500/10 rounded-full hover:bg-red-500 hover:text-white transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <div>
                    <p className="font-bold text-sm text-on-surface">{e.description || 'Gasto General'}</p>
                    <p className="text-xs font-semibold text-on-surface/40">{new Date(e.created_at).toLocaleDateString('es-ES')}</p>
                  </div>
                </div>
                <div className="font-extrabold text-on-surface">
                  -{e.amount.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Memories Grid with Lightbox & ActionSheet */}
      <section className="space-y-4 pt-4">
        <h3 className="font-bold text-lg text-on-surface/40 uppercase tracking-widest px-2">Memorias del Tiempo</h3>
        {memories.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {memories.map((m) => (
              <div 
                key={m.id} 
                className="aspect-square bg-surface rounded-2xl overflow-hidden shadow-sm relative group cursor-pointer"
                onClick={() => setSelectedPhoto(m)}
              >
                <img src={m.image_url} alt={m.caption} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                   <p className="text-white text-xs font-bold truncate">{m.caption}</p>
              </div>
            ))}
          </div>
        ) : (
          <EditorialCard className="bg-transparent border border-dashed border-outline-variant/40 flex flex-col items-center justify-center p-10 text-center">
             <Camera className="text-on-surface/20 mb-3" size={32} />
             <p className="font-bold text-on-surface/50">Aún no hay fotos de este plan.</p>
             <button onClick={() => navigate('/gallery/new')} className="mt-4 text-sm font-bold text-primary hover:underline">
               Sube una ahora
             </button>
          </EditorialCard>
        )}
      </section>

      {/* Overlay Components */}
      <ImageLightbox 
        isOpen={!!selectedPhoto}
        onClose={() => setSelectedPhoto(null)}
        imageUrl={selectedPhoto?.image_url || ''}
        caption={selectedPhoto?.caption}
        onDelete={() => handleDeleteMemory(selectedPhoto)}
      />

      <ActionSheet 
        isOpen={isMemorySheetOpen}
        onClose={() => setIsMemorySheetOpen(false)}
        title="Opciones de Memoria"
        options={[
          { label: 'Ampliar', icon: <Maximize2 size={18} />, onClick: () => setSelectedPhoto(actionMemory) },
          { label: 'Borrar Foto', icon: <Trash2 size={18} />, variant: 'danger', onClick: () => setIsDeleteMemoryModalOpen(true) }
        ]}
      />

      <CustomModal 
        isOpen={isDeletePlanModalOpen}
        onClose={() => setIsDeletePlanModalOpen(false)}
        onConfirm={confirmDeletePlan}
        title="¿Borrar este Plan?"
        description={`Se eliminarán todos los gastos y fotos asociados a "${plan.title}". Esta acción es definitiva.`}
        confirmText="Sí, borrar todo"
        variant="danger"
      />

      <CustomModal 
        isOpen={isDeleteMemoryModalOpen}
        onClose={() => setIsDeleteMemoryModalOpen(false)}
        onConfirm={confirmDeleteMemory}
        title="¿Borrar Foto?"
        description="Esta foto se eliminará de la bóveda para siempre."
        confirmText="Borrar Foto"
        variant="danger"
      />

      <CustomModal 
        isOpen={isDeleteExpenseModalOpen}
        onClose={() => setIsDeleteExpenseModalOpen(false)}
        onConfirm={confirmDeleteExpense}
        title="¿Eliminar Gasto?"
        description="Este movimiento se ajustará de tu presupuesto total."
        confirmText="Eliminar"
        variant="danger"
      />

    </motion.div>
  )
}

export default PlanDetail
