import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, UploadCloud, BookOpen } from 'lucide-react'
import EditorialCard from '../components/ui/EditorialCard'
import PremiumButton from '../components/ui/PremiumButton'
import PremiumSelect from '../components/ui/PremiumSelect'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

const AddMemory: React.FC = () => {
  const navigate = useNavigate()
  const { coupleId } = useAuth()
  
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [caption, setCaption] = useState('')
  const [planId, setPlanId] = useState('')
  const [loading, setLoading] = useState(false)
  const [uploadStatus, setUploadStatus] = useState('')
  
  const [existingPlans, setExistingPlans] = useState<{value: string, label: string}[]>([])

  React.useEffect(() => {
    const fetchPlans = async () => {
      if (!coupleId) return;
      const { data } = await supabase
        .from('plans')
        .select('id, title')
        .eq('couple_id', coupleId);

      if (data) {
        setExistingPlans(data.map(p => ({
          value: p.id,
          label: p.title
        })))
      }
    }
    fetchPlans()
  }, [coupleId])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      const url = URL.createObjectURL(selectedFile);
      setPreview(url);
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!coupleId || !file) return;
    setLoading(true);
    setUploadStatus('Subiendo imagen...');

    try {
      // 1. Generate unique file name
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${coupleId}/${fileName}`;

      // 2. Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('Fotos')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // 3. Get Public URL
      const { data: { publicUrl } } = supabase.storage
        .from('Fotos')
        .getPublicUrl(filePath);

      setUploadStatus('Guardando en la base de datos...');

      // 4. Insert into memories table
      const { error: insertError } = await supabase.from('memories').insert({
        couple_id: coupleId,
        plan_id: planId || null,
        image_url: publicUrl,
        caption: caption
      });

      if (insertError) throw insertError;
      navigate('/gallery');
    } catch (e: any) {
      console.error(e);
      alert(`Error al subir: ${e.message || 'Error desconocido'}`);
    } finally {
      setLoading(false);
      setUploadStatus('');
    }
  }

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="space-y-8 pb-24"
    >
      <header className="flex items-center gap-4">
        <button 
          onClick={() => navigate('/gallery')}
          className="p-3 bg-surface-low rounded-full text-on-surface/60 hover:text-primary transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-on-surface">Guardar Memoria</h1>
          <p className="text-on-surface/50 text-sm">Agrega una nueva foto a la bóveda.</p>
        </div>
      </header>

      <EditorialCard className="p-8 border-none">
        <form className="space-y-8" onSubmit={handleSubmit}>
          
          <div className="space-y-6 z-10 relative">
            {/* Real File Upload UX */}
            <div 
              className={`
                relative h-64 rounded-3xl border-2 border-dashed transition-all duration-500 flex flex-col items-center justify-center overflow-hidden
                ${preview ? 'border-primary/50' : 'border-outline-variant/30 hover:border-primary/50 bg-surface-low'}
              `}
              onClick={() => document.getElementById('file-input')?.click()}
            >
              <input 
                id="file-input"
                type="file" 
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              
              {preview ? (
                <div className="absolute inset-0 w-full h-full group">
                  <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <p className="text-white font-bold text-sm">Cambiar Foto</p>
                  </div>
                </div>
              ) : (
                <div className="text-center space-y-3 p-6 pointer-events-none">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto text-primary">
                    <UploadCloud size={32} />
                  </div>
                  <div className="space-y-1">
                    <p className="font-bold text-on-surface">Seleccionar Foto</p>
                    <p className="text-xs text-on-surface/40">Haz clic para buscar en tu dispositivo</p>
                  </div>
                </div>
              )}
            </div>

            <div className="relative">
              <input 
                type="text" 
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Escribe un pequeño caption..."
                className="w-full bg-transparent border-b border-outline-variant/30 py-3 focus:outline-none focus:border-primary transition-colors text-sm font-medium placeholder:text-on-surface/30 px-1"
              />
            </div>
          </div>

          <div className="space-y-6 z-10 relative">
            <PremiumSelect 
              options={existingPlans}
              value={planId}
              onChange={setPlanId}
              icon={<BookOpen size={18} />}
              placeholder="Selecciona el plan al que pertenece..."
            />
          </div>

          <PremiumButton type="submit" disabled={loading || !file} className="w-full">
            {loading ? (uploadStatus || 'Procesando...') : 'Guardar en la Bóveda'}
          </PremiumButton>
        </form>
      </EditorialCard>

    </motion.div>
  )
}

export default AddMemory
