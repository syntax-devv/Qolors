import React from 'react'
import { Link } from 'react-router-dom'
import {
  Play,
  Search,
  Image,
  CheckCircle,
  Save,
} from 'lucide-react'

import FeatureCard from '../components/FeatureCard'

const Home = () => {
  return (
    <div className="min-h-screen bg-white">
      <main className="max-w-5xl mx-auto px-6 pt-24 pb-24 text-center">
        <div className="mb-24 text-center">
          <h1 className="text-[80px] font-bold text-black leading-[70px] tracking-tight mb-6">
            The workspace for <br /> color curation.
          </h1>
          <p className="text-[17px] font-medium text-gray-500 max-w-xl mx-auto mb-10">
            Professional color tool for designers to curate, visualize, and extract perfect palettes for your next project.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/generate" className="px-8 py-3 bg-black text-white text-[15px] font-bold rounded-lg hover:bg-gray-800 transition-all shadow-sm">
              Open Generator
            </Link>
            <Link to="/explore" className="px-8 py-3 bg-white border border-gray-200 text-[15px] font-bold rounded-lg hover:bg-gray-50 transition-all">
              Explore Palettes
            </Link>
          </div>
        </div>

         <div className="mt-24 rounded-[40px] overflow-hidden shadow-2xl border border-gray-50 p-3 bg-white">
          <div className="aspect-[21/9] w-full bg-gray-50 flex overflow-hidden rounded-[32px]">
            {['#264653', '#2a9d8f', '#e9c46a', '#f4a261', '#e76f51', '#e9c46a'].map((color, i) => (
              <div key={`${color}-${i}`} className="flex-1 hover:flex-[1.5] transition-all duration-500 ease-in-out cursor-pointer group relative" style={{ backgroundColor: color }}>
                <span className="absolute bottom-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 text-white font-bold tracking-widest text-sm transition-opacity drop-shadow-md">
                  {color.toUpperCase()}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Color Highlight Section */}
        <section className="mt-40 text-left border-t border-gray-50 pt-20">
          <div className="flex items-end justify-between mb-12">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-black mb-2">Color Highlight</h2>
              <p className="text-[15px] font-medium text-gray-500 leading-relaxed">A special shade picked by our community designers for this month.</p>
            </div>
            <div className="hidden sm:block">
              <span className="px-3 py-1 bg-gray-50 text-black font-bold border border-gray-100 rounded-md text-[10px] uppercase tracking-widest">March 2024</span>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            <div
              className="h-[400px] rounded-lg flex flex-col items-center justify-center relative overflow-hidden group border border-gray-100 shadow-sm"
              style={{ backgroundColor: '#FF5E5B' }}
            >
              <h3 className="text-4xl font-bold text-white drop-shadow-sm uppercase mb-2">Coral Bliss</h3>
              <p className="text-white/80 text-[15px] font-bold tracking-widest uppercase">#FF5E5B</p>
              <button className="mt-8 px-6 py-2 bg-white text-black font-bold rounded-lg opacity-0 group-hover:opacity-100 transition-all text-sm">
                View Palette
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {['#D8E2DC', '#FFE5D9', '#FFCAD4', '#F4ACB7'].map((c, i) => (
                <div key={i} className="rounded-lg overflow-hidden border border-gray-100 p-1.5 bg-white flex flex-col transition-colors hover:border-gray-200">
                  <div className="h-full rounded-md" style={{ backgroundColor: c }} />
                  <div className="p-3 flex justify-between items-center bg-gray-50/30">
                    <span className="font-bold text-[10px] text-gray-400 uppercase tracking-widest">{c}</span>
                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: c }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-40 text-left border-t border-gray-50 pt-20">
          <div className="flex items-center justify-between mb-12">
            <h2 className="text-2xl font-bold tracking-tight text-black">Trending Designs</h2>
            <Link to="/explore" className="text-[13px] font-bold text-black hover:underline underline-offset-4 decoration-gray-300">Browse collection</Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              ['#1a535c', '#4ecdc4', '#f7fff7', '#ff6b6b', '#ffe66d'],
              ['#2b2d42', '#8d99ae', '#edf2f4', '#ef233c', '#d90429'],
              ['#003049', '#d62828', '#f77f00', '#fcbf49', '#eae2b7'],
              ['#264653', '#2a9d8f', '#e9c46a', '#f4a261', '#e76f51'],
              ['#f94144', '#f3722c', '#f8961e', '#f9c74f', '#90be6d'],
              ['#ff9f1c', '#ffbf69', '#ffffff', '#cbf3f0', '#2ec4b6']
            ].map((palette, i) => (
              <div key={i} className="rounded-lg overflow-hidden border border-gray-100 hover:border-gray-200 transition-all bg-white p-2 cursor-pointer group flex flex-col">
                <div className="h-32 w-full flex rounded-md overflow-hidden mb-3">
                  {palette.map((c, j) => (
                    <div key={j} className="flex-1" style={{ backgroundColor: c }} />
                  ))}
                </div>
                <div className="px-2 pb-1 flex items-center justify-between">
                  <span className="font-bold text-[10px] text-gray-400 uppercase tracking-widest">Trending #{i + 1}</span>
                  <Save className="text-gray-300 group-hover:text-black transition-colors" size={14} />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-40 grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          <FeatureCard
            icon={Play}
            title="Generator"
            description="Create professional color schemes in seconds."
            color="bg-black"
          />
          <FeatureCard
            icon={Search}
            title="Explore"
            description="Browse community curated palettes."
            color="bg-black"
          />
          <FeatureCard
            icon={Image}
            title="Visualizer"
            description="Simulate colors on real world components."
            color="bg-black"
          />
          <FeatureCard
            icon={CheckCircle}
            title="Contrast"
            description="Ensure designs meet global accessibility."
            color="bg-black"
          />
        </section>
      </main>

      <footer className="py-10 text-center border-t border-gray-50">
        <Link to="/" className="text-[32px] font-bold tracking-tight text-black mb-2 inline-block">
          Qolors
        </Link>
        <p className="text-[16px] font-medium text-gray-400">Professional curation tool for workspace designers.</p>
        <div className="flex items-center justify-center gap-8 mt-4">
          {['Twitter', 'Instagram', 'Pinterest', 'GitHub'].map(social => (
            <a key={social} href="#" className="text-[16px] font-bold text-gray-400 hover:text-black transition-colors">
              {social}
            </a>
          ))}
        </div>
        <p className="text-[11px] font-bold text-gray-300 uppercase tracking-widest mt-12">© 2026 Qolors</p>
      </footer>
    </div>
  )
}

export default Home
