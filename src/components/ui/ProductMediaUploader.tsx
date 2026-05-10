import { useCallback, useRef, useState } from 'react'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import { ImagePlus, Video, X, GripVertical, Loader2, AlertCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface MediaSlot {
  id:       string
  url:      string
  localSrc: string
  progress: number
  error:    string | null
}

interface Props {
  shopId:       string
  initialImages?: string[]
  initialVideo?: string | null
  onImagesChange: (urls: string[]) => void
  onVideoChange:  (url: string | null) => void
}

const MAX_IMAGES   = 8
const MAX_IMG_MB   = 5
const MAX_VIDEO_MB = 100
const ACCEPTED_IMG = ['image/jpeg', 'image/png', 'image/webp']
const ACCEPTED_VID = ['video/mp4', 'video/webm', 'video/quicktime']

function uid() { return Math.random().toString(36).slice(2) }

export function ProductMediaUploader({ shopId, initialImages = [], initialVideo = null, onImagesChange, onVideoChange }: Props) {
  const [slots, setSlots] = useState<MediaSlot[]>(() =>
    initialImages.map(url => ({ id: uid(), url, localSrc: url, progress: 100, error: null }))
  )
  const [video, setVideo] = useState<{ url: string; localSrc: string; progress: number; error: string | null } | null>(
    initialVideo ? { url: initialVideo, localSrc: initialVideo, progress: 100, error: null } : null
  )
  const imgInputRef   = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)

  const uploadFile = useCallback(async (
    file: File,
    path: string,
    onProgress: (p: number) => void,
  ): Promise<string> => {
    onProgress(10)
    const { error } = await supabase.storage
      .from('product-media')
      .upload(path, file, { upsert: true, contentType: file.type })
    if (error) throw error
    onProgress(90)
    const { data: { publicUrl } } = supabase.storage.from('product-media').getPublicUrl(path)
    onProgress(100)
    return publicUrl
  }, [])

  const addImages = useCallback(async (files: File[]) => {
    const toAdd = files
      .filter(f => ACCEPTED_IMG.includes(f.type) && f.size <= MAX_IMG_MB * 1024 * 1024)
      .slice(0, MAX_IMAGES - slots.length)

    if (!toAdd.length) return

    const newSlots: MediaSlot[] = toAdd.map(f => ({
      id: uid(),
      url: '',
      localSrc: URL.createObjectURL(f),
      progress: 0,
      error: null,
    }))

    setSlots(prev => {
      const next = [...prev, ...newSlots]
      return next
    })

    for (let i = 0; i < toAdd.length; i++) {
      const file = toAdd[i]
      const slotId = newSlots[i].id
      const path = `shops/${shopId}/images/${Date.now()}-${uid()}-${file.name.replace(/\s+/g, '_')}`

      try {
        const publicUrl = await uploadFile(file, path, (p) => {
          setSlots(prev => prev.map(s => s.id === slotId ? { ...s, progress: p } : s))
        })
        setSlots(prev => {
          const next = prev.map(s => s.id === slotId ? { ...s, url: publicUrl, progress: 100 } : s)
          onImagesChange(next.filter(s => s.url).map(s => s.url))
          return next
        })
      } catch {
        setSlots(prev => prev.map(s => s.id === slotId ? { ...s, error: 'Upload failed. Try again.', progress: 0 } : s))
      }
    }
  }, [slots.length, shopId, uploadFile, onImagesChange])

  const removeSlot = useCallback((id: string) => {
    setSlots(prev => {
      const next = prev.filter(s => s.id !== id)
      onImagesChange(next.filter(s => s.url).map(s => s.url))
      return next
    })
  }, [onImagesChange])

  const onDragEnd = useCallback((result: DropResult) => {
    if (!result.destination) return
    setSlots(prev => {
      const next = [...prev]
      const [moved] = next.splice(result.source.index, 1)
      next.splice(result.destination!.index, 0, moved)
      onImagesChange(next.filter(s => s.url).map(s => s.url))
      return next
    })
  }, [onImagesChange])

  const handleImgDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const files = Array.from(e.dataTransfer.files)
    addImages(files)
  }, [addImages])

  const addVideo = useCallback(async (file: File) => {
    if (!ACCEPTED_VID.includes(file.type) || file.size > MAX_VIDEO_MB * 1024 * 1024) return

    const localSrc = URL.createObjectURL(file)
    setVideo({ url: '', localSrc, progress: 5, error: null })

    const path = `shops/${shopId}/videos/${Date.now()}-${uid()}-${file.name.replace(/\s+/g, '_')}`

    try {
      const publicUrl = await uploadFile(file, path, (p) => {
        setVideo(prev => prev ? { ...prev, progress: p } : null)
      })
      setVideo({ url: publicUrl, localSrc, progress: 100, error: null })
      onVideoChange(publicUrl)
    } catch {
      setVideo(prev => prev ? { ...prev, error: 'Video upload failed. Try again.', progress: 0 } : null)
    }
  }, [shopId, uploadFile, onVideoChange])

  const removeVideo = useCallback(() => {
    setVideo(null)
    onVideoChange(null)
  }, [onVideoChange])

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-white/70">
          Product Images & Video
        </label>
        <span className="text-xs text-white/30">{slots.length}/{MAX_IMAGES} images · JPG/PNG/WEBP max 5MB · MP4/WebM max 100MB</span>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="product-images" direction="horizontal">
          {(provided) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              onDrop={handleImgDrop}
              onDragOver={e => e.preventDefault()}
              className="grid grid-cols-4 gap-2"
            >
              {/* Image slots */}
              {slots.map((slot, index) => (
                <Draggable key={slot.id} draggableId={slot.id} index={index}>
                  {(drag, snapshot) => (
                    <div
                      ref={drag.innerRef}
                      {...drag.draggableProps}
                      className={`relative aspect-square rounded-xl overflow-hidden border ${
                        snapshot.isDragging ? 'border-brand-500 scale-105 shadow-2xl shadow-brand-500/30' : 'border-white/10'
                      } ${index === 0 ? 'col-span-2 row-span-2' : ''} transition-all`}
                    >
                      {/* Image */}
                      <img
                        src={slot.localSrc}
                        alt={`Product ${index + 1}`}
                        className="w-full h-full object-cover"
                      />

                      {/* Upload progress overlay */}
                      {slot.progress < 100 && !slot.error && (
                        <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-2">
                          <Loader2 size={20} className="text-brand-400 animate-spin" />
                          <div className="w-3/4 h-1 bg-white/20 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-brand-400 rounded-full transition-all"
                              style={{ width: `${slot.progress}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Error overlay */}
                      {slot.error && (
                        <div className="absolute inset-0 bg-red-900/80 flex flex-col items-center justify-center gap-1 p-2">
                          <AlertCircle size={16} className="text-red-300" />
                          <p className="text-xs text-red-200 text-center leading-tight">{slot.error}</p>
                        </div>
                      )}

                      {/* Main badge */}
                      {index === 0 && slot.progress === 100 && (
                        <div className="absolute top-2 left-2 bg-brand-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                          MAIN
                        </div>
                      )}

                      {/* Drag handle */}
                      <div
                        {...drag.dragHandleProps}
                        className="absolute top-2 right-7 text-white/60 hover:text-white cursor-grab active:cursor-grabbing p-0.5"
                      >
                        <GripVertical size={14} />
                      </div>

                      {/* Remove */}
                      <button
                        type="button"
                        onClick={() => removeSlot(slot.id)}
                        className="absolute top-1.5 right-1.5 bg-black/60 hover:bg-red-500 text-white rounded-full p-0.5 transition-colors"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  )}
                </Draggable>
              ))}

              {provided.placeholder}

              {/* Add image button */}
              {slots.length < MAX_IMAGES && (
                <button
                  type="button"
                  onClick={() => imgInputRef.current?.click()}
                  className={`aspect-square rounded-xl border-2 border-dashed border-white/15 hover:border-brand-500/50 flex flex-col items-center justify-center gap-2 text-white/30 hover:text-brand-400 transition-all group ${
                    slots.length === 0 ? 'col-span-2 row-span-2' : ''
                  }`}
                >
                  <ImagePlus size={slots.length === 0 ? 36 : 22} className="group-hover:scale-110 transition-transform" />
                  {slots.length === 0 && (
                    <>
                      <p className="text-sm font-medium text-white/50 group-hover:text-brand-400">Add product photos</p>
                      <p className="text-xs text-white/25">or drag & drop here</p>
                    </>
                  )}
                </button>
              )}

              {/* Video slot */}
              <div className={`aspect-square rounded-xl overflow-hidden border border-white/10 relative ${video ? '' : 'border-dashed'}`}>
                {video ? (
                  <>
                    <video
                      src={video.localSrc}
                      className="w-full h-full object-cover"
                      muted
                      loop
                      playsInline
                    />
                    <div className="absolute top-1.5 left-1.5 bg-black/60 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Video size={10} /> VIDEO
                    </div>
                    {video.progress < 100 && !video.error && (
                      <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-2">
                        <Loader2 size={18} className="text-brand-400 animate-spin" />
                        <div className="w-3/4 h-1 bg-white/20 rounded-full overflow-hidden">
                          <div className="h-full bg-brand-400 rounded-full transition-all" style={{ width: `${video.progress}%` }} />
                        </div>
                      </div>
                    )}
                    {video.error && (
                      <div className="absolute inset-0 bg-red-900/80 flex items-center justify-center p-2">
                        <p className="text-xs text-red-200 text-center">{video.error}</p>
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={removeVideo}
                      className="absolute top-1.5 right-1.5 bg-black/60 hover:bg-red-500 text-white rounded-full p-0.5 transition-colors"
                    >
                      <X size={12} />
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => videoInputRef.current?.click()}
                    className="w-full h-full flex flex-col items-center justify-center gap-2 text-white/30 hover:text-brand-400 hover:border-brand-500/50 transition-all group"
                  >
                    <Video size={22} className="group-hover:scale-110 transition-transform" />
                    <span className="text-[10px] text-center leading-tight">Add<br/>video</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {/* File inputs (hidden) */}
      <input
        ref={imgInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="hidden"
        onChange={e => { if (e.target.files) addImages(Array.from(e.target.files)); e.target.value = '' }}
      />
      <input
        ref={videoInputRef}
        type="file"
        accept="video/mp4,video/webm,video/quicktime"
        className="hidden"
        onChange={e => { if (e.target.files?.[0]) addVideo(e.target.files[0]); e.target.value = '' }}
      />

      {slots.length === 0 && (
        <p className="text-xs text-white/25 text-center">
          First image becomes the main display photo. Drag to reorder. Up to {MAX_IMAGES} images + 1 video.
        </p>
      )}
    </div>
  )
}
