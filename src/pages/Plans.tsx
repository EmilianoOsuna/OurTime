import React, { useState, useEffect } from 'react'
import EditorialCard from '../components/ui/EditorialCard'
import PremiumButton from '../components/ui/PremiumButton'
import PremiumFilter from '../components/ui/PremiumFilter'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Plus, MapPin, Calendar, Loader2 } from 'lucide-react'
import { getPlanThemeImage } from '../lib/themeUtils'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import type { PlanType } from '../lib/supabase'

const Plans: React.FC = () => {
  const navigate = useNavigate()
  const { coupleId } = useAuth()
  const [plans, setPlans] = useState<PlanType[]>([])
  const [loading, setLoading] = useState(true)
  
  // Real DB Schema categories instead of mock
  const filterOptions = ['Todos', 'viaje', 'salida', 'cena', 'cine', 'otro']
  const [activeFilter, setActiveFilter] = useState('Todos')

  useEffect(() => {
    const fetchPlans = async () => {
      if (!coupleId) return;
      const { data, error } = await supabase
        .from('plans')
        .select(`
          *,
          memories (
            image_url
          )
        `)
        .eq('couple_id', coupleId)
        .order('plan_date', { ascending: true });
        
      if (data) setPlans(data as PlanType[]);
      setLoading(false);
    }
    fetchPlans()
  }, [coupleId])

  const displayedPlans = activeFilter === 'Todos' 
    ? plans 
    : plans.filter(p => p.type === activeFilter)

  if (loading) {
    return <div className="min-h-[50vh] flex items-center justify-center"><Loader2 className="animate-spin text-primary" size={32} /></div>
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-12 pb-20"
    >
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-3">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-on-surface leading-tight">
            Nuestras Crónicas
          </h1>
          <p className="text-xl text-on-surface/50 font-medium max-w-lg">
            Cada plan es una historia esperando ser contada.
          </p>
        </div>
        <PremiumButton onClick={() => navigate('/plans/new')} className="flex items-center gap-2">
          <Plus size={20} /> Nuevo Plan
        </PremiumButton>
      </header>

      {/* Filter Section inspired by Mi Garaje */}
      <div className="py-2">
        <PremiumFilter 
          options={filterOptions} 
          activeOption={activeFilter} 
          onChange={setActiveFilter} 
        />
      </div>

      <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        <AnimatePresence mode="popLayout">
          {displayedPlans.map((plan) => (
            <motion.div
              layout
              key={plan.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, filter: 'blur(5px)' }}
              transition={{ duration: 0.3 }}
            >
            <EditorialCard 
              onClick={() => navigate(`/plans/${plan.id}`)}
              className={`group cursor-pointer transition-all duration-500 overflow-hidden border-none p-0 ${plan.status === 'completado' ? 'opacity-80' : 'hover:shadow-2xl hover:shadow-primary/10'}`}
            >
              <div className="aspect-[4/3] bg-surface-highest relative overflow-hidden flex items-center justify-center">
                {/* Visual Background */}
                <div className="absolute inset-0">
                  <img 
                    src={(plan as any).memories?.[0]?.image_url || getPlanThemeImage(plan.type)} 
                    alt={plan.title} 
                    className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 ${plan.status === 'completado' ? 'grayscale' : ''}`}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                </div>

                <span className="relative z-10 text-white font-bold uppercase tracking-widest rotate-[-5deg] text-3xl drop-shadow-md opacity-40 group-hover:opacity-100 transition-opacity">
                  {plan.type}
                </span>

                <div className="absolute top-4 right-4 z-10">
                   <span className={`px-3 py-1 backdrop-blur-md rounded-full text-[10px] font-bold uppercase tracking-widest shadow-lg ${plan.status === 'completado' ? 'bg-black/40 text-white' : 'bg-primary text-white '}`}>
                    {plan.status}
                  </span>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <h3 className="text-2xl font-bold text-on-surface group-hover:text-primary transition-colors">
                  {plan.title}
                </h3>
                <div className="space-y-2 text-sm text-on-surface/50 font-medium whitespace-nowrap overflow-hidden text-ellipsis">
                  <div className="flex items-center gap-2">
                    <Calendar size={14} className="shrink-0" /> {new Date(plan.plan_date).toLocaleDateString('es-ES', { dateStyle: 'medium'})}
                  </div>
                  {plan.description && (
                    <div className="flex items-center gap-2">
                      <MapPin size={14} className="shrink-0" /> <span className="truncate">{plan.description}</span>
                    </div>
                  )}
                </div>
              </div>
            </EditorialCard>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  )
}

export default Plans
