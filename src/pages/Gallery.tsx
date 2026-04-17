import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Filter, Search, Camera, Loader2, Image as ImageIcon, MoreVertical, Trash2, Maximize2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import CustomModal from '../components/ui/CustomModal'
import ActionSheet from '../components/ui/ActionSheet'
import ImageLightbox from '../components/ui/ImageLightbox'

const Gallery: React.FC = () => {
  const navigate = useNavigate()
  const { coupleId } = useAuth()
  const [memories, setMemories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  // UI States
  const [selectedPhoto, setSelectedPhoto] = useState<any | null>(null)
  const [actionMemory, setActionMemory] = useState<any | null>(null)
  const [isActionSheetOpen, setIsActionSheetOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)

  const confirmDelete = async () => {
    if (!actionMemory) return;
    
    try {
      const urlParts = actionMemory.image_url.split('/Fotos/');
      if (urlParts.length > 1) {
        await supabase.storage.from('Fotos').remove([urlParts[1]]);
      }

      const { error: dbError } = await supabase.from('memories').delete().eq('id', actionMemory.id);
      if (dbError) throw dbError;

      setMemories(prev => prev.filter(m => m.id !== actionMemory.id));
      setSelectedPhoto(null);
      setActionMemory(null);
    } catch (error: any) {
      console.error(error);
      alert('No se pudo borrar: ' + error.message + '. Asegúrate de haber aplicado el script SQL en Supabase.');
    }
  }

  const handleDeleteMemory = (memory: any) => {
    setActionMemory(memory);
    setIsDeleteModalOpen(true);
  }

  React.useEffect(() => {
    const fetchMemories = async () => {
      if (!coupleId) return;

      const { data, error } = await supabase
        .from('memories')
        .select(`
          id,
          image_url,
          caption,
          created_at,
          plans ( title )
        `)
        .eq('couple_id', coupleId)
        .order('created_at', { ascending: false });

      if (data) setMemories(data);
      setLoading(false);
    }
    fetchMemories()
  }, [coupleId])

  if (loading) {
    return <div className="min-h-[50vh] flex items-center justify-center"><Loader2 className="animate-spin text-primary" size={32} /></div>
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-12 pb-24"
    >
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-3">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-on-surface leading-tight">
            Nuestra Bóveda
          </h1>
          <p className="text-xl text-on-surface/50 font-medium">
            Cada foto es un susurro capturado de nuestro viaje.
          </p>
        </div>
        <div className="flex gap-3">
          <button className="p-3 bg-surface-low rounded-full text-on-surface/60 hover:text-primary transition-colors shadow-sm">
            <Search size={20} />
          </button>
          <button className="p-3 bg-surface-low rounded-full text-on-surface/60 hover:text-primary transition-colors shadow-sm">
            <Filter size={20} />
          </button>
        </div>
      </header>

      <section className="grid grid-cols-2 md:grid-cols-3 gap-6">
        <AnimatePresence>
          {memories.map((m, i) => (
            <motion.div
              layout
              key={m.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
              className="group relative cursor-pointer"
              onClick={() => setSelectedPhoto(m)}
            >
              <div className="aspect-[4/5] bg-surface-highest rounded-3xl overflow-hidden shadow-sm group-hover:shadow-2xl transition-all duration-700 relative">
                {m.image_url ? (
                  <img src={m.image_url} alt={m.caption} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center opacity-40 group-hover:scale-110 transition-transform duration-700">
                    <ImageIcon size={48} className="text-on-surface/20" />
                  </div>
                )}
                
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none flex items-center justify-center">
                   <Maximize2 className="text-white" size={24} />
                </div>

                <div className="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <p className="font-bold text-white text-lg drop-shadow-md truncate">{m.plans?.title || m.caption || 'Recuerdo'}</p>
                  <p className="text-white/60 text-xs font-semibold drop-shadow-md">
                    {new Date(m.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </section>

      {/* Action UI Overlays */}
      <ImageLightbox 
        isOpen={!!selectedPhoto}
        onClose={() => setSelectedPhoto(null)}
        imageUrl={selectedPhoto?.image_url || ''}
        caption={selectedPhoto?.caption || selectedPhoto?.plans?.title}
        onDelete={() => handleDeleteMemory(selectedPhoto)}
      />

      <ActionSheet 
        isOpen={isActionSheetOpen}
        onClose={() => setIsActionSheetOpen(false)}
        title="Opciones de Memoria"
        options={[
          {
            label: 'Ver en Detalle',
            icon: <Maximize2 size={18} />,
            onClick: () => setSelectedPhoto(actionMemory)
          },
          {
            label: 'Eliminar Memoria',
            icon: <Trash2 size={18} />,
            variant: 'danger',
            onClick: () => setIsDeleteModalOpen(true)
          }
        ]}
      />

      <CustomModal 
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="¿Borrar Recuerdo?"
        description="Esta acción eliminará la imagen de tu bóveda para siempre. No se puede deshacer."
        confirmText="Sí, borrar"
        variant="danger"
      />
      
      {memories.length === 0 && (
         <div className="text-center py-12 text-on-surface/50 font-medium col-span-full">Tu bóveda está vacía. ¡Añade una memoria!</div>
      )}

      <div className="flex justify-center mt-12">
        <motion.button 
          onClick={() => navigate('/gallery/new')}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="px-10 py-4 bg-on-surface text-white font-bold rounded-full shadow-2xl flex items-center gap-3"
        >
          <Camera size={20} /> Añadir Memoria
        </motion.button>
      </div>
    </motion.div>
  )
}

export default Gallery
