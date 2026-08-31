import React from 'react';
import { useNavigate } from 'react-router-dom';
import { PublicNavbar } from '../components/common/PublicNavbar';
import { StateEmblem } from '../components/common/StateEmblem';
import { ShieldCheck, ArrowRight } from '../components/common/Icons';

export const Home: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#FBFBF9] text-slate-900 font-serif w-full max-w-full overflow-x-hidden">
      <PublicNavbar />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-[#0A2540] via-[#002B49] to-[#0A2540] text-white py-14 px-4 sm:px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center space-x-2 bg-amber-500/20 text-amber-300 border border-amber-500/30 px-3.5 py-1 rounded-full text-xs font-sans font-bold">
              <ShieldCheck size={16} />
              <span>MoSPI Official Infrastructure Monitoring Portal</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black leading-tight tracking-tight font-serif text-white">
              Members of Parliament <br />
              <span className="text-amber-400">Local Area Development Scheme</span>
            </h1>

            <p className="text-slate-200 text-xs sm:text-sm font-sans leading-relaxed max-w-2xl">
              NIRMAN leverages Machine Learning and Advanced Data Analytics to audit public asset creation, detect price anomalies, inspect geotagged evidence, and streamline multi-tier authority decision-making.
            </p>

            <div className="flex flex-wrap gap-4 pt-2 font-sans text-xs font-bold">
              <button 
                onClick={() => navigate('/login')} 
                className="bg-[#E65100] hover:bg-[#c64500] text-white px-6 py-3 rounded-lg shadow-lg flex items-center space-x-2 transition"
              >
                <span>ACCESS AUTHORITY DASHBOARD</span>
                <ArrowRight size={16} />
              </button>
              <a 
                href="#about-mplads" 
                className="bg-white/10 hover:bg-white/20 text-white border border-white/30 px-6 py-3 rounded-lg transition"
              >
                EXPLORE SCHEME DETAILS
              </a>
            </div>
          </div>

          <div className="lg:col-span-5 flex flex-col items-center justify-center">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-8 text-center space-y-4 shadow-2xl">
              <StateEmblem size={72} darkBg={true} className="mx-auto" />
              <h3 className="text-xl font-bold font-serif text-white">Govt. of India Scheme Benchmark</h3>
              <div className="grid grid-cols-2 gap-3 text-xs font-sans">
                <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-700">
                  <span className="text-amber-400 font-black text-xl">₹5 Crore</span>
                  <p className="text-slate-300 text-[10px] mt-0.5">Annual Fund Per MP</p>
                </div>
                <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-700">
                  <span className="text-emerald-400 font-black text-xl">788 MPs</span>
                  <p className="text-slate-300 text-[10px] mt-0.5">Lok Sabha & Rajya Sabha</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4 Sign In Gateway Portals */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12 -mt-6 relative z-20 font-sans">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div onClick={() => navigate('/login?role=MINISTER')} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-md hover:shadow-xl transition cursor-pointer space-y-3 group border-t-4 border-t-amber-500">
            <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xl">
              👔
            </div>
            <h3 className="font-bold text-slate-900 text-base group-hover:text-amber-700 transition">1. Hon'ble Minister Portal</h3>
            <p className="text-slate-600 text-xs leading-relaxed">Executive policy oversight, national subvention metrics, and high-impact briefings.</p>
            <span className="text-amber-700 font-bold text-xs inline-flex items-center space-x-1">
              <span>Minister Sign In</span> <ArrowRight size={14} />
            </span>
          </div>

          <div onClick={() => navigate('/login?role=MINISTRY')} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-md hover:shadow-xl transition cursor-pointer space-y-3 group border-t-4 border-t-blue-600">
            <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-xl">
              🏛️
            </div>
            <h3 className="font-bold text-slate-900 text-base group-hover:text-blue-700 transition">2. Ministry (MoSPI) Ops</h3>
            <p className="text-slate-600 text-xs leading-relaxed">National Risk Intelligence radar, India risk map, vendor cartels, and anomaly analytics.</p>
            <span className="text-blue-700 font-bold text-xs inline-flex items-center space-x-1">
              <span>Ministry Sign In</span> <ArrowRight size={14} />
            </span>
          </div>

          <div onClick={() => navigate('/login?role=STATE')} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-md hover:shadow-xl transition cursor-pointer space-y-3 group border-t-4 border-t-emerald-600">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xl">
              🏢
            </div>
            <h3 className="font-bold text-slate-900 text-base group-hover:text-emerald-700 transition">3. State Nodal Authority</h3>
            <p className="text-slate-600 text-xs leading-relaxed">State-wide district monitoring, escalated investigation reviews, and sub-plan compliance.</p>
            <span className="text-emerald-700 font-bold text-xs inline-flex items-center space-x-1">
              <span>State Sign In</span> <ArrowRight size={14} />
            </span>
          </div>

          <div onClick={() => navigate('/login?role=DISTRICT')} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-md hover:shadow-xl transition cursor-pointer space-y-3 group border-t-4 border-t-purple-600">
            <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center font-bold text-xl">
              📍
            </div>
            <h3 className="font-bold text-slate-900 text-base group-hover:text-purple-700 transition">4. District Collector (DC)</h3>
            <p className="text-slate-600 text-xs leading-relaxed">Field inspection queues, local project evidence verification, and case actions.</p>
            <span className="text-purple-700 font-bold text-xs inline-flex items-center space-x-1">
              <span>District Sign In</span> <ArrowRight size={14} />
            </span>
          </div>
        </div>
      </section>

      {/* About MPLADS Scheme Section */}
      <section id="about-mplads" className="max-w-7xl mx-auto px-4 sm:px-6 py-12 space-y-8 border-t border-slate-200 font-sans">
        <div className="text-center max-w-3xl mx-auto space-y-2">
          <span className="text-xs font-extrabold text-[#E65100] tracking-widest uppercase">Central Sector Scheme Overview</span>
          <h2 className="text-3xl font-black text-[#0A2540] font-serif">What is the MPLADS Scheme?</h2>
          <p className="text-slate-600 text-xs leading-relaxed">
            The Members of Parliament Local Area Development Scheme (MPLADS) is administered by MoSPI to enable Hon'ble Members of Parliament to recommend works of developmental nature for community asset creation.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-2">
            <h3 className="font-bold text-sm text-[#0A2540]">₹5 Crore Annual Allocation</h3>
            <p className="text-slate-600">Each MP receives ₹5 Crore per annum released in two equal installments of ₹2.5 Crore directly to District Authorities.</p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-2">
            <h3 className="font-bold text-sm text-[#0A2540]">Mandatory SC/ST Sub-plans</h3>
            <p className="text-slate-600">MPs must allocate at least <strong>15%</strong> of funds for Scheduled Caste (SC) areas and <strong>7.5%</strong> for Scheduled Tribe (ST) areas annually.</p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-2">
            <h3 className="font-bold text-sm text-[#0A2540]">Durable Asset Creation</h3>
            <p className="text-slate-600">Focuses on durable community assets: drinking water, primary education, public health, sanitation, and rural roads.</p>
          </div>
        </div>
      </section>

      {/* About Us Section */}
      <section id="about-us" className="bg-[#0A2540] text-white py-12 px-6 font-sans">
        <div className="max-w-7xl mx-auto text-center space-y-4">
          <h2 className="text-2xl font-bold font-serif text-white">About NIRMAN & MoSPI Innovation</h2>
          <p className="text-slate-300 text-xs max-w-2xl mx-auto leading-relaxed">
            NIRMAN (National Infra Reporting & Monitoring Analytics Network) was engineered for the Smart India Hackathon (SIH 2026) in partnership with the Data Informatics & Innovation Division (DIID) of MoSPI.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-6 px-6 text-center text-xs font-sans border-t border-slate-800">
        NIRMAN Portal © 2026 Ministry of Statistics and Programme Implementation (MoSPI), Government of India.
      </footer>
    </div>
  );
};
