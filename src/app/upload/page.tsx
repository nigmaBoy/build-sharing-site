"use client"
import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

export default function Upload() {
  const [file, setFile] = useState<File | null>(null)
  const [images, setImages] = useState<FileList | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [uploaderName, setUploaderName] = useState('') // NEW: Manual Username
  const [isSetup, setIsSetup] = useState(false)
  
  const [cat, setCat] = useState('') 
  const [catSearch, setCatSearch] = useState('')
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [categories, setCategories] = useState<any[]>([]) 

  const [loading, setLoading] = useState(false)
  const [statusText, setStatusText] = useState("UPLOAD BUILD")

  useEffect(() => {
    // No more login check! Just fetch categories.
    supabase.from('categories').select('*').order('name', { ascending: true })
      .then(({ data }) => { if (data) setCategories(data) })
  }, [])

  const filteredCategories = categories.filter(c => c.name.toLowerCase().includes(catSearch.toLowerCase()))

  const handleFileChange = (e: any) => {
    const selected = e.target.files?.[0];
    if (selected && (selected.name.toLowerCase().endsWith('.build') || selected.name.toLowerCase().endsWith('.txt'))) {
      setFile(selected);
    } else if (selected) {
      alert("Please select a .build or .txt file.");
      e.target.value = null; setFile(null);
    }
  }

  const handleImageChange = (e: any) => {
    const files = e.target.files;
    if (files && files.length > 3) {
      alert("Maximum 3 images allowed.");
      e.target.value = null; setImages(null);
    } else {
      setImages(files);
    }
  }
// --- RACISM FILTER (The "Zero Tolerance" Version) ---
// --- ADVANCED RACISM FILTER (Detects Substitutions) ---
// --- NUCLEAR RACISM FILTER (Handles Unicode/Homoglyphs) ---
function isRacist(text: string) {
  if (!text) return false;
  
  // 1. Normalize strange unicode accents (e.g., é -> e)
  let clean = text.normalize('NFKD');

  // 2. HOMOGLYPH MAP: Convert lookalikes to Latin letters
  // This catches Cyrillic, Greek, Armenian, and Leetspeak
  const substitutions: { [key: string]: RegExp } = {
    'a': /[a@àáâäåαаΑ@4x]/g,      // Includes 4, @, x, Cyrillic 'a'
    'b': /[bßΒβ]/g,
    'c': /[cçςсС(]/g,             // Includes (
    'd': /[d∂]/g,
    'e': /[eéèêëεєеЕ3]/g,         // Includes 3, Cyrillic 'e'
    'f': /[fƒ]/g,
    'g': /[gĝ]/g,
    'h': /[hнН]/g,
    'i': /[iíìïîιіІ!|1j]/g,       // Includes 1, !, |, j, Cyrillic 'i'
    'k': /[kκкК]/g,
    'l': /[lι1]/g,
    'm': /[mмМ]/g,
    'n': /[nñոηпП]/g,             // Includes Armenian 'vo' (ո)
    'o': /[oóòöôσоО0]/g,          // Includes 0, Cyrillic 'o'
    'p': /[pрР]/g,
    'r': /[rгГ]/g,
    's': /[sš$5]/g,               // Includes $, 5
    't': /[tτтТ7+]/g,             // Includes 7, +
    'u': /[uüúùûսμυ]/g,           // Includes Armenian 'se' (ս)
    'v': /[vν]/g,
    'w': /[wω]/g,
    'x': /[xχ×]/g,
    'y': /[yÿýуУ]/g,
    'z': /[zž]/g
  };

  // Run the replacements
  for (const [char, regex] of Object.entries(substitutions)) {
    clean = clean.replace(regex, char);
  }

  // 3. Lowercase & Remove anything that isn't a letter
  clean = clean.toLowerCase().replace(/[^a-z]/g, '');

  // 4. THE PATTERNS (Detects repeated letters)
  const patterns = [
    /n+i+g+e+r+/,   // Matches: nigger, niger, n!gger, n1gger
    /n+i+g+a+/,     // Matches: nigga, njgga, nigggga, niga
    /r+e+t+a+r+d+/, // Matches: retard, r3t4rd, rctard
    /f+a+g+/,       // Matches: fag, faggot, fxggot
    /k+i+k+e+/,     // Matches: kike
    /c+o+o+n+/,     // Matches: coon
    /b+e+a+n+e+r+/  // Matches: beaner
  ];

  // 5. Check
  for (const pattern of patterns) {
    if (pattern.test(clean)) return true;
  }
  
  return false;
}


const upload = async () => {
    // --- NEW: ANTI-RACISM CHECK ---
    if (isRacist(title) || isRacist(description) || isRacist(uploaderName)) {
        alert("Nope. Profanity or racist language detected.");
        setLoading(false);
        return;
    }
    // ------------------------------

    if (!file || !images || images.length === 0 || !title || !cat) {
        return alert("Please fill in all required fields and select a category.");
    }
    
    setLoading(true);
    try {
      setStatusText("Uploading Files...");
      const fileId = Math.random().toString(36).substring(7);

      await supabase.storage.from('build-bucket').upload(`files/${fileId}.build`, file);
      
      const imgPaths: string[] = [];
      for (let i = 0; i < images.length; i++) {
        const path = `images/${fileId}_${i}.jpg`;
        await supabase.storage.from('build-bucket').upload(path, images[i]);
        imgPaths.push(path);
      }

      setStatusText("Finalizing...");
      
      // Default avatar since we don't have Discord avatars anymore
      const defaultAvatar = "https://i.imgur.com/6NBHkSg.png"; 
      
      const { error } = await supabase.from('builds').insert([{
        title, description, is_setup: isSetup, category: cat,
        file_url: `files/${fileId}.build`, image_url: imgPaths[0], images: imgPaths,
        username: uploaderName || "Anonymous", author_img: defaultAvatar
        // Removed discord_id and user_id entirely
      }]);

      if (error) throw error;
      window.location.href = "/";
    } catch (e: any) {
      alert(e.message);
      setLoading(false);
      setStatusText("UPLOAD BUILD");
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0b10] text-white flex items-center justify-center p-6 font-sans">
      <div className="max-w-2xl w-full bg-[#111218] border border-slate-800 p-8 md:p-12 rounded-[32px] shadow-2xl relative">
        <header className="mb-10 text-center">
          <h1 className="text-3xl font-black italic text-blue-500 uppercase tracking-tight">Upload Build</h1>
          <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mt-2">Open Workshop</p>
        </header>
        <div className="space-y-6">
          
          {/* NEW: Username Input */}
          <div>
              <label className="text-[10px] font-black text-gray-500 mb-2 block uppercase tracking-widest ml-1">Your Name (Optional)</label>
              <input className="w-full bg-[#0a0b10] border border-slate-800 p-4 rounded-2xl outline-none focus:border-blue-600 transition-all font-bold" placeholder="Anonymous" onChange={e => setUploaderName(e.target.value)} />
          </div>

          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-grow">
                <label className="text-[10px] font-black text-gray-500 mb-2 block uppercase tracking-widest ml-1">Build Name</label>
                <input className="w-full bg-[#0a0b10] border border-slate-800 p-4 rounded-2xl outline-none focus:border-blue-600 transition-all font-bold" placeholder="e.g. Turbo Mech" onChange={e => setTitle(e.target.value)} />
            </div>
            <div className="md:w-36">
                <label className="text-[10px] font-black text-gray-500 mb-2 block uppercase tracking-widest text-center">Set Up?</label>
                <button onClick={() => setIsSetup(!isSetup)} className={`w-full py-4 rounded-2xl font-black text-xs border transition-all cursor-pointer ${isSetup ? 'bg-blue-600 border-blue-500 text-white shadow-[0_0_15px_rgba(37,99,235,0.3)]' : 'bg-[#0a0b10] border-slate-800 text-gray-600'}`}>
                    {isSetup ? 'READY' : 'NO'}
                </button>
            </div>
          </div>
          
          {/* CATEGORY DROPDOWN */}
          <div className="relative">
            <label className="text-[10px] font-black text-gray-500 mb-2 block uppercase tracking-widest ml-1">Category</label>
            <div className={`flex items-center bg-[#0a0b10] border rounded-2xl p-4 transition-all cursor-text ${isDropdownOpen ? 'border-blue-600' : 'border-slate-800'}`} onClick={() => setIsDropdownOpen(true)}>
                <input className="bg-transparent outline-none flex-grow font-bold text-sm" placeholder={cat || "Search or select category..."} value={catSearch} onChange={(e) => {setCatSearch(e.target.value); setIsDropdownOpen(true);}}/>
                <div className={`text-[10px] transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}>▼</div>
            </div>

            {isDropdownOpen && (
                <div className="absolute z-50 w-full mt-2 bg-[#16171f] border border-slate-800 rounded-2xl shadow-2xl max-h-60 overflow-y-auto no-scrollbar">
                    {filteredCategories.length > 0 ? (
                        filteredCategories.map((c) => (
                            <div key={c.id} className="p-4 hover:bg-blue-600 hover:text-white cursor-pointer font-bold text-sm transition-colors border-b border-white/5 last:border-none" onClick={() => {setCat(c.name); setCatSearch(''); setIsDropdownOpen(false);}}>
                                {c.name}
                            </div>
                        ))
                    ) : (<div className="p-4 text-gray-600 text-xs font-bold uppercase italic text-center">No categories found</div>)}
                </div>
            )}
            {isDropdownOpen && <div className="fixed inset-0 z-40" onClick={() => setIsDropdownOpen(false)}></div>}
          </div>

          <div>
            <label className="text-[10px] font-black text-gray-500 mb-2 block uppercase tracking-widest ml-1">Description</label>
            <textarea className="w-full bg-[#0a0b10] border border-slate-800 p-4 rounded-2xl outline-none focus:border-blue-600 transition-all font-medium text-sm h-32 resize-none italic" placeholder="Controls, features, etc..." onChange={e => setDescription(e.target.value)} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <label className={`border-2 border-dashed flex flex-col items-center justify-center p-8 rounded-3xl transition-all cursor-pointer ${file ? 'border-blue-600 bg-blue-600/5 text-blue-400' : 'border-slate-800 bg-[#0a0b10] hover:border-slate-700 text-gray-600'}`}>
                <p className="text-[10px] font-black uppercase mb-1">Build File</p>
                <p className="text-[9px] truncate max-w-[140px]">{file ? file.name : ".build or .txt"}</p>
                <input type="file" className="hidden" accept=".build,.txt" onChange={handleFileChange} />
             </label>
             <label className={`border-2 border-dashed flex flex-col items-center justify-center p-8 rounded-3xl transition-all cursor-pointer ${images ? 'border-blue-600 bg-blue-600/5 text-blue-400' : 'border-slate-800 bg-[#0a0b10] hover:border-slate-700 text-gray-600'}`}>
                <p className="text-[10px] font-black uppercase mb-1">Images</p>
                <p className="text-[9px]">{images ? `${images.length}/3 selected` : "Max 3 screenshots"}</p>
                <input type="file" className="hidden" multiple accept="image/*" onChange={handleImageChange} />
             </label>
          </div>

          <div className="flex flex-col md:flex-row gap-4 pt-4">
            <button onClick={upload} disabled={loading} className="w-full md:flex-[2] bg-blue-600 hover:bg-blue-500 py-5 rounded-2xl font-black text-lg transition-all shadow-lg shadow-blue-900/20 disabled:opacity-50 cursor-pointer flex items-center justify-center">
              {loading ? statusText : "UPLOAD BUILD"}
            </button>
            <a href="/" className="w-full md:flex-1 bg-slate-900 hover:bg-slate-800 py-5 rounded-2xl font-black text-xs text-gray-500 transition-all cursor-pointer uppercase tracking-widest flex items-center justify-center">Cancel</a>
          </div>
        </div>
      </div>
    </div>
  )
}