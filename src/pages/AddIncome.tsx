import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Type, Loader2 } from 'lucide-react'
import EditorialCard from '../components/ui/EditorialCard'
import PremiumButton from '../components/ui/PremiumButton'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

const AddIncome: React.FC = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { coupleId } = useAuth()
  
  const [amount, setAmount] = useState('')
  const [title, setTitle] = useState('')
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(false)

  const isEditMode = !!id;

  React.useEffect(() => {
    const fetchTrx = async () => {
      if (!id || !coupleId) return;
      setFetching(true);
      const { data } = await supabase
        .from('transactions')
        .select('*')
        .eq('id', id)
        .eq('couple_id', coupleId)
        .single();
      
      if (data) {
        setAmount(data.amount.toString());
        setTitle(data.description);
      }
      setFetching(false);
    }
    fetchTrx()
  }, [id, coupleId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!coupleId) return;
    setLoading(true);

    try {
      const trxData = {
        couple_id: coupleId,
        amount: parseFloat(amount),
        type: 'ingreso',
        description: title || 'Fondo',
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
            {isEditMode ? 'Pulir Ingreso' : 'Registrar Ingreso'}
          </h1>
          <p className="text-on-surface/50 text-sm font-medium">
            {isEditMode ? 'Ajusta los detalles de este aporte.' : 'Aumenta nuestro fondo compartido.'}
          </p>
        </div>
      </header>

      <EditorialCard className="p-8">
        <form className="space-y-8" onSubmit={handleSubmit}>
          <div className="space-y-6">
            {/* Amount Input */}
            <div className="relative flex flex-col items-center justify-center p-6 bg-surface rounded-2xl border border-outline-variant/30 shadow-sm">
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

            <div className="relative">
              <Type className="absolute left-0 top-1/2 -translate-y-1/2 text-on-surface/30" size={18} />
              <input 
                type="text" 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="¿De dónde viene este ingreso?"
                className="w-full bg-transparent border-b border-outline-variant/30 py-3 pl-8 focus:outline-none focus:border-primary transition-colors text-lg font-bold placeholder:font-normal placeholder:text-on-surface/30"
                required
              />
            </div>
          </div>

          <PremiumButton type="submit" className="w-full" disabled={loading}>
            {loading ? 'Guardando...' : (isEditMode ? 'Actualizar Ingreso' : 'Guardar Ingreso')}
          </PremiumButton>
        </form>
      </EditorialCard>

    </motion.div>
  )
}

export default AddIncome
