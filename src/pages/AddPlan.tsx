import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, MapPin, Type, Hash, Calendar as CalendarIcon, Loader2 } from 'lucide-react'
import EditorialCard from '../components/ui/EditorialCard'
import PremiumButton from '../components/ui/PremiumButton'
import PremiumSelect from '../components/ui/PremiumSelect'
import PremiumDatePicker from '../components/ui/PremiumDatePicker'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

const AddPlan: React.FC = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { coupleId } = useAuth()

  const [title, setTitle] = useState('')
  const [place, setPlace] = useState('')
  const [notes, setNotes] = useState('')
  const [date, setDate] = useState('')
  const [category, setCategory] = useState('')
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(false)

  const isEditMode = !!id;

  React.useEffect(() => {
    const fetchPlanData = async () => {
      if (!id || !coupleId) return;
      setFetching(true);
      const { data, error } = await supabase
        .from('plans')
        .select('*')
        .eq('id', id)
        .eq('couple_id', coupleId)
        .single();
      
      if (data) {
        setTitle(data.title);
        // Format to YYYY-MM-DD for the date picker
        const formattedDate = data.plan_date ? data.plan_date.split('T')[0] : '';
        setDate(formattedDate);
        setCategory(data.type);
        
        // Simple heuristic to split place and notes
        if (data.description) {
          const parts = data.description.split(' - ');
          if (parts.length > 1) {
            setPlace(parts[0]);
            setNotes(parts.slice(1).join(' - '));
          } else {
            setPlace(data.description);
          }
        }
      }
      setFetching(false);
    }
    if (isEditMode) fetchPlanData();
  }, [id, coupleId, isEditMode])

  const categoryOptions = [
    { value: "viaje", label: "Viaje" },
    { value: "cena", label: "Cena" },
    { value: "salida", label: "Salida / Adventure" },
    { value: "cine", label: "Cine" },
    { value: "otro", label: "Otro" },
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!coupleId) return;
    setLoading(true);

    try {
      const dbDate = date ? new Date(date + 'T12:00:00').toISOString() : new Date().toISOString();
      const combinedNotes = notes ? `${place} - ${notes}` : place;

      if (isEditMode) {
        const { data, error } = await supabase
          .from('plans')
          .update({
            title: title,
            plan_date: dbDate,
            type: category || 'otro',
            description: combinedNotes,
          })
          .eq('id', id)
          .select();
        
        console.log('[AddPlan Update] data:', data, 'error:', error);
        if (error) throw error;
        if (!data || data.length === 0) {
          throw new Error('No se actualizó ningún registro. Verifica las políticas RLS en Supabase.');
        }
        navigate(`/plans/${id}`);
      } else {
        const { error } = await supabase
          .from('plans')
          .insert({
            couple_id: coupleId,
            title: title,
            plan_date: dbDate,
            type: category || 'otro',
            description: combinedNotes,
            status: 'pendiente'
          });
        if (error) throw error;
        navigate('/plans');
      }
    } catch (e: any) {
      console.error('[AddPlan Error]', e);
      alert('Error al guardar: ' + (e.message || JSON.stringify(e)));
      setLoading(false);
    }
  }

  if (fetching) {
    return <div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="animate-spin text-primary" size={32} /></div>
  }

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="space-y-8 pb-24"
    >
      <header className="flex items-center gap-4">
        <button 
          onClick={() => navigate('/plans')}
          className="p-3 bg-surface-low rounded-full text-on-surface/60 hover:text-primary transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-on-surface">
            {isEditMode ? 'Pulir el Camino' : 'Trazar un Camino'}
          </h1>
          <p className="text-on-surface/50 text-sm">
            {isEditMode ? 'Ajusta los detalles de nuestra aventura.' : 'Añade un nuevo capítulo a nuestra historia.'}
          </p>
        </div>
      </header>

      <EditorialCard className="p-8 border-none">
        <form className="space-y-8" onSubmit={handleSubmit}>
          
          <div className="space-y-6">
            <div className="relative">
              <Type className="absolute left-0 top-1/2 -translate-y-1/2 text-on-surface/30" size={18} />
              <input 
                type="text" 
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="¿Cuál es el plan?"
                className="w-full bg-transparent border-b border-outline-variant/30 py-3 pl-8 focus:outline-none focus:border-primary transition-colors text-xl font-bold placeholder:font-normal placeholder:text-on-surface/30"
                required
              />
            </div>

            <div className="relative">
              <MapPin className="absolute left-0 top-1/2 -translate-y-1/2 text-on-surface/30" size={18} />
              <input 
                type="text" 
                value={place}
                onChange={e => setPlace(e.target.value)}
                placeholder="¿Dónde será?"
                className="w-full bg-transparent border-b border-outline-variant/30 py-3 pl-8 focus:outline-none focus:border-primary transition-colors text-on-surface/80 font-medium placeholder:text-on-surface/30"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 z-10 relative">
              <PremiumDatePicker 
                value={date} 
                onChange={setDate} 
                icon={<CalendarIcon size={18} />}
              />
              <PremiumSelect 
                options={categoryOptions} 
                value={category} 
                onChange={setCategory} 
                icon={<Hash size={18} />} 
              />
            </div>

            <div className="pt-2">
              <textarea 
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="¿Alguna nota especial o pensamiento?..."
                className="w-full bg-surface-low rounded-xl border border-outline-variant/15 p-4 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all resize-none min-h-[120px] text-sm text-on-surface/80"
              />
            </div>
          </div>

          <PremiumButton type="submit" disabled={loading} className="w-full">
            {loading ? (isEditMode ? 'Actualizando...' : 'Plantando...') : (isEditMode ? 'Guardar Cambios' : 'Guardar Plan')}
          </PremiumButton>
        </form>
      </EditorialCard>

    </motion.div>
  )
}

export default AddPlan
