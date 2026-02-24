"use client"
import { createClient } from '@supabase/supabase-js'
import { useEffect, useState } from 'react'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

// Change this to whatever password you want to use for deleting things
const SECRET_PASSWORD = "dfgtrecvh6405" 

export default function Home() {
  const [builds, setBuilds] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const [setupFilter, setSetupFilter] = useState<'All' | 'Setup' | 'NotSetup'>('All')
  const [selectedBuild, setSelectedBuild] = useState<any>(null)

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    const { data: bData } = await supabase.from('builds').select('*').order('created_at', { ascending: false })
    if (bData) setBuilds(bData)
    
    const { data: cData } = await supabase.from('categories').select('*').order('name', { ascending: true })
    if (cData) setCategories(cData)
  }

  // Admin delete via simple password prompt
  async function handleDelete(build: any) {
    const pass = prompt("Enter Admin Password to delete this post:")
    if (pass !== SECRET_PASSWORD) {
        alert("Incorrect password.")
        return
    }
    
    // We assume you turned off RLS for admins, or you do this via Supabase dashboard.
    // NOTE: If Supabase still blocks this, you have to run step 5 below!
    const { error } = await supabase.from('builds').delete().eq('id', build.id)
    
    if (error) {
      alert("Error deleting build: " + error.message)
      return
    }
    
    const filesToDelete = [build.file_url, ...(build.images || [])].filter(Boolean)
    if (filesToDelete.length > 0) {
      await supabase.storage.from('build-bucket').remove(filesToDelete)
    }
    
    fetchData()
    setSelectedBuild(null)
  }

  async function downloadBuild(e: any, build: any) {
    e.stopPropagation()
    const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/build-bucket/${build.file_url}`
    const response = await fetch(url); const blob = await response.blob();
    const link = document.createElement('a'); link.href = window.URL.createObjectURL(blob);
    link.download = `${build.title}.build`; link.click()
  }

  const storageUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/build-bucket/`
  const filtered = builds.filter(b => {
    const matchesSearch = b.title.toLowerCase().includes(search.toLowerCase());
    const matchesCat = category === 'All' || b.category === category;
    const matchesSetup = setupFilter === 'All' ? true : setupFilter === 'Setup' ? b.is_setup : !b.is_setup;
    return matchesSearch && matchesCat && matchesSetup;
  })

  return (
    <main className="min-h-screen bg-[#06070a] text-white p-6 md:p-12 font-sans">
      
      {/* HEADER */}
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center mb-10 gap-6">
        <h1 className="text-5xl font-black italic text-blue-500 tracking-tighter drop-shadow-[0_0_20px_rgba(59,130,246,0.5)]">BABFT WORKSHOP</h1>
        <div className="flex gap-4 items-center">
           <div className="flex bg-[#13141c] border border-slate-800 rounded-2xl p-1 items-center">
              <input placeholder="Search..." className="bg-transparent p-3 outline-none text-sm w-40 lg:w-64" onChange={e => setSearch(e.target.value)} />
              <button onClick={() => setSetupFilter(setupFilter === 'All' ? 'Setup' : setupFilter === 'Setup' ? 'NotSetup' : 'All')} className={`px-4 py-2 rounded-xl text-[10px] font-black border transition-all cursor-pointer ${setupFilter === 'Setup' ? 'bg-green-500 border-green-400 text-black' : setupFilter === 'NotSetup' ? 'bg-red-500 border-red-400 text-black' : 'bg-slate-800 border-slate-700 text-gray-400'}`}>
                {setupFilter === 'All' ? 'ALL' : setupFilter === 'Setup' ? 'SET UP' : 'NOT SET UP'}
              </button>
           </div>
           
           {/* ALWAYS SHOW UPLOAD NOW */}
           <a href="/upload" className="bg-blue-600 px-6 py-4 rounded-2xl font-black italic hover:scale-105 transition-all shadow-lg">UPLOAD</a>
        </div>
      </div>

      {/* CATEGORIES */}
      <div className="max-w-7xl mx-auto flex flex-wrap gap-3 mb-12">
        <button onClick={() => setCategory('All')} className={`px-8 py-2 rounded-full font-black border transition-all cursor-pointer hover:scale-105 ${category === 'All' ? 'bg-blue-600 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.4)]' : 'bg-[#13141c] border-slate-800 text-gray-500 hover:text-white hover:border-slate-600'}`}>All</button>
        {categories.map(cat => (
          <button key={cat.id} onClick={() => setCategory(cat.name)} className={`px-8 py-2 rounded-full font-black border transition-all cursor-pointer whitespace-nowrap hover:scale-105 ${category === cat.name ? 'bg-blue-600 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.4)]' : 'bg-[#13141c] border-slate-800 text-gray-500 hover:text-white hover:border-slate-600'}`}>{cat.name}</button>
        ))}
      </div>

      {/* GRID */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {filtered.map((b) => (
          <div key={b.id} onClick={() => setSelectedBuild(b)} className="group bg-[#111218] border border-slate-800/50 rounded-[35px] overflow-hidden cursor-pointer hover:border-blue-500 transition-all shadow-xl hover:-translate-y-2">
            <div className="relative h-52 w-full overflow-hidden">
               <img src={storageUrl + b.image_url} className="w-full h-full object-cover transition-all group-hover:scale-110" />
               {b.is_setup && <div className="absolute top-4 right-4 bg-green-500 text-black text-[10px] font-black px-3 py-1 rounded-full">SET UP</div>}
               <div className="absolute bottom-4 left-4 bg-blue-600 text-white text-[10px] font-black px-3 py-1 rounded-lg uppercase tracking-widest">{b.category}</div>
            </div>
            <div className="p-6">
              <h2 className="text-2xl font-black italic truncate mb-4">{b.title}</h2>
              <button onClick={(e) => downloadBuild(e, b)} className="w-full bg-[#1c1d26] hover:bg-blue-600 py-4 rounded-2xl font-black text-xs transition-all cursor-pointer uppercase tracking-widest">Download .build</button>
<div className="flex items-center gap-3 mt-6 pt-4 border-t border-slate-800/50">
   <div className="w-6 h-6 rounded-full bg-slate-800 border border-blue-500/30 flex items-center justify-center">
      <span className="text-[10px]">👤</span>
   </div>
   <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{b.username || "Anonymous"}</p>
</div>
            </div>
          </div>
        ))}
      </div>

      {/* LIGHTBOX */}
      {selectedBuild && (
        <div className="fixed inset-0 bg-black/98 z-50 flex items-center justify-center p-6 backdrop-blur-xl" onClick={() => setSelectedBuild(null)}>
          <div className="max-w-6xl w-full bg-[#0a0b10] border border-slate-800 p-8 md:p-12 rounded-[50px] shadow-2xl overflow-hidden flex flex-col md:flex-row gap-10 relative" onClick={e => e.stopPropagation()}>
            <button onClick={() => setSelectedBuild(null)} className="absolute top-8 right-10 text-gray-600 hover:text-white text-5xl cursor-pointer">×</button>
            <div className="flex-1 overflow-y-auto max-h-[75vh] space-y-6 pr-4 custom-scrollbar">
               {selectedBuild.images.map((img: any, i: number) => (
                 <img key={i} src={storageUrl + img} className="rounded-[40px] w-full border border-white/5 shadow-2xl" />
               ))}
            </div>
            <div className="w-full md:w-96 flex flex-col">
                <div className="mb-8">
                    <h2 className="text-4xl font-black italic tracking-tighter text-blue-500 mb-2 leading-none uppercase">{selectedBuild.title}</h2>
                    <div className="flex items-center gap-3 mb-6 bg-slate-900/50 p-3 rounded-2xl border border-slate-800/50 w-fit">
                        <img src={selectedBuild.author_img || "https://i.imgur.com/6NBHkSg.png"} className="w-8 h-8 rounded-full border-2 border-blue-600 shadow-lg" />
                        <div>
                           <p className="text-blue-400 font-black uppercase text-[10px] tracking-widest">{selectedBuild.username || "Anonymous"}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-[#13141c] p-6 rounded-3xl border border-slate-800/50 flex-grow mb-8 shadow-inner">
                    <p className="text-[10px] font-black text-gray-600 uppercase tracking-[0.2em] mb-4">Description</p>
                    <p className="text-sm text-gray-300 leading-relaxed font-medium italic">"{selectedBuild.description || "No description provided."}"</p>
                </div>
                <div className="flex flex-col gap-3">
                    <button onClick={(e) => downloadBuild(e, selectedBuild)} className="w-full bg-blue-600 hover:bg-blue-500 py-6 rounded-[25px] font-black text-xl transition-all shadow-xl cursor-pointer">DOWNLOAD FILE</button>
                    
                    {/* SECRET DELETE BUTTON */}
                    <button onClick={() => handleDelete(selectedBuild)} className="text-gray-600 hover:text-white text-[10px] font-bold uppercase cursor-pointer mt-4">Admin Delete</button>
                </div>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}