import React, { useState, useEffect } from 'react'
import EditorialCard from '../components/ui/EditorialCard'
import { motion } from 'framer-motion'
import { useNavigate, useLocation } from 'react-router-dom'
import { TrendingUp, ArrowUpRight, ArrowDownRight, Activity, Loader2, Trash2, Pencil } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import type { TransactionType } from '../lib/supabase'
import CustomModal from '../components/ui/CustomModal'

const Finances: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { coupleId } = useAuth()
  
  const [transactions, setTransactions] = useState<TransactionType[]>([])
  const [balance, setBalance] = useState(0)
  const [loading, setLoading] = useState(true)

  // UI States
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [targetTrx, setTargetTrx] = useState<{id: string, amount: number, type: 'ingreso' | 'gasto'} | null>(null)

  const confirmDelete = async () => {
    if (!targetTrx) return;
    
    try {
      const { error } = await supabase.from('transactions').delete().eq('id', targetTrx.id);
      if (error) throw error;
      
      setTransactions(prev => prev.filter(t => t.id !== targetTrx.id));
      setBalance(prev => targetTrx.type === 'ingreso' ? prev - Number(targetTrx.amount) : prev + Number(targetTrx.amount));
    } catch (e: any) {
      console.error(e);
      alert('Error al eliminar movimiento: ' + e.message + '. Revisa las políticas RLS en Supabase.');
    }
  }

  const handleDeleteTransaction = (id: string, amount: number, type: 'ingreso' | 'gasto') => {
    setTargetTrx({ id, amount, type });
    setIsDeleteModalOpen(true);
  }

  useEffect(() => {
    const fetchFinances = async () => {
      if (!coupleId) return;

      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('couple_id', coupleId)
        .order('created_at', { ascending: false });

      if (data) {
        setTransactions(data as TransactionType[]);
        
        const netBudget = data.reduce((acc, curr) => {
          return curr.type === 'ingreso' ? acc + Number(curr.amount) : acc - Number(curr.amount);
        }, 0);
        setBalance(netBudget);
      }
      setLoading(false);
    }
    fetchFinances()
  }, [coupleId, location.key])

  if (loading) {
    return <div className="min-h-[50vh] flex items-center justify-center"><Loader2 className="animate-spin text-primary" size={32} /></div>
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-12 pb-20"
    >
      <header className="space-y-3">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-on-surface leading-tight">
          Crecimiento Compartido
        </h1>
        <p className="text-xl text-on-surface/50 font-medium">
          Administrando nuestros sueños, una inversión a la vez.
        </p>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <EditorialCard className="md:col-span-2 bg-surface-low border-none flex flex-col justify-between p-10 space-y-10">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-secondary block mb-2">Balance Actual</span>
              <div className="flex items-center flex-wrap gap-4">
                <div className="text-5xl font-extrabold text-on-surface tracking-tight">
                  {balance.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}
                </div>
                <div className="px-3 py-1.5 bg-green-500/10 text-green-600 rounded-full flex items-center gap-1 text-sm font-bold shadow-sm">
                  <TrendingUp size={16} /> Activo
                </div>
              </div>
            </div>
          </div>
        </EditorialCard>

        <div className="flex flex-col gap-6">
          <EditorialCard 
            className="bg-primary hover:bg-primary-container transition-colors text-white border-none p-6 flex flex-col flex-1 justify-between shadow-[0_8px_30px_rgba(241,119,32,0.25)] cursor-pointer active:scale-95 duration-300"
            onClick={() => navigate('/finances/income/new')}
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <ArrowUpRight size={20} />
              </div>
              <h4 className="text-xl font-bold">Nuevo Ingreso</h4>
            </div>
            <p className="text-white/80 text-sm mt-3 font-medium">Agrega fondos a la cuenta.</p>
          </EditorialCard>

          <EditorialCard 
            className="bg-surface hover:bg-surface-low transition-colors border border-outline-variant/30 p-6 flex flex-col flex-1 justify-between shadow-sm cursor-pointer active:scale-95 duration-300" 
            onClick={() => navigate('/finances/expense/new')}
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-secondary/10 text-secondary rounded-full flex items-center justify-center">
                <ArrowDownRight size={20} />
              </div>
              <h4 className="text-xl font-bold text-on-surface">Registrar Gasto</h4>
            </div>
            <p className="text-on-surface/50 text-sm mt-3 font-medium">Agrega un nuevo pago.</p>
          </EditorialCard>
        </div>
      </section>

      <section className="space-y-6">
        <div className="flex justify-between items-center px-2">
          <h3 className="text-2xl font-bold">Movimientos Recientes</h3>
          <span className="text-sm font-medium text-primary cursor-pointer hover:underline">Ver todos</span>
        </div>
        
        <div className="space-y-3">
          {transactions.map((t, i) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <EditorialCard className="p-6 flex justify-between items-center border-none shadow-sm hover:shadow-md transition-shadow group relative overflow-hidden">
                <div className="flex items-center gap-5 overflow-hidden">
                  <div className={`shrink-0 w-12 h-12 rounded-2xl bg-surface-low flex items-center justify-center ${t.type === 'ingreso' ? 'text-green-500' : 'text-primary'}`}>
                    <Activity size={22} />
                  </div>
                  <div className="truncate">
                    <h5 className="font-bold text-on-surface truncate">{t.description || "Transacción"}</h5>
                    <p className="text-xs font-medium text-on-surface/40 uppercase tracking-wider">{t.category || t.type}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <p className={`font-bold ${t.type === 'ingreso' ? 'text-green-500' : 'text-on-surface'}`}>
                      {t.type === 'ingreso' ? '+' : '-'} {t.amount.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}
                    </p>
                    <p className="text-[10px] font-bold text-on-surface/30">
                      {new Date(t.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all duration-300">
                    <button 
                      onClick={() => navigate(`/finances/${t.type === 'ingreso' ? 'income' : 'expense'}/edit/${t.id}`)}
                      className="p-2 text-primary bg-primary/10 rounded-full hover:bg-primary hover:text-white transition-colors"
                    >
                      <Pencil size={14} />
                    </button>
                    <button 
                      onClick={() => handleDeleteTransaction(t.id, t.amount, t.type)}
                      className="p-2 text-red-500 bg-red-500/10 rounded-full hover:bg-red-500 hover:text-white transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </EditorialCard>
            </motion.div>
          ))}
          {transactions.length === 0 && (
             <div className="text-center py-12 text-on-surface/50 font-medium">No se encontraron movimientos.</div>
          )}
        </div>
      </section>

      <CustomModal 
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="¿Eliminar Movimiento?"
        description="Esta acción ajustará tu balance de forma permanente."
        confirmText="Sí, eliminar"
        variant="danger"
      />
    </motion.div>
  )
}

export default Finances
