import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import EditorialCard from '../components/ui/EditorialCard'
import PremiumButton from '../components/ui/PremiumButton'
import { motion } from 'framer-motion'
import { Calendar, MapPin, ArrowRight, Clock, Heart, Loader2 } from 'lucide-react'
import { getPlanThemeImage } from '../lib/themeUtils'
import { calculateTimeTogether, calculateCountdown } from '../lib/dateUtils'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import type { PlanType } from '../lib/supabase'

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { coupleId, profile } = useAuth();

  // Use anniversary date from profile, fall back to a sensible default
  const ANNIVERSARY_DATE = profile?.anniversary_date
    ? profile.anniversary_date + 'T00:00:00'
    : '2024-10-15T00:00:00';

  const [timeTogether, setTimeTogether] = useState(calculateTimeTogether(ANNIVERSARY_DATE));
  const [nextPlan, setNextPlan] = useState<PlanType | null>(null);
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [budgetStatus, setBudgetStatus] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!coupleId) return;

      // Fetch Next Plan
      const { data: plans, error: planError } = await supabase
        .from('plans')
        .select(`
          *,
          memories (
            image_url
          )
        `)
        .eq('couple_id', coupleId)
        .eq('status', 'pendiente')
        .gte('plan_date', new Date().toISOString())
        .order('plan_date', { ascending: true })
        .limit(1);

      if (planError) {
        console.error("Supabase Plan Error:", planError);
        setFetchError(`Error loading plans: ${planError.message || planError.details}`);
      }

      if (plans && plans.length > 0) {
        setNextPlan(plans[0] as PlanType);
        setCountdown(calculateCountdown(plans[0].plan_date));
      }

      // Fetch Budget Status (Ingresos - Gastos)
      const { data: transactions, error: transError } = await supabase
        .from('transactions')
        .select('amount, type')
        .eq('couple_id', coupleId);

      if (transError) {
         console.error("Supabase Transactions Error:", transError);
         if (!fetchError) setFetchError(`Error loading budget: ${transError.message || transError.details}`);
      }

      if (transactions) {
        const netBudget = transactions.reduce((acc, curr) => {
          return curr.type === 'ingreso' ? acc + Number(curr.amount) : acc - Number(curr.amount);
        }, 0);
        setBudgetStatus(netBudget);
      }

      setLoading(false);
    };

    fetchData();

    const timer = setInterval(() => {
      setTimeTogether(calculateTimeTogether(ANNIVERSARY_DATE));
      if (nextPlan) {
        setCountdown(calculateCountdown(nextPlan.plan_date));
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [nextPlan?.plan_date, coupleId]);

  if (loading) {
    return <div className="min-h-[50vh] flex items-center justify-center"><Loader2 className="animate-spin text-primary" size={32} /></div>
  }

  if (fetchError) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center p-6 text-center space-y-4">
        <div className="p-4 bg-red-500/10 text-red-500 rounded-2xl w-full max-w-lg shadow-sm border border-red-500/20">
          <h2 className="font-bold text-lg mb-2">Supabase Connection Error</h2>
          <p className="text-sm font-medium">{fetchError}</p>
          <p className="text-xs text-red-500/70 mt-4">(Did you run the RLS policies in SQL?)</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="space-y-12 pb-24"
    >
      <header className="space-y-4">
        <div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-on-surface leading-tight drop-shadow-sm">
            La Próxima Aventura
          </h1>
          <p className="text-xl text-on-surface/50 font-medium mt-2">
            Nuestros mejores capítulos apenas comienzan.
          </p>
        </div>

        {/* Time Together Counter */}
        <div className="flex items-center gap-3 px-5 py-3 bg-primary/5 rounded-2xl border border-primary/10 w-fit hover:scale-105 hover:shadow-lg transition-all duration-300 cursor-default">
          <Heart className="text-primary fill-primary/20 animate-pulse" size={20} />
          <div className="flex gap-2 text-sm font-bold text-on-surface/80">
            <span>{timeTogether.years} <span className="text-xs font-medium text-on-surface/50">AÑOS</span></span>
            <span>{timeTogether.months} <span className="text-xs font-medium text-on-surface/50">MESES</span></span>
            <span>{timeTogether.days} <span className="text-xs font-medium text-on-surface/50">DÍAS</span></span>
          </div>
        </div>
      </header>

      <section>
        {nextPlan ? (
          <EditorialCard elevated className="relative overflow-hidden group min-h-[500px] p-0 border-none transition-all duration-700 hover:shadow-2xl hover:shadow-primary/20">
            {/* Background Image Container */}
            <div className="absolute inset-0 z-0">
               <img 
                src={(nextPlan as any).memories?.[0]?.image_url || getPlanThemeImage(nextPlan.type)} 
                alt={nextPlan.title} 
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[2000ms]"
               />
               <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/20" />
            </div>

            <div className="relative z-10 p-10 flex flex-col justify-between h-full min-h-[500px] text-white">
              <div className="flex justify-between items-start">
                <div className="flex flex-col gap-2">
                  <span className="px-4 py-1.5 w-fit bg-white/20 backdrop-blur-md rounded-full text-[10px] font-bold uppercase tracking-widest leading-none">
                    Próxima Aventura En
                  </span>
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-black/30 backdrop-blur-md rounded-lg text-sm font-black tracking-wider shadow-inner">
                    <Clock size={14} className="text-primary-fixed mr-1" />
                    <span>{countdown.days}d</span>:<span>{countdown.hours}h</span>:<span>{countdown.minutes}m</span>:<span className="text-primary-fixed">{countdown.seconds}s</span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center">
                  <Calendar className="w-5 h-5" />
                </div>
              </div>

              <div className="space-y-4">
                <h2 className="text-4xl md:text-5xl font-extrabold leading-tight tracking-tight drop-shadow-lg break-words hyphens-auto w-full max-w-[95%]">
                  {nextPlan.title}
                </h2>
                <div className="flex flex-wrap gap-4 items-center">
                  <div className="flex items-center gap-2 text-sm font-semibold bg-white/10 backdrop-blur px-4 py-2 rounded-full shadow-sm hover:bg-white/20 transition-colors">
                    <span className="uppercase tracking-wider">{nextPlan.type}</span>
                  </div>
                  <span className="text-white/60 font-medium tracking-wide">
                    {new Date(nextPlan.plan_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>
                <p className="max-w-md text-white/80 font-medium leading-relaxed">
                  {nextPlan.description || "Prepárate para crear nuevas memorias juntos."}
                </p>

                <PremiumButton onClick={() => navigate('/plans')} variant="ghost" className="!bg-white !text-primary !shadow-none mt-4 group">
                  <span className="flex items-center gap-2">
                    Ver planes <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                  </span>
                </PremiumButton>
              </div>
            </div>
          </EditorialCard>
        ) : (
          <EditorialCard className="flex flex-col items-center justify-center p-12 text-center bg-surface border border-dashed border-outline-variant/40 min-h-[300px]">
             <div className="w-16 h-16 bg-surface-lowest shadow-sm rounded-full flex items-center justify-center text-primary/40 mb-4">
               <MapPin size={24} />
             </div>
             <h3 className="text-2xl font-bold text-on-surface">Sin planes próximos</h3>
             <p className="text-on-surface/50 font-medium mt-2 mb-6">¡Es hora de programar su próxima aventura!</p>
             <PremiumButton onClick={() => navigate('/plans/new')} variant="primary">
               Crear Plan
             </PremiumButton>
          </EditorialCard>
        )}
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <EditorialCard elevated className="bg-secondary-container/10 border-none p-8 flex flex-col justify-between items-start space-y-8 hover:shadow-xl hover:shadow-secondary/10 hover:bg-secondary-container/20 transition-all duration-500">
          <div className="space-y-2">
            <h3 className="text-2xl font-bold text-secondary">Estado Financiero</h3>
            <p className="text-on-surface/60 font-medium text-lg mt-1">Tenemos <span className="font-bold text-on-surface">{budgetStatus.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}</span> disponibles.</p>
          </div>
          <PremiumButton onClick={() => navigate('/finances')} variant="secondary" className="px-6 py-2.5 text-sm">
            Ir a Finanzas
          </PremiumButton>
        </EditorialCard>

        <EditorialCard elevated className="bg-primary-container/10 border-none p-8 flex flex-col justify-between items-start space-y-8 hover:shadow-xl hover:shadow-primary/10 hover:bg-primary-container/20 transition-all duration-500">
          <div className="space-y-2">
            <h3 className="text-2xl font-bold text-primary">Nuestras Memorias</h3>
            <p className="text-on-surface/60 font-medium">Revive nuestros mejores momentos juntos.</p>
          </div>
          <PremiumButton onClick={() => navigate('/gallery')} variant="primary" className="px-6 py-2.5 text-sm">
            Ir a Galería
          </PremiumButton>
        </EditorialCard>
      </section>
    </motion.div>
  )
}

export default Dashboard
