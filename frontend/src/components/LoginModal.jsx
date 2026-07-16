import React, { useState } from 'react';

const LoginModal = ({ isOpen, onClose, onLoginSuccess }) => {
  const [isRegister, setIsRegister] = useState(false); // true = register mode, false = login mode

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    if (isRegister && password !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      setLoading(false);
      return;
    }
    if (isRegister && !/^[a-zA-Z0-9\s]+$/.test(fullName)) {
    setErrorMsg('Please enter your full name in English only.');
    setLoading(false);
    return;
}

    // Our C# backend server address
    const endpoint = isRegister ? 'register' : 'login';
    const url = `https://localhost:7227/api/Users/${endpoint}`;

    const payload = isRegister 
        ? { fullName, email, password } 
        : { email, password };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || (isRegister ? 'Registration failed' : 'Invalid login credentials'));
      }

      if (isRegister) {
        setSuccessMsg('Registration successful! You can now log in.');
        setIsRegister(false);
        setFullName('');
        setPassword('');
        setConfirmPassword('');
      } else {
        // Backend currently returns userId and fullName (token support planned)
        localStorage.setItem('token', data.userId);
        localStorage.setItem('fullName', data.fullName); // Using the ID as a temporary token until JWT is added
        onLoginSuccess(data.userId, data.fullName);
        onClose();
      }

    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    alert('This will redirect to Google for an Identity Token, which is then sent to the C# server for verification.');
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-2xl max-w-md w-full shadow-2xl relative border border-gray-100">
        
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">✕</button>

        <h2 className="text-2xl font-bold mb-2 text-[#3A3F44]">
          {isRegister ? 'Create an Account' : 'Welcome Back'}
        </h2>
        <p className="text-sm text-gray-400 mb-6">
          {isRegister ? 'Sign up to start designing' : 'Log in to manage your interior projects'}
        </p>

        {errorMsg && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100">
            {errorMsg}
          </div>
        )}
        
        {successMsg && (
          <div className="mb-4 p-3 bg-green-50 text-green-700 text-sm rounded-xl border border-green-100">
            {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {isRegister && (
            <div className="animate-fade-in">
              <label className="block text-sm font-medium text-gray-600 mb-1">Full Name</label>
              <input 
                type="text" required value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full p-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#83C5BE] transition-all"
                placeholder="John Doe"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Email Address</label>
            <input 
              type="email" required value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#83C5BE] transition-all"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Password</label>
            <input 
              type="password" required value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#83C5BE] transition-all"
              placeholder="••••••••"
              minLength="6"
            />
          </div>

          {isRegister && (
            <div className="animate-fade-in">
              <label className="block text-sm font-medium text-gray-600 mb-1">Confirm Password</label>
              <input 
                type="password" required value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full p-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#83C5BE] transition-all"
                placeholder="••••••••"
                minLength="6"
              />
            </div>
          )}

          <button
            type="submit" disabled={loading}
            className="w-full text-white font-bold py-3 rounded-xl transition-all shadow-md bg-[#3A3F44] hover:bg-[#2D2D2D] disabled:bg-gray-400"
          >
            {loading ? 'Processing...' : isRegister ? 'Sign Up' : 'Sign In'}
          </button>
        </form>

        <div className="relative my-6 text-center">
          <hr className="border-gray-200" />
          <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-3 text-xs text-gray-400">OR</span>
        </div>

        <button
          type="button"
          onClick={handleGoogleLogin}
          className="w-full bg-white border border-gray-300 text-gray-700 font-semibold py-3 rounded-xl hover:bg-gray-50 flex items-center justify-center space-x-2 transition-all shadow-sm cursor-pointer"
        >
          <svg className="w-5 h-5 ml-2" viewBox="0 0 24 24">
            <path fill="#EA4335" d="M12 5.04c1.64 0 3.12.56 4.28 1.67l3.2-3.2C17.52 1.58 14.96 1 12 1 7.35 1 3.41 3.66 1.49 7.54l3.75 2.91C6.12 7.15 8.83 5.04 12 5.04z"/>
            <path fill="#4285F4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.36H12v4.51h6.46c-.29 1.48-1.14 2.73-2.42 3.57v2.97h3.91c2.28-2.1 3.54-5.19 3.54-8.69z"/>
            <path fill="#FBBC05" d="M5.24 14.75c-.24-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29L1.49 7.26C.54 9.17 0 11.29 0 12.5s.54 3.33 1.49 5.24l3.75-2.99z"/>
            <path fill="#34A853" d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.91-2.97c-1.12.75-2.55 1.2-4.05 1.2-3.17 0-5.88-2.11-6.84-5.04L1.41 16.22C3.33 20.12 7.27 23 12 23z"/>
          </svg>
          <span>Continue with Google</span>
        </button>

        <p className="text-center text-sm text-gray-500 mt-6">
          {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button 
            type="button"
            onClick={() => { setIsRegister(!isRegister); setErrorMsg(''); setSuccessMsg(''); }}
            className="text-[#83C5BE] underline font-medium cursor-pointer"
          >
            {isRegister ? 'Sign In' : 'Sign Up'}
          </button>
        </p>

      </div>
    </div>
  );
};

export default LoginModal;