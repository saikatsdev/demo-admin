import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import api from '../../api/index';
import useTitle from '../../hooks/useTitle';
import { LogIn, Lock, Phone, Eye, EyeOff, Shield } from 'lucide-react';
import './auth.css';

const BearAvatar = ({ focusedField, passwordVisible, phoneLength }) => {
    const isCoveringEyes = focusedField === 'password' && !passwordVisible;
    const isPeeking = focusedField === 'password' && passwordVisible;
    
    let pupilX = 0;
    let pupilY = 0;
    
    if (focusedField === 'phone') {
        const progress = Math.min(phoneLength, 12) / 12; 
        pupilX = -6 + (progress * 12); 
        pupilY = 4; 
    } else if (focusedField === 'password') {
        pupilX = isPeeking ? -4 : 0; 
        pupilY = -2; 
    } else if (focusedField === 'otp') {
        pupilX = 0;
        pupilY = 4;
    }

    return (
        <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            marginTop: '-90px',
            marginBottom: '20px',
            height: '120px', 
            alignItems: 'flex-end',
            position: 'relative',
            zIndex: 1,
            pointerEvents: 'none'
        }}>
            <svg width="140" height="140" viewBox="0 0 200 200" style={{ overflow: 'visible' }}>
                {/* Ears */}
                <circle cx="55" cy="55" r="22" fill="#cbd5e1" />
                <circle cx="55" cy="55" r="10" fill="#f8fafc" />
                <circle cx="145" cy="55" r="22" fill="#cbd5e1" />
                <circle cx="145" cy="55" r="10" fill="#f8fafc" />
                
                {/* Face */}
                <circle cx="100" cy="110" r="65" fill="#e2e8f0" />
                
                {/* Eye Whites */}
                <circle cx="75" cy="95" r="12" fill="#ffffff" />
                <circle cx="125" cy="95" r="12" fill="#ffffff" />
                
                {/* Pupils */}
                <g style={{ transition: 'transform 0.15s ease-out', transform: `translate(${pupilX}px, ${pupilY}px)` }}>
                    <circle cx="75" cy="95" r="5" fill="#0f172a" />
                    <circle cx="125" cy="95" r="5" fill="#0f172a" />
                </g>
                
                {/* Snout */}
                <ellipse cx="100" cy="130" rx="30" ry="20" fill="#f8fafc" />
                
                {/* Nose */}
                <ellipse cx="100" cy="122" rx="10" ry="6" fill="#0f172a" />
                
                {/* Mouth */}
                <path d="M 92 135 Q 100 142 108 135" fill="transparent" stroke="#0f172a" strokeWidth="2" strokeLinecap="round" />

                {/* Left Arm */}
                <g style={{ 
                    transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                    transformOrigin: '20px 200px',
                    transform: isCoveringEyes 
                        ? 'translate(45px, -85px) rotate(15deg)' 
                        : isPeeking 
                            ? 'translate(10px, -20px) rotate(-10deg)' 
                            : 'translate(0px, 0px) rotate(0deg)'
                }}>
                    <circle cx="30" cy="190" r="20" fill="#cbd5e1" />
                    <ellipse cx="30" cy="190" rx="12" ry="16" fill="#f8fafc" />
                </g>

                {/* Right Arm */}
                <g style={{ 
                    transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                    transformOrigin: '180px 200px',
                    transform: isCoveringEyes || isPeeking 
                        ? 'translate(-45px, -85px) rotate(-15deg)' 
                        : 'translate(0px, 0px) rotate(0deg)'
                }}>
                    <circle cx="170" cy="190" r="20" fill="#cbd5e1" />
                    <ellipse cx="170" cy="190" rx="12" ry="16" fill="#f8fafc" />
                </g>
            </svg>
        </div>
    );
};

