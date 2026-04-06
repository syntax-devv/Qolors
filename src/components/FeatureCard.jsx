import React from 'react'

const FeatureCard = ({ icon: Icon, title, description, color }) => (
  <div className="p-8 bg-white rounded-lg border border-gray-100 hover:border-black/5 hover:bg-gray-50/30 transition-all text-left">
    <div className={`w-10 h-10 ${color} rounded-md flex items-center justify-center mb-6`}>
      <Icon className="text-white" size={18} />
    </div>
    <h3 className="text-[17px] font-bold text-black mb-2 tracking-tight">{title}</h3>
    <p className="text-[14px] text-gray-500 leading-relaxed font-medium">{description}</p>
  </div>
)

export default FeatureCard
