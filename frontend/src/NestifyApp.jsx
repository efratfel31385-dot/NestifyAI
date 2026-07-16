import React, { useState, useEffect } from 'react';
import LoginModal from './components/LoginModal';
import PricingScreen from './components/PricingScreen';
import { COLOR_PALETTES } from './constants/palettes';
import { generateDesignAdvice } from './apiService';

const App = () => {
  const [description, setDescription] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [selectedPalette, setSelectedPalette] = useState('');
  const [loading, setLoading] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [authToken, setAuthToken] = useState(localStorage.getItem('token'));
  const [userName, setUserName] = useState(localStorage.getItem('fullName') || '');
  const [budget, setBudget] = useState(1500);
  const [aiRecommendation, setAiRecommendation] = useState("");
  const [furnitureResults, setFurnitureResults] = useState([]);
  const [roomWidth, setRoomWidth] = useState('');
  const [roomLength, setRoomLength] = useState('');
  // Room type, used only for an empty room
  const [roomType, setRoomType] = useState('');

  // App views: 'studio', 'pricing', 'history', 'admin_promote', 'admin_users'
  const [currentView, setCurrentView] = useState('studio');

  // Controls the Admin Dropdown menu state
  const [isAdminMenuOpen, setIsAdminMenuOpen] = useState(false);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);

  // Mock users data for Admin panels
  const [users, setUsers] = useState([]);

  useEffect(() => {
    fetch('https://localhost:7227/api/Users/all')
      .then(res => res.json())
      .then(data => setUsers(data))
      .catch(err => console.error('Error loading users:', err));
  }, []);

  const [historyItems, setHistoryItems] = useState([]);

  // Updates user tier in state
  const handleTierChange = async (userId, newTier) => {
    try {
      const response = await fetch(`https://localhost:7227/api/Users/tier/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTier)
      });
      if (!response.ok) throw new Error('Failed');
      setUsers(users.map(u => u.id === userId ? { ...u, tier: newTier } : u));
      alert(`User tier successfully updated to ${newTier}!`);
    } catch (err) {
      alert('Error updating tier.');
    }
  };

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (imagePreview) URL.revokeObjectURL(imagePreview);
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  useEffect(() => {
    const userId = localStorage.getItem('token');
    if (userId && currentView === 'history') {
      fetch(`https://localhost:7227/api/Design/history/${userId}`)
        .then(res => res.json())
        .then(data => setHistoryItems(data))
        .catch(err => console.error('Error loading history:', err));
    }
  }, [currentView]);

  const handleAdminClick = (view) => {
    if (!isAdminAuthenticated) {
      const password = prompt('Enter admin password:');
      if (password === '123456') {
        setIsAdminAuthenticated(true);
        setCurrentView(view);
        setIsAdminMenuOpen(false);
      } else {
        alert('Incorrect password.');
      }
    } else {
      setCurrentView(view);
      setIsAdminMenuOpen(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!imageFile) {
      alert('Please upload a source image before running analysis.');
      return;
    }
    if (!authToken) {          // Check that the user is logged in
      setIsLoginOpen(true);
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('image', imageFile);
    formData.append('style', selectedPalette || 'Modern');
    formData.append('description', description);
    formData.append('Budget', budget);
    const userId = localStorage.getItem('token') || 0;
    formData.append('UserId', userId);

    formData.append('TotalRoomArea', parseFloat(roomWidth || 0) * parseFloat(roomLength || 0));
    formData.append('Width', parseFloat(roomWidth || 0));
    formData.append('Length', parseFloat(roomLength || 0));

    // Send room type to the server
    formData.append('RoomType', roomType);

    try {
      setFurnitureResults([]);
      setAiRecommendation('');
      const response = await fetch('https://localhost:7227/api/Design/process', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error(`Server Error: ${response.status}`);
      const result = await response.json();

      console.log('Results:', result);
      if (result.furniture) {
        setFurnitureResults(result.furniture);
      }
      if (result.ai_recommendation) {
        setAiRecommendation(result.ai_recommendation);
      }

      alert('Processing complete!');
    } catch (error) {
      console.error(error);
      alert('API server connection failure occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FBFBFB] flex flex-col font-sans text-gray-900 antialiased">

      {/* Navbar Layout */}
      <nav className="w-full h-16 bg-white border-b border-gray-100 px-8 flex justify-between items-center sticky top-0 z-40 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2.5 cursor-pointer" onClick={() => { setCurrentView('studio'); setIsAdminMenuOpen(false); }}>
            <div className="w-8 h-8 rounded-lg bg-gray-900 flex items-center justify-center text-white font-black text-sm">N</div>
            <span className="text-lg font-black tracking-tight text-gray-900">Nestify<span className="text-[#83C5BE]">.ai</span></span>
          </div>

          {/* Internal Navigation Links */}
          <div className="hidden md:flex items-center space-x-1.5 text-xs font-semibold text-gray-400">
            <button
              onClick={() => { setCurrentView('studio'); setIsAdminMenuOpen(false); }}
              className={`px-3 py-1.5 rounded-lg transition-colors ${currentView === 'studio' ? 'text-gray-900 bg-gray-50' : 'hover:text-gray-600'}`}
            >
              Studio Workspace
            </button>
            <button
              onClick={() => { setCurrentView('pricing'); setIsAdminMenuOpen(false); }}
              className={`px-3 py-1.5 rounded-lg transition-colors ${currentView === 'pricing' ? 'text-gray-900 bg-gray-50' : 'hover:text-gray-600'}`}
            >
              Pricing Plans
            </button>
            <button
              onClick={() => { setCurrentView('history'); setIsAdminMenuOpen(false); }}
              className={`px-3 py-1.5 rounded-lg transition-colors ${currentView === 'history' ? 'text-gray-900 bg-gray-50' : 'hover:text-gray-600'}`}
            >
              Recommendation History
            </button>

            <span className="text-gray-200 px-1">|</span>

            {/* Admin Controls Trigger Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsAdminMenuOpen(!isAdminMenuOpen)}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center space-x-1 border font-bold ${
                  currentView.startsWith('admin_')
                    ? 'text-teal-700 bg-teal-50 border-teal-200'
                    : 'text-gray-500 border-transparent hover:bg-gray-50 hover:text-gray-700'
                }`}
              >
                <span>Admin Panel</span>
                <span className="text-[10px]">{isAdminMenuOpen ? '▲' : '▼'}</span>
              </button>

              {/* Dropdown Options */}
              {isAdminMenuOpen && (
                <div className="absolute left-0 mt-2 w-48 bg-white border border-gray-100 rounded-xl shadow-lg py-1.5 z-50 animate-fadeIn">
                  <button
                    onClick={() => handleAdminClick('admin_promote')}
                    className={`w-full text-left px-4 py-2 text-xs font-semibold block transition-colors ${currentView === 'admin_promote' ? 'text-teal-600 bg-teal-50/50' : 'text-gray-600 hover:bg-gray-50'}`}
                  >
                    ✦ Promote User Tier
                  </button>
                  <button
                    onClick={() => handleAdminClick('admin_users')}
                    className={`w-full text-left px-4 py-2 text-xs font-semibold block transition-colors ${currentView === 'admin_users' ? 'text-teal-600 bg-teal-50/50' : 'text-gray-600 hover:bg-gray-50'}`}
                  >
                    📊 Monitor User Data
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {authToken ? (
            <div className="flex items-center space-x-4">
              <span className="flex items-center text-[11px] font-mono text-gray-500 bg-gray-50 px-2.5 py-1 rounded-md border border-gray-100">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full ml-1.5 animate-pulse"></span>
                {userName || 'Guest'}
              </span>
              <button
                onClick={() => { localStorage.removeItem('token'); setAuthToken(null); setCurrentView('studio'); setIsAdminMenuOpen(false); }}
                className="text-xs text-red-400 hover:text-red-600 transition-colors font-medium cursor-pointer"
              >
                Logout
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsLoginOpen(true)}
              className="bg-gray-950 text-white text-xs px-4 py-2 rounded-xl font-bold hover:bg-gray-800 transition-all cursor-pointer"
            >
              Sign In
            </button>
          )}
        </div>
      </nav>

      {/* Conditional Rendering of Application Views */}
      {currentView === 'pricing' ? (
        <PricingScreen onBackToStudio={() => setCurrentView('studio')} />
      ) : currentView === 'history' ? (

        /* Recommendation History View */
        <div className="flex-1 p-8 max-w-4xl mx-auto w-full">
          <div className="mb-6">
            <h1 className="text-xl font-black text-gray-900 tracking-tight">Saved Analysis History</h1>
            <p className="text-xs text-gray-400">Review your past room transformations and knapsack budget optimizations</p>
          </div>
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gray-50/70 border-b border-gray-100 text-[10px] font-bold uppercase tracking-wider text-gray-400 font-mono">
                  <th className="p-4">Scan ID</th>
                  <th className="p-4">Timestamp</th>
                  <th className="p-4">Target Style</th>
                  <th className="p-4">Budget Constraint</th>
                  <th className="p-4">Selected Items</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 font-medium text-gray-700">
                {historyItems.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50/40 transition-colors">
                    <td className="p-4 font-mono text-gray-400">#00{item.id}</td>
                    <td className="p-4 text-gray-500">{item.date}</td>
                    <td className="p-4">
                      <span className="px-2 py-0.5 bg-gray-900 text-white font-bold text-[10px] rounded-md">{item.style}</span>
                    </td>
                    <td className="p-4 font-mono text-gray-900">₪{item.budget}</td>
                    <td className="p-4 text-gray-500">{item.itemsCount} products picked</td>
                    <td className="p-4 text-right">
                      <button type="button" onClick={() => alert(`Restoring asset parameters...`)} className="text-[#83C5BE] hover:text-teal-600 font-bold transition-colors">Restore Asset</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      ) : currentView === 'admin_promote' ? (

        /* Admin View 1: User Promotion Management */
        <div className="flex-1 p-8 max-w-4xl mx-auto w-full">
          <div className="mb-6">
            <span className="text-[10px] bg-teal-50 text-teal-700 font-bold px-2 py-1 rounded-md">SYSTEM ADMIN CONSOLE</span>
            <h1 className="text-xl font-black text-gray-900 tracking-tight mt-2">Manage User Subscription Tiers</h1>
            <p className="text-xs text-gray-400">Update system permission structures for customer nodes (Basic, Pro, Master)</p>
          </div>
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gray-50/70 border-b border-gray-100 text-[10px] font-bold text-gray-400">
                  <th className="p-4">User ID</th>
                  <th className="p-4">Full Name</th>
                  <th className="p-4">Email Node</th>
                  <th className="p-4">Current Tier</th>
                  <th className="p-4 text-right">Target Upgrade Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 font-medium text-gray-700">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50/40">
                    <td className="p-4 font-mono text-gray-400">#{user.id}</td>
                    <td className="p-4 font-bold text-gray-900">{user.name}</td>
                    <td className="p-4 font-mono text-gray-500">{user.email}</td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md ${
                        user.tier === 'Master' ? 'bg-purple-100 text-purple-700' :
                        user.tier === 'Pro' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                      }`}>{user.tier}</span>
                    </td>
                    <td className="p-4 text-right flex items-center justify-end space-x-2">
                      <button onClick={() => handleTierChange(user.id, 'Basic')} className="px-2 py-1 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-600 rounded-lg text-[10px] font-bold">Basic</button>
                      <button onClick={() => handleTierChange(user.id, 'Pro')} className="px-2 py-1 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-600 rounded-lg text-[10px] font-bold">Pro ⚡</button>
                      <button onClick={() => handleTierChange(user.id, 'Master')} className="px-2 py-1 bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-600 rounded-lg text-[10px] font-bold">Master 🔥</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      ) : currentView === 'admin_users' ? (

        /* Admin View 2: Monitor User System Metrics */
        <div className="flex-1 p-8 max-w-4xl mx-auto w-full">
          <div className="mb-6">
            <span className="text-[10px] bg-teal-50 text-teal-700 font-bold px-2 py-1 rounded-md">SYSTEM ADMIN CONSOLE</span>
            <h1 className="text-xl font-black text-gray-900 tracking-tight mt-2">Database Registered Users</h1>
            <p className="text-xs text-gray-400">Track pipeline telemetry, engagement indexes, and neural processing counter limits</p>
          </div>
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gray-50/70 border-b border-gray-100 text-[10px] font-bold text-gray-400">
                  <th className="p-4">System Identity</th>
                  <th className="p-4">Account Holder</th>
                  <th className="p-4">Email Endpoint</th>
                  <th className="p-4">Registration Epoch</th>
                  <th className="p-4">Total Space Evaluations</th>
                  <th className="p-4 text-right">Network Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 font-medium text-gray-700">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50/40">
                    <td className="p-4 font-mono text-gray-400">USER_{user.id}</td>
                    <td className="p-4 font-bold text-gray-800">{user.name}</td>
                    <td className="p-4 font-mono text-gray-500">{user.email}</td>
                    <td className="p-4 text-gray-500">{user.joined}</td>
                    <td className="p-4 font-mono font-bold text-gray-900">{user.scansCount} AI Scans</td>
                    <td className="p-4 text-right">
                      <span className="inline-flex items-center text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-md">
                        <span className="w-1 h-1 bg-green-500 rounded-full mr-1 animate-pulse"></span>
                        Active
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      ) : (
        /* Core Studio Workspace View */
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 h-[calc(100vh-4rem)] overflow-hidden">
          <aside className="lg:col-span-4 bg-white border-l border-gray-100 p-6 overflow-y-auto flex flex-col justify-between">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <h2 className="text-md font-bold text-gray-900 tracking-tight">System Controls</h2>
                <p className="text-[11px] text-gray-400">Configure visual generation pipeline</p>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Prompt Blueprint</label>
                <textarea
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-1 focus:ring-gray-900 outline-none transition-all text-xs resize-none font-medium text-gray-700"
                  rows="4"
                  placeholder="Describe architecture style, materials, shadow maps..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="mt-4">
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Max Budget Constraint ($)</label>
                <input
                  type="number"
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-1 focus:ring-gray-900 outline-none transition-all text-xs font-medium text-gray-700"
                  placeholder="Enter token maximum for knapsack solver..."
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                />
              </div>

              {/* Room dimensions */}
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Room Length (m)</label>
                  <input
                    type="number"
                    step="0.1"
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-1 focus:ring-gray-900 outline-none transition-all text-xs font-medium text-gray-700"
                    placeholder="e.g., 4.5"
                    value={roomLength}
                    onChange={(e) => setRoomLength(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Room Width (m)</label>
                  <input
                    type="number"
                    step="0.1"
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-1 focus:ring-gray-900 outline-none transition-all text-xs font-medium text-gray-700"
                    placeholder="e.g., 3.2"
                    value={roomWidth}
                    onChange={(e) => setRoomWidth(e.target.value)}
                  />
                </div>
              </div>

              {/* Room type, used only for an empty room */}
              <div className="mt-4">
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Room Type</label>
                <p className="text-[10px] text-amber-500 font-semibold mb-1.5">⚠ For an empty room only</p>
                <select
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-1 focus:ring-gray-900 outline-none transition-all text-xs font-medium text-gray-700"
                  value={roomType}
                  onChange={(e) => setRoomType(e.target.value)}
                >
                  <option value="">— No Selection (existing room) —</option>
                  <option value="parents">Parents Bedroom</option>
                  <option value="kids">Kids Bedroom</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Color Tokens</label>
                <div className="grid grid-cols-1 gap-1.5 max-h-40 overflow-y-auto pr-1">
                  {COLOR_PALETTES.map((palette) => (
                    <div
                      key={palette.id}
                      onClick={() => setSelectedPalette(palette.id)}
                      className={`cursor-pointer p-2.5 border rounded-xl flex items-center justify-between transition-all ${
                        selectedPalette === palette.id ? 'border-gray-900 bg-gray-50' : 'border-gray-100 bg-white hover:border-gray-200'
                      }`}
                    >
                      <span className="text-[11px] font-semibold text-gray-700">{palette.name}</span>
                      <div className="flex space-x-1">
                        {palette.colors.map((color, idx) => (
                          <div key={idx} className="w-4 h-4 rounded border border-black/5" style={{ backgroundColor: color }} />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Input Context</label>
                <label className="flex items-center justify-center w-full p-4 border border-dashed border-gray-200 rounded-xl bg-gray-50 hover:bg-gray-100 transition-all cursor-pointer">
                  <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                  <span className="text-xs text-gray-500 font-semibold">
                    {imageFile ? '✓ Visual asset stream initialized' : 'Upload Source Image'}
                  </span>
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`w-full text-white text-xs font-bold py-3.5 rounded-xl transition-all ${
                  loading ? 'bg-gray-300 cursor-not-allowed' : 'bg-gray-950 hover:bg-gray-800'
                }`}
              >
                {loading ? 'Processing Model Streams...' : 'Render Workspace Layout'}
              </button>
            </form>

            <footer className="text-center pt-4 text-[10px] text-gray-400 border-t border-gray-50 mt-6 font-mono">
              NESTIFY_CORE_V2.0.0 // PRODUCTION
            </footer>
          </aside>

          <main className="lg:col-span-8 bg-[#F4F4F6] p-8 flex flex-col items-center justify-start relative overflow-y-auto">
            {imagePreview ? (
              <div className="w-full max-w-3xl bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200/40 relative" style={{ maxHeight: '45vh' }}>
                <img src={imagePreview} alt="Workspace Context" className="w-full h-full object-contain bg-gray-950" />
                <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-sm text-gray-900 px-2.5 py-1 rounded-md text-[10px] font-mono border border-gray-100">
                  VIEW: SOURCE_ASSET
                </div>
              </div>
            ) : (
              <div className="text-center">
                <div className="w-12 h-12 bg-white rounded-xl mx-auto flex items-center justify-center mb-3 shadow-sm text-sm">🔲</div>
                <h3 className="text-xs font-bold text-gray-800">Canvas Vacant</h3>
                <p className="text-[11px] text-gray-400 mt-0.5">Initialize visual context by loading a source image asset.</p>
              </div>
            )}

            {/* Furniture results and AI recommendation */}
            {(aiRecommendation || furnitureResults.length > 0) && (
              <div className="mt-6 w-full max-w-3xl space-y-4 animate-fadeIn">

                {/* AI recommendation */}
                {aiRecommendation && (
                  <div className="p-5 bg-white border border-teal-100 rounded-xl shadow-sm">
                    <h4 className="font-black text-teal-800 text-xs mb-2">✦ AI Design Recommendations</h4>
                    <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-wrap">{aiRecommendation}</p>
                  </div>
                )}

                {/* Furniture list */}
                {furnitureResults.length > 0 && (
                  <div className="p-5 bg-white border border-gray-100 rounded-xl shadow-sm">
                    <h4 className="font-black text-gray-900 text-xs mb-3">🛋 Recommended Replacements</h4>
                    <div className="space-y-3">
                      {furnitureResults.map((item, index) => (
                        <div key={index} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg border border-gray-100">

                          {/* Image */}
                          {item.linkToBuy && (
                            <img
                              src={item.linkToBuy}
                              alt={item.name}
                              className="w-16 h-16 object-cover rounded-lg border border-gray-200 flex-shrink-0"
                              onError={(e) => e.target.style.display = 'none'}
                            />
                          )}

                          {/* Item details */}
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-gray-900 truncate">{item.name}</p>
                            <p className="text-[11px] text-gray-500 mt-0.5">{item.furnitureType}</p>
                            <p className="text-[11px] text-gray-400">
                              {item.answer?.color} · {item.answer?.material}
                            </p>
                           {item.linkToBuy ? (
                            <a
                            href={item.linkToBuy}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[11px] text-teal-600 font-semibold mt-1 hover:underline"
                            >
                            Buy on Amazon 🛒
                               </a>
                              ) : null}
                          </div>

                          {/* Price */}
                          <div className="text-right flex-shrink-0">
                            <p className="text-sm font-black text-gray-900">${item.price}</p>
                          </div>

                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            )}
          </main>
        </div>
      )}

      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onLoginSuccess={(token, name) => {
          setAuthToken(token);
          setUserName(name);
        }}
      />
    </div>
  );
};

export default App;