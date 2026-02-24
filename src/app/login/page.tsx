"use client"
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

export default function Login() {
  const loginDiscord = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'discord',
      options: { redirectTo: window.location.origin }
    })
  }

  return (
    <div className="min-h-screen bg-[#0a0b10] text-white flex items-center justify-center p-6">
      <div className="bg-[#13141c] p-10 rounded-3xl border border-slate-800 w-full max-w-sm text-center shadow-2xl">
        <h1 className="text-3xl font-black mb-2 italic text-blue-500 uppercase italic">Workshop</h1>
        <p className="text-gray-500 text-xs font-bold mb-8 uppercase tracking-widest">Connect your builds</p>
        
        <button 
          onClick={loginDiscord}
          className="w-full bg-[#5865F2] hover:bg-[#4752C4] p-5 rounded-2xl font-black text-lg flex items-center justify-center gap-3 transition-all shadow-lg"
        >
          <img src="https://assets-global.website-files.com/6257adef93867e3d03400a20/633e7cdbf30627299066497f_icon_clyde_white_RGB.png" className="h-6" alt=""/>
          LOGIN WITH DISCORD
        </button>
        
        <a href="/" className="block mt-6 text-gray-600 text-[10px] font-bold uppercase hover:text-white">Back to Home</a>
      </div>
    </div>
  )
}