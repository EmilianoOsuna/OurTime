export async function compressToWebP(
  file: File,
  maxPx = 1920,
  quality = 0.82
): Promise<File> {
  if (file.size > 20 * 1024 * 1024) {
    throw new Error('La imagen supera los 20 MB. Elegí una más liviana.')
  }
  if (!file.type.startsWith('image/')) {
    throw new Error('El archivo no es una imagen válida.')
  }
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      const scale = Math.min(1, maxPx / Math.max(img.width, img.height))
      const w = Math.round(img.width * scale)
      const h = Math.round(img.height * scale)
      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      canvas.getContext('2d')!.drawImage(img, 0, 0, w, h)
      canvas.toBlob(
        blob => {
          if (!blob) { reject(new Error('Conversión WebP fallida')); return }
          const name = file.name.replace(/\.[^.]+$/, '.webp')
          resolve(new File([blob], name, { type: 'image/webp' }))
        },
        'image/webp',
        quality
      )
    }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('No se pudo leer la imagen')) }
    img.src = url
  })
}