export default function Login() {
    useTitle("Admin Login");

    const navigate                        = useNavigate();
    const { login }                       = useAuth();
    const [phone, setPhone]               = useState('');
    const [password, setPassword]         = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe]     = useState(false);
    const [otp, setOtp]                   = useState('');
    const [showOtp, setShowOtp]           = useState(false);
    const [loading, setLoading]           = useState(false);
    const [errors, setErrors]             = useState({ phone: '', password: '', otp: '' });
    const [focusedField, setFocusedField] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrors({ phone: '', password: '', otp: '' });

        let hasError = false;
        const newErrors = { phone: '', password: '', otp: '' };

        if (!phone) {
            newErrors.phone = 'Phone number is required';
            hasError = true;
        }

        if (!password) {
            newErrors.password = 'Password is required';
            hasError = true;
        }

        if (showOtp && !otp) {
            newErrors.otp = 'OTP is required';
            hasError = true;
        }

        if (hasError) {
            setErrors(newErrors);
            return;
        }

        setLoading(true);

        try {
            const payload = {
                phone_number: phone, 
                password,
                staff_login_otp: showOtp ? otp : undefined
            };
            
            const res = await api.post('/admin/login', payload);
            const resData = res?.data;

            if (resData && resData.success) {
                const user = resData.result.user;
                const teamSetting = user.team_setting;
                const roles = user.roles || [];
                
                const isSpecialRole = roles.some(r => r.id === 1 || r.id === 2);

                if (!isSpecialRole && teamSetting?.team_module_active) {
                    user.screening_duration = teamSetting.screening_duration;
                }

                login(user, resData.result.token);
                navigate('/dashboard', { replace: true });
                return;
            }

            if (resData?.success === false && resData?.message === "Please provided your login otp") {
                setShowOtp(true);
                setErrors({ ...newErrors, otp: resData.message });
                setLoading(false);
                return;
            }

            const msg = resData?.message || resData?.msg || 'Login failed';
            setErrors({ ...newErrors, phone: msg });

        } catch (err) {
            const resData = err?.response?.data;
            
            if (resData?.success === false && resData?.message === "Please provided your login otp") {
                setShowOtp(true);
                setLoading(false);
                return;
            }

            if (resData?.message === "Your provided otp is invalid") {
                setErrors({ ...newErrors, otp: resData.message });
                setLoading(false);
                return;
            }

            const msg = resData?.message || resData?.msg || 'Login failed';
            setErrors({ ...newErrors, phone: msg });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-layout">
            <main className="form-wrap" aria-labelledby="login-title">
                <form className="auth-card" onSubmit={handleSubmit} noValidate>
                    <BearAvatar 
                        focusedField={focusedField} 
                        passwordVisible={showPassword} 
                        phoneLength={phone.length} 
                    />
                    <div className="auth-head">
                        <div className="brand">
                            <LogIn size={32} className="logo" />
                            <span>Admin Panel</span>
                        </div>
                        <span className="badge">Login</span>
                    </div>

                    <h2 id="login-title">Welcome Back</h2>
                    <p className="sub">Sign in to access your admin dashboard and manage your store.</p>

                    <div className={`field ${errors.phone ? 'error' : ''}`}>
                        <label htmlFor="phone">
                            <Phone size={14} style={{ display: 'inline-block', marginRight: '4px', verticalAlign: 'text-bottom' }} />
                            Phone Number
                        </label>
                        <input
                            id="phone"
                            className="input"
                            name="phone"
                            type="tel"
                            inputMode="tel"
                            autoComplete="tel"
                            placeholder="01000000000"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            onFocus={() => setFocusedField('phone')}
                            onBlur={() => setFocusedField(null)}
                            required
                        />
                        {errors.phone && <div className="error-message">{errors.phone}</div>}
                        <small className="help">Enter your registered phone number</small>
                    </div>

                    <div className={`field ${errors.password ? 'error' : ''}`}>
                        <label htmlFor="password">
                            <Lock size={14} style={{ display: 'inline-block', marginRight: '4px', verticalAlign: 'text-bottom' }} />
                            Password
                        </label>
                        <div style={{ position: 'relative' }}>
                            <input
                                id="password"
                                className="input"
                                name="password"
                                type={showPassword ? "text" : "password"}
                                minLength={8}
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                onFocus={() => setFocusedField('password')}
                                onBlur={() => setFocusedField(null)}
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                style={{
                                    position: 'absolute',
                                    right: '12px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    color: '#6b7280',
                                    padding: '4px',
                                    display: 'flex',
                                    alignItems: 'center'
                                }}
                                aria-label={showPassword ? "Hide password" : "Show password"}
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                        {errors.password && <div className="error-message">{errors.password}</div>}
                        <small className="help">Use at least 8 characters for your password</small>
                    </div>

                    {showOtp && (
                        <div className={`field ${errors.otp ? 'error' : ''}`}>
                            <label htmlFor="otp">
                                <Shield size={14} style={{ display: 'inline-block', marginRight: '4px', verticalAlign: 'text-bottom' }} />
                                Login OTP
                            </label>
                            <input
                                id="otp"
                                className="input"
                                name="otp"
                                type="text"
                                placeholder="Enter Login OTP"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                                onFocus={() => setFocusedField('otp')}
                                onBlur={() => setFocusedField(null)}
                                required
                                autoFocus
                            />
                            {errors.otp && <div className="error-message">{errors.otp}</div>}
                            <small className="help">Check your assigned contact for the login OTP</small>
                            <button 
                                type="button" 
                                className="muted-btn" 
                                onClick={() => setShowOtp(false)}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    padding: '0',
                                    marginTop: '8px',
                                    fontSize: '12px',
                                    color: '#6366f1',
                                    cursor: 'pointer',
                                    textDecoration: 'underline'
                                }}
                            >
                                Back to login
                            </button>
                        </div>
                    )}

                    <div className="row">
                        <label className="checkbox">
                            <input
                                type="checkbox"
                                name="remember"
                                checked={rememberMe}
                                onChange={(e) => setRememberMe(e.target.checked)}
                            />
                            <span>Remember me</span>
                        </label>
                        <a className="muted" href="#forgot">Forgot password?</a>
                    </div>

                    <button className="btn btn--primary" type="submit" disabled={loading} aria-busy={loading}>
                        {loading ? "Processing..." : (showOtp ? "Verify OTP & Login" : "Sign In")}
                    </button>

                    <div className="security-badge">
                        <Shield size={14} />
                        Secure & encrypted connection
                    </div>
                </form>
            </main>
        </div>
    )
}
