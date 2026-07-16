import React, { useState } from 'react';

// Shared style for input fields
const inputStyle = { width: '100%', padding: '10px', marginTop: '5px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box' };

const Auth = ({ onClose }) => {
    // Controls whether we're showing the login screen or the register screen
    const [isLoginMode, setIsLoginMode] = useState(true);

    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        password: '',
        confirmPassword: '' // Added field for password confirmation
    });

    const [message, setMessage] = useState('');
    const [isError, setIsError] = useState(false);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');

        // Password confirmation is only checked in register mode
        if (!isLoginMode && formData.password !== formData.confirmPassword) {
            setIsError(true);
            setMessage('Passwords do not match!');
            return;
        }

        try {
            // Choose the endpoint based on the current mode (login or register)
            const endpoint = isLoginMode ? 'login' : 'register';

            // Build the request body (login doesn't need full name or password confirmation)
            const payload = isLoginMode
                ? { email: formData.email, password: formData.password }
                : { fullName: formData.fullName, email: formData.email, password: formData.password };

            const response = await fetch(`https://localhost:7227/api/Users/${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (!response.ok) {
                setIsError(true);
                setMessage(data.message || 'An error occurred. Please check your details.');
                return;
            }

            setIsError(false);
            if (isLoginMode) {
                setMessage(`Welcome back, ${data.fullName}!`);
                // TODO: store the token and user info in localStorage
            } else {
                setMessage('Registration successful! You can now log in.');
                setIsLoginMode(true); // Automatically switch to the login screen
            }

        } catch (error) {
            setIsError(true);
            setMessage('Communication error with the server.');
            console.error("Error:", error);
        }
    };

    return (
        <div style={{ maxWidth: '400px', margin: '50px auto', padding: '30px', border: '1px solid #ddd', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', backgroundColor: 'white' }}>
            <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>
                {isLoginMode ? 'Sign In' : 'Create an Account'}
            </h2>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>

                {/* Full name field only appears during registration */}
                {!isLoginMode && (
                    <div>
                        <label>Full Name:</label>
                        <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} required style={inputStyle} />
                    </div>
                )}

                <div>
                    <label>Email:</label>
                    <input type="email" name="email" value={formData.email} onChange={handleChange} required style={inputStyle} />
                </div>

                <div>
                    <label>Password:</label>
                    <input type="password" name="password" value={formData.password} onChange={handleChange} required minLength="6" style={inputStyle} />
                </div>

                {/* Confirm password field only appears during registration */}
                {!isLoginMode && (
                    <div>
                        <label>Confirm Password:</label>
                        <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} required minLength="6" style={inputStyle} />
                    </div>
                )}

                <button type="submit" style={{ padding: '12px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold' }}>
                    {isLoginMode ? 'Log In' : 'Sign Up Now'}
                </button>
            </form>

            {message && (
                <div style={{ marginTop: '20px', padding: '10px', backgroundColor: isError ? '#ffebee' : '#e8f5e9', color: isError ? '#c62828' : '#2e7d32', textAlign: 'center', borderRadius: '4px' }}>
                    {message}
                </div>
            )}

            {/* Toggle between login and register modes */}
            <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '14px' }}>
                {isLoginMode ? "Don't have an account yet? " : "Already have an account? "}
                <button
                    onClick={() => { setIsLoginMode(!isLoginMode); setMessage(''); setIsError(false); }}
                    style={{ background: 'none', border: 'none', color: '#2196F3', cursor: 'pointer', textDecoration: 'underline', padding: 0 }}
                >
                    {isLoginMode ? "Click here to sign up" : "Click here to log in"}
                </button>
            </div>

            {/* Optional close button (X) to dismiss the modal/window */}
            {onClose && (
                <button onClick={onClose} style={{ display: 'block', width: '100%', marginTop: '15px', padding: '8px', backgroundColor: '#f44336', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
                    Close
                </button>
            )}
        </div>
    );
};

export default Auth;