"use client"
import { createClient } from '@supabase/supabase-js'
import { useEffect, useState } from 'react'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
const ROOT_ADMIN = "thatonedudetsts" // Fallback access

export default function AdminPage() {
  const [categories, setCategories] = useState<any[]>([])
  const [bannedUsers, setBannedUsers] = useState<any[]>([])
  const [staff, setStaff] = useState<any[]>([])
  const [newCat, setNewCat] = useState('')
  const [staffId, setStaffId] = useState('')
  const [staffName, setStaffName] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [currentUserRole, setCurrentUserRole] = useState('')

  useEffect(() => {
    checkAuth()
  }, [])

  async function checkAuth() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { window.location.href = "/"; return }

    const discordID = user.user_metadata.provider_id
    const discordName = user.user_metadata.full_name || user.user_metadata.custom_claims?.global_name
    
    // Check DB for role
    const { data: roleData } = await supabase.from('user_roles').select('role').eq('discord_id', discordID).single()
    
    // Allow if DB Admin OR Hardcoded Root Admin
    if (roleData?.role === 'admin' || discordName === ROOT_ADMIN) {
        setCurrentUserRole('admin')
        fetchData()
        setIsLoading(false)
    } else {
        window.location.href = "/"
    }
  }

  async function fetchData() {
    const { data: cData } = await supabase.from('categories').select('*').order('name', { ascending: true })
    if (cData) setCategories(cData)

    const { data: bData } = await supabase.from('banned_users').select('*').order('banned_at', { ascending: false })
    if (bData) setBannedUsers(bData)

    const { data: sData } = await supabase.from('user_roles').select('*')
    if (sData) setStaff(sData)
  }

  // --- CATEGORIES ---
  async function addCategory() {
    if (!newCat) return
    await supabase.from('categories').insert([{ name: newCat }])
    setNewCat(''); fetchData()
  }
  async function deleteCategory(id: number) {
    if(confirm("Delete this category?")) {
        await supabase.from('categories').delete().eq('id', id); fetchData()
    }
  }

  // --- STAFF ---
  async function addStaff(role: 'admin' | 'mod') {
    if (!staffId || !staffName) return alert("Need Discord ID and Name")
    const { error } = await supabase.from('user_roles').upsert([{ discord_id: staffId, username: staffName, role: role }])
    if (error) alert(error.message)
    else { setStaffId(''); setStaffName(''); fetchData() }
  }
  async function removeStaff(id: string) {
    if(confirm("Remove this person from staff?")) {
        await supabase.from('user_roles').delete().eq('discord_id', id); fetchData()
    }
  }

  // --- BANS ---
  async function unbanUser(id: string) {
    if(confirm("Unban this user?")) {
        await supabase.from('banned_users').delete().eq('discord_id', id); fetchData()
    }
  }

  if (isLoading) return <div className="min-h-screen bg-[#0a0b10] flex items-center justify-center text-white font-black">VERIFYING CLEARANCE...</div>

  return (
    <div className="min-h-screen bg-[#06070a] text-white p-8 md:p-16 font-sans">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-12">
            <h1 className="text-4xl font-black italic text-blue-500 uppercase tracking-tighter">Command Center</h1>
            <a href="/" className="bg-slate-900 px-6 py-3 rounded-2xl font-bold text-xs hover:bg-slate-800 transition-all">EXIT</a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* CATEGORY MANAGER */}
            <div className="bg-[#111218] border border-slate-800 p-8 rounded-[40px] shadow-2xl">
                <h2 className="text-xl font-black text-gray-500 uppercase tracking-widest mb-6">Categories</h2>
                <div className="flex gap-4 mb-6">
                    <input value={newCat} onChange={e => setNewCat(e.target.value)} placeholder="Name..." className="flex-grow bg-[#06070a] border border-slate-800 p-3 rounded-2xl outline-none focus:border-blue-500 font-bold text-sm" />
                    <button onClick={addCategory} className="bg-blue-600 px-6 rounded-2xl font-black text-xs hover:bg-blue-500">ADD</button>
                </div>
                <div className="flex flex-wrap gap-2">
                    {categories.map(c => (
                        <div key={c.id} className="bg-[#06070a] border border-slate-800 px-3 py-2 rounded-xl flex items-center gap-2 font-bold text-xs">
                            {c.name} <button onClick={() => deleteCategory(c.id)} className="text-red-500 hover:text-white">×</button>
                        </div>
                    ))}
                </div>
            </div>

            {/* STAFF MANAGER */}
            <div className="bg-[#111218] border border-blue-900/30 p-8 rounded-[40px] shadow-2xl">
                <h2 className="text-xl font-black text-blue-500 uppercase tracking-widest mb-6">Staff Team</h2>
                <div className="flex flex-col gap-3 mb-6">
                    <input value={staffName} onChange={e => setStaffName(e.target.value)} placeholder="Username (for display)" className="bg-[#06070a] border border-slate-800 p-3 rounded-2xl outline-none text-sm" />
                    <input value={staffId} onChange={e => setStaffId(e.target.value)} placeholder="Discord ID (Right click user -> Copy ID)" className="bg-[#06070a] border border-slate-800 p-3 rounded-2xl outline-none text-sm font-mono" />
                    <div className="flex gap-2">
                        <button onClick={() => addStaff('admin')} className="flex-1 bg-red-600 py-3 rounded-xl font-black text-xs hover:bg-red-500">MAKE ADMIN</button>
                        <button onClick={() => addStaff('mod')} className="flex-1 bg-green-600 py-3 rounded-xl font-black text-xs hover:bg-green-500">MAKE MOD</button>
                    </div>
                </div>
                <div className="space-y-2">
                    {staff.map(s => (
                        <div key={s.discord_id} className="bg-[#06070a] border border-slate-800 p-3 rounded-xl flex justify-between items-center">
                            <div>
                                <span className={`text-[10px] font-black px-2 py-1 rounded mr-2 ${s.role === 'admin' ? 'bg-red-500 text-black' : 'bg-green-500 text-black'}`}>{s.role.toUpperCase()}</span>
                                <span className="font-bold text-sm">{s.username}</span>
                            </div>
                            <button onClick={() => removeStaff(s.discord_id)} className="text-gray-500 hover:text-white text-xs font-bold">REMOVE</button>
                        </div>
                    ))}
                </div>
            </div>
        </div>

        {/* BANNED USERS */}
        <div className="bg-[#111218] border border-red-900/30 p-8 rounded-[40px] shadow-2xl mt-8">
            <h2 className="text-xl font-black text-red-500 uppercase tracking-widest mb-6">Banned Users</h2>
            <div className="space-y-2">
                {bannedUsers.map(u => (
                    <div key={u.discord_id} className="bg-[#06070a] border border-slate-800 p-3 rounded-xl flex justify-between items-center">
                        <span className="font-bold text-sm text-gray-400">{u.username} <span className="font-mono text-[10px] text-gray-600">({u.discord_id})</span></span>
                        <button onClick={() => unbanUser(u.discord_id)} className="text-red-500 font-black text-[10px] hover:text-white">UNBAN</button>
                    </div>
                ))}
            </div>
        </div>
      </div>
    </div>
  )
}