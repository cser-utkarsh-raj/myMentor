import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Upload, 
  FileText, 
  Trash2, 
  FolderPlus, 
  ShieldAlert, 
  CheckCircle,
  File,
  Download
} from 'lucide-react'
import { usePDFs, useUploadPDF, useDeletePDF } from '../hooks/useApi'
import { useUIStore } from '../store/uiStore'

export const PDFs: React.FC = () => {
  const { accentColor } = useUIStore()
  
  // Queries & Mutations
  const { data: pdfs, isLoading } = usePDFs()
  const uploadPDFMutation = useUploadPDF()
  const deletePDFMutation = useDeletePDF()

  // State
  const [category, setCategory] = useState('Resume')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle')

  const getColorClass = (type: 'text' | 'bg' | 'border' | 'btn' | 'glow') => {
    switch (accentColor) {
      case 'cyan':
        if (type === 'text') return 'text-cyan-400'
        if (type === 'bg') return 'bg-cyan-500/10'
        if (type === 'border') return 'border-cyan-500/20'
        if (type === 'btn') return 'bg-cyan-500 hover:bg-cyan-400 text-black shadow-[0_0_15px_rgba(6,182,212,0.3)]'
        return 'rgba(6, 182, 212, 0.4)'
      case 'emerald':
        if (type === 'text') return 'text-emerald-400'
        if (type === 'bg') return 'bg-emerald-500/10'
        if (type === 'border') return 'border-emerald-500/20'
        if (type === 'btn') return 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-[0_0_15px_rgba(16,185,129,0.3)]'
        return 'rgba(16, 185, 129, 0.4)'
      case 'purple':
      default:
        if (type === 'text') return 'text-purple-400'
        if (type === 'bg') return 'bg-purple-500/10'
        if (type === 'border') return 'border-purple-500/20'
        if (type === 'btn') return 'bg-purple-500 hover:bg-purple-400 text-zinc-950 shadow-[0_0_15px_rgba(168,85,247,0.3)]'
        return 'rgba(168, 85, 247, 0.4)'
    }
  }

  // Format bytes helper
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // Format date helper
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // File selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0])
      setUploadStatus('idle')
    }
  }

  // Upload handler
  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedFile) return
    
    setUploadStatus('uploading')
    const formData = new FormData()
    formData.append('file', selectedFile)
    formData.append('category', category)

    try {
      await uploadPDFMutation.mutateAsync(formData)
      setUploadStatus('success')
      setSelectedFile(null)
      setTimeout(() => setUploadStatus('idle'), 2000)
    } catch (e) {
      setUploadStatus('error')
    }
  }

  // Delete handler
  const handleDelete = async (pdfId: number) => {
    if (confirm('Are you sure you want to delete this document from local catalog registry?')) {
      try {
        await deletePDFMutation.mutateAsync(pdfId)
      } catch (e) {
        alert('Failed to delete file.')
      }
    }
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 w-full max-w-6xl mx-auto py-4">
      {/* LEFT PANEL: Upload Form */}
      <div className="w-full lg:w-[35%] flex flex-col gap-6">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
            Documents Registry
          </h2>
          <p className="text-zinc-500 font-medium mt-1">
            Store learning materials, reference notes, and PDF portfolios locally.
          </p>
        </div>

        <div className="glass-panel p-6 rounded-3xl border border-white/5 bg-zinc-950/15 flex flex-col gap-5">
          <h3 className="font-bold text-zinc-200 flex items-center gap-2">
            <Upload className="w-4 h-4 text-zinc-500" /> Upload Document
          </h3>
          
          <form onSubmit={handleUpload} className="flex flex-col gap-4">
            {/* Category tag select */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Document Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="glass-input text-sm"
              >
                <option value="Resume">Resume / Portfolio</option>
                <option value="DSA">Data Structures & Algorithms</option>
                <option value="SQL">Database & SQL Notes</option>
                <option value="Python">Python Basics</option>
                <option value="React">React UI</option>
                <option value="DevOps">Containers & DevOps</option>
                <option value="Other">Other Reference</option>
              </select>
            </div>

            {/* Drag & Drop File Selector area */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">PDF File</label>
              <div className="relative border-2 border-dashed border-white/10 rounded-2xl p-6 hover:border-white/20 transition-all flex flex-col items-center justify-center gap-2 cursor-pointer bg-zinc-950/40">
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileChange}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <FileText className={`w-8 h-8 ${selectedFile ? getColorClass('text') : 'text-zinc-500'}`} />
                {selectedFile ? (
                  <div className="text-center">
                    <span className="text-sm font-semibold text-zinc-200 block truncate max-w-[180px]">{selectedFile.name}</span>
                    <span className="text-xs text-zinc-500">{formatBytes(selectedFile.size)}</span>
                  </div>
                ) : (
                  <div className="text-center">
                    <span className="text-xs font-semibold text-zinc-300 block">Click or Drag PDF file</span>
                    <span className="text-[10px] text-zinc-500">Max size 20MB</span>
                  </div>
                )}
              </div>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={!selectedFile || uploadStatus === 'uploading'}
              className={`w-full py-3 rounded-2xl text-sm font-bold transition-all cursor-pointer ${getColorClass('btn')} disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center gap-2`}
            >
              {uploadStatus === 'uploading' ? (
                <>
                  <div className="w-4 h-4 rounded-full border border-dashed border-zinc-950 animate-spin" /> Uploading...
                </>
              ) : uploadStatus === 'success' ? (
                <>
                  <CheckCircle className="w-4 h-4" /> Upload Complete
                </>
              ) : (
                'Upload & Register'
              )}
            </button>
          </form>

          {/* Prompt banner for V2 */}
          <div className="p-4 rounded-2xl bg-zinc-900/30 border border-white/5 text-[11px] text-zinc-500 leading-relaxed">
            📢 **V2 Expansion Point**: Uploaded files will be parsed dynamically using Gemini embeddings to extract custom flashcards, quiz tasks, and auto-populate your learning roadmap check-ins!
          </div>
        </div>
      </div>

      {/* RIGHT PANEL: PDF Catalog Grid/List */}
      <div className="w-full lg:w-[65%] glass-panel rounded-3xl border border-white/10 overflow-hidden bg-zinc-950/10 flex flex-col min-h-[450px]">
        <div className="p-5 border-b border-white/5 bg-zinc-900/20 flex justify-between items-center">
          <h3 className="font-bold text-zinc-350 text-sm">Registered Documents Catalog</h3>
          <span className="text-xs text-zinc-500">{pdfs?.length || 0} Files Total</span>
        </div>

        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="w-8 h-8 rounded-full border-2 border-dashed border-zinc-500 animate-spin" />
          </div>
        ) : pdfs && pdfs.length > 0 ? (
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-white/5 text-zinc-500 uppercase tracking-widest font-bold bg-zinc-950/20">
                  <th className="p-4">Document Details</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Size</th>
                  <th className="p-4">Uploaded</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-zinc-300">
                {pdfs.map((pdf) => (
                  <tr key={pdf.id} className="hover:bg-white/5 transition-all">
                    <td className="p-4 font-semibold text-zinc-200">
                      <div className="flex items-center gap-2">
                        <File className="w-4 h-4 text-zinc-400 shrink-0" />
                        <span className="truncate max-w-[200px]" title={pdf.filename}>
                          {pdf.filename}
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded font-bold uppercase tracking-wider text-[9px] ${
                        pdf.category === 'Resume' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' :
                        pdf.category === 'DSA' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                        pdf.category === 'SQL' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' :
                        'bg-zinc-800 text-zinc-400 border border-white/5'
                      }`}>
                        {pdf.category}
                      </span>
                    </td>
                    <td className="p-4 font-mono text-zinc-400">{formatBytes(pdf.size_bytes)}</td>
                    <td className="p-4 text-zinc-500">{formatDate(pdf.upload_date)}</td>
                    <td className="p-4 text-center">
                      <div className="flex gap-2 justify-center">
                        <button
                          type="button"
                          onClick={() => handleDelete(pdf.id)}
                          className="p-2 rounded-lg bg-zinc-950/40 border border-white/5 hover:border-red-500/20 text-zinc-500 hover:text-red-400 transition-all cursor-pointer"
                          title="Delete PDF"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 gap-3">
            <ShieldAlert className="w-8 h-8 text-zinc-600" />
            <h4 className="font-bold text-zinc-400 text-sm">No documents found</h4>
            <p className="text-xs text-zinc-650 max-w-[200px]">Upload reference papers, interview checklists, or PDFs to manage them here.</p>
          </div>
        )}
      </div>
    </div>
  )
}
