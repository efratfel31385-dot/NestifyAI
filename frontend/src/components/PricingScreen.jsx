import React from 'react';

const PricingScreen = ({ onBackToStudio }) => {
  const tiers = [
    {
      name: 'Basic',
      price: '₪59',
      period: '/month',
      description: 'For hobbyists who want a taste of automated design.',
      features: [
        '15 AI renders per month',
        'Basic furniture detection (up to 5 items per room)',
        'Standard color palettes only',
        'Email support (response within 48 hours)'
      ],
      buttonText: 'Start Free Trial',
      isPopular: false,
    },
    {
      name: 'Pro',
      price: '₪149',
      period: '/month',
      description: 'The perfect plan for independent interior designers and project managers.',
      features: [
        'Unlimited renders (standard model)',
        '50 photo-realistic HD renders',
        'Advanced furniture detection + coordinate mapping (Bounding Boxes)',
        'Export color palettes to CSS/Adobe files',
        'Priority support (within 4 hours)'
      ],
      buttonText: 'Upgrade to Pro',
      isPopular: true, // Visual highlight for the most popular plan
    },
    {
      name: 'Master',
      price: '₪329',
      period: '/month',
      description: 'For architecture firms and construction companies that need maximum processing power.',
      features: [
        'All Pro features, unlimited',
        '3D model export (C# to Python 3D Mesh)',
        'Direct API access to your processing server',
        'Personal account manager and 24/7 phone support',
        'Full commercial license for output usage'
      ],
      buttonText: 'Contact Enterprise',
      isPopular: false,
    }
  ];

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#FAFAFA] p-8 flex flex-col items-center justify-center animate-fade-in">
      <div className="text-center max-w-xl mb-12">
        <button 
          onClick={onBackToStudio}
          className="text-xs font-semibold text-gray-400 hover:text-gray-900 mb-4 transition-colors flex items-center justify-center mx-auto"
        >
          ← Back to Design Studio
        </button>
        <h2 className="text-3xl font-black tracking-tight text-gray-900 sm:text-4xl">Plans & Pricing</h2>
        <p className="mt-3 text-sm text-gray-500">
          Choose the plan that fits your project workload. All plans include access to our asynchronous models.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 max-w-6xl w-full px-4">
        {tiers.map((tier) => (
          <div 
            key={tier.name}
            className={`rounded-2xl p-8 flex flex-col justify-between transition-all relative ${
              tier.isPopular 
                ? 'bg-gray-900 text-white shadow-xl scale-105 lg:translate-y-[-8px] border-2 border-gray-900' 
                : 'bg-white text-gray-900 shadow-sm border border-gray-100 hover:shadow-md'
            }`}
          >
            {tier.isPopular && (
              <span className="absolute top-0 right-6 transform translate-y-[-50%] bg-[#83C5BE] text-gray-900 text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full">
                Most Popular
              </span>
            )}

            <div>
              <h3 className={`text-lg font-bold ${tier.isPopular ? 'text-white' : 'text-gray-900'}`}>{tier.name}</h3>
              <p className={`mt-2 text-xs ${tier.isPopular ? 'text-gray-400' : 'text-gray-500'}`}>{tier.description}</p>
              
              <div className="mt-6 flex items-baseline">
                <span className="text-4xl font-black tracking-tight">{tier.price}</span>
                <span className={`text-xs ml-1 ${tier.isPopular ? 'text-gray-400' : 'text-gray-500'}`}>{tier.period}</span>
              </div>

              <ul className="mt-8 space-y-4 border-t pt-6 border-gray-100/10">
                {tier.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start text-xs">
                    <span className={`ml-2.5 font-bold ${tier.isPopular ? 'text-[#83C5BE]' : 'text-gray-900'}`}>✓</span>
                    <span className={tier.isPopular ? 'text-gray-300' : 'text-gray-600'}>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            <button
              className={`mt-8 w-full font-bold py-3 px-4 rounded-xl text-xs transition-all ${
                tier.isPopular
                  ? 'bg-[#83C5BE] text-gray-900 hover:bg-[#6faeab] shadow-md active:scale-[0.98]'
                  : 'bg-gray-50 text-gray-900 border border-gray-200 hover:bg-gray-100 active:scale-[0.98]'
              }`}
            >
              {tier.buttonText}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PricingScreen;