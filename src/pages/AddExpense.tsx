import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Type, BookOpen, Loader2 } from 'lucide-react'
import EditorialCard from '../components/ui/EditorialCard'
import PremiumButton from '../components/ui/PremiumButton'
import PremiumSelect from '../components/ui/PremiumSelect'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

const AddExpense: React.FC = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { coupleId } = useAuth()
  
  const [amount, setAmount] = useState('')
  const [title, setTitle] = useState('')
  const [planId, setPlanId] = useState('')
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(false)
  const [existingPlans, setExistingPlans] = useState<{value: string, label: string}[]>([])

  const isEditMode = !!id;

  React.useEffect(() => {
    const fetchInitialData = async () => {
      if (!coupleId) return;
      setFetching(true);
      
      // 1. Fetch Plans for high-quality select
      const { data: plans } = await supabase
        .from('plans')
        .select('id, title, plan_date')
        .eq('couple_id', coupleId)
        .order('plan_date', { ascending: true });

      if (plans) {
        setExistingPlans(plans.map(p => ({
          value: p.id,
          label: `${p.title} (${new Date(p.plan_date).toLocaleDateString()})`
        })));
      }

      // 2. Fetch Transaction if editing
      if (id) {
        const { data: trx } = await supabase
          .from('transactions')
          .select('*')
          .eq('id', id)
          .single();
        
        if (trx) {
          setAmount(trx.amount.toString());
          setTitle(trx.description);
          setPlanId(trx.plan_id || '');
        }
      }
      setFetching(false);
    }
    fetchInitialData()
  }, [coupleId, id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!coupleId) return;
    setLoading(true);

    try {
      const trxData = {
        couple_id: coupleId,
        plan_id: planId || null,
        amount: parseFloat(amount),
        type: 'gasto',
        description: title,
      };

      if (isEditMode) {
        const { error } = await supabase
          .from('transactions')
          .update(trxData)
          .eq('id', id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('transactions')
          .insert(trxData);
        if (error) throw error;
      }

      navigate('/finances');
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  }

  if (fetching) {
    return <div className="min-h-[50vh] flex items-center justify-center"><Loader2 className="animate-spin text-primary" size={32} /></div>
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8 pb-24"
    >
      <header className="flex items-center gap-4">
        <button 
          onClick={() => navigate('/finances')}
          className="p-3 bg-white rounded-full text-on-surface/60 hover:text-primary shadow-sm transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-on-surface">
            {isEditMode ? 'Pulir Gasto' : 'Registrar Gasto'}
          </h1>
          <p className="text-on-surface/50 text-sm font-medium">
            {isEditMode ? 'Ajusta los detalles de este movimiento.' : 'Mantén nuestro presupuesto en línea.'}
          </p>
        </div>
      </header>

      <EditorialCard className="p-8">
        <form className="space-y-8" onSubmit={handleSubmit}>
          
          <div className="space-y-6">
            
            {/* Amount Input */}
            <div className="relative flex flex-col items-center justify-center p-6 bg-surface rounded-2xl border border-outline-variant/30">
              <span className="text-on-surface/40 font-bold mb-2 uppercase tracking-widest text-xs">Monto</span>
              <div className="relative flex items-center justify-center">
                <span className="text-4xl text-on-surface/40 font-bold absolute -left-8 top-1/2 -translate-y-1/2">$</span>
                <input 
                  type="number" 
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  step="0.01"
                  className="w-full max-w-[200px] bg-transparent text-center focus:outline-none text-5xl font-extrabold text-on-surface placeholder:text-on-surface/20 hide-arrows"
                  required
                />
              </div>
            </div>

            {/* Title / Description */}
            <div className="relative">
              <Type className="absolute left-0 top-1/2 -translate-y-1/2 text-on-surface/30" size={18} />
              <input 
                type="text" 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="¿Para qué fue?"
                className="w-full bg-transparent border-b border-outline-variant/30 py-3 pl-8 focus:outline-none focus:border-secondary transition-colors text-lg font-bold placeholder:font-normal placeholder:text-on-surface/30"
                required
              />
            </div>

            {/* Plan Selector */}
            <div className="relative z-10 pt-2">
              <p className="text-xs font-bold text-on-surface/40 uppercase tracking-widest mb-3 pl-1">Asociar a un Plan</p>
              <PremiumSelect 
                options={existingPlans}
                value={planId}
                onChange={setPlanId}
                icon={<BookOpen size={18} />}
                placeholder="Selecciona un plan..."
              />
            </div>
            
          </div>

          <PremiumButton type="submit" variant="secondary" className="w-full" disabled={loading}>
            {loading ? 'Guardando...' : (isEditMode ? 'Actualizar Gasto' : 'Guardar Gasto')}
          </PremiumButton>
        </form>
      </EditorialCard>

    </motion.div>
  )
}

export default AddExpense
