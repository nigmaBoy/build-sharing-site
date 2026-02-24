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
// --- THE "BLACK HOLE" RACISM FILTER ---
// Absorbs every weird font, symbol, and language trick.
// --- HELPER: CALCULATE WORD DISTANCE ---
// Returns how many letters need to change to make the words match
function getEditDistance(a: string, b: string) {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          Math.min(
            matrix[i][j - 1] + 1,   // insertion
            matrix[i - 1][j] + 1    // deletion
          )
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

// --- INTELLIGENT RACISM FILTER ---
function isRacist(text: string) {
  if (!text) return false;

  // 1. NORMALIZE & DECOMPOSE (The "Black Hole" cleaner)
  let clean = text.normalize("NFKD").replace(/[\u0300-\u036f]/g, "");

  // 2. SUBSTITUTION MAP (Maps symbols/foreign chars to English)
  const map: { [key: string]: RegExp } = {
    'a': /[a@4xàáâäåæāăąǎǟǡαɑａ𝐚𝑎𝒂𝓪𝔞𝕒𝖆𝚊𝛂𝟈ΔΛ∂]/g,
    'b': /[bßβɓʙｂ𝐛𝑏𝒃𝓫𝔟𝕓𝖇𝗯𝘣𝙗𝚋]/g,
    'c': /[cçćĉċčςｃ𝐜𝑐𝒄𝓬𝔠𝕔𝖈𝗰𝘤𝙘𝚌]/g,
    'd': /[dďđɖɗ𝐝𝑑𝒅𝓭𝔡𝕕𝖉𝗱𝘥𝙙𝚍]/g,
    'e': /[e3€èéêëēĕėęěεєеэз𝓮𝔢𝕖𝖊𝗲𝘦𝙚𝚎]/g,
    'f': /[fƒ𝐟𝑓𝒇𝓯𝔣𝕗𝖋𝗳𝘧𝙛𝚏]/g,
    'g': /[gĝğġģǥǧɠｇ𝐠𝑔𝒈𝓰𝔤𝕘𝖌𝗴𝘨𝙜𝚐]/g,
    'h': /[hĥħɥʜｈ𝐡𝒉𝓱𝔥𝕙𝖍𝗵𝘩𝙝𝚑]/g,
    'i': /[i1!|lĺļľŀłℓjíìïîīįǐĭỉịιꙇاｉ𝐢𝑖𝒊𝒾𝓲𝔦𝕚𝖎𝗶𝘪𝙞𝚒Ǐ]/g,
    'k': /[kķĸƙκｋ𝐤𝑘𝒌𝓀𝓴𝔨𝕜𝖐𝗸𝘬𝙠𝚔]/g,
    'm': /[mḿṁṃɱｍ𝐦𝑚𝒎𝓶𝔪𝕞𝖒𝗺𝘮𝙢𝚖]/g,
    'n': /[nñńņňŉŋɳɴｎ𝐧𝘯𝙣𝒏𝓷𝔫𝕟𝟄𝐧𝑛𝒏𝓷𝔫𝕟𝖓𝗻𝘯𝙣𝚗]/g,
    'o': /[o0òóôõöōŏőơǒǫøǿοσоｏ𝐨𝑜𝒐𝓸𝔬𝕠𝖔𝗼𝘰𝙤𝚘]/g,
    'p': /[pṕṗρｐ𝐩𝑝𝒑𝓹𝔭𝕡𝖕𝗽𝘱𝙥𝚙]/g,
    'r': /[rŕŗřȑȓɼɾｒ𝐫𝑟𝒓𝓻𝔯𝕣𝖗𝗿𝘳𝙧𝚛]/g,
    's': /[sśŝşšſșςｓ𝐬𝑠𝒔𝓼𝔰𝕤𝖘𝘀𝘴𝙨𝚜$5]/g,
    't': /[t7+ţťŧțτтｔ𝐭𝑡𝒕𝓽𝔱𝕥𝖙𝘁𝘵𝙩𝚝†]/g,
    'u': /[uùúûüũūŭůűųǔǖǘǚǜμυｕ𝐮𝑢𝒖𝓾𝔲𝕦𝖚𝘂𝘶𝙪𝚞]/g,
    'v': /[vʋνｖ𝐯𝑣𝒗𝓿𝔳𝕧𝖛𝘃𝘷𝙫𝚟]/g,
    'w': /[wŵｗ𝐰𝑤𝒘𝔀𝔴𝕨𝖜𝘄𝘸𝙬𝚠]/g,
    'x': /[x×χｘ𝐱𝑥𝒙𝔁𝔵𝕩𝖝𝖝𝙭𝚡]/g,
    'y': /[yýÿŷｙ𝐲𝑦𝒚𝔂𝔶𝕪𝖞𝘆𝘺𝙮𝚢]/g,
    'z': /[zźżžζｚ𝐳𝑧𝒛𝔷𝕫𝖟𝘇𝘻𝙯𝚣]/g
  };

  for (const [char, regex] of Object.entries(map)) {
    clean = clean.replace(regex, char);
  }
  
  clean = clean.toLowerCase().replace(/[^a-z]/g, '');

  // 3. REGEX CHECK (Catches expanded words like "niiiigggggeerrr")
  const regexList = [
    /n+[i1]+g+[gq]*[a4e3u]+r*/, 
    /r+[e3]+t+[a4]+r+d+/,
    /f+[a4]+g+[o0]*[t7]*/,
    /k+[i1]+k+[e3]+/,
    /c+o+o+n+/,
    /b+[e3]+a+n+[e3]+r+/
  ];

  for (const pattern of regexList) {
    if (pattern.test(clean)) return true;
  }

  // 4. FUZZY MATCHING (Catches "1 letter off" variations)
  // We check against these base words
  const baseWords = ["nigger", "nigga", "retard", "faggot", "kike", "beaner", "coon"];

  // Loop through the input string to find hidden words
  // e.g. "myniggxrbuild" -> we scan for "niggxr"
  
  // NOTE: Scanning every substring is slow, so we check the whole string 
  // and specific chunks if the string is short (like a username).
  
  for (const badWord of baseWords) {
    // Optimization: Don't check if length is wildly different
    if (Math.abs(clean.length - badWord.length) > 2) {
       // If the text is long (description), we rely on Regex. 
       // Fuzzy matching is mostly for short Titles/Names.
       if (clean.length > 15) continue; 
    }

    // SAFETY CHECK: First letter MUST match.
    // "Bigger" (starts with B) vs "Nigger" (starts with N) -> Safe.
    // "Niggxr" (starts with N) vs "Nigger" (starts with N) -> BANNED.
    if (clean[0] !== badWord[0]) continue;

    const distance = getEditDistance(clean, badWord);
    
    // If only 1 character is different (or 0), BAN IT.
    if (distance <= 1) return true;
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