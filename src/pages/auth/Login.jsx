import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import api from '../../api/index';
import useTitle from '../../hooks/useTitle';
import { LogIn, Lock, Phone, Eye, EyeOff, Shield } from 'lucide-react';
import './auth.css';

export default function Login() {
    useTitle("Admin Login");

    const navigate                        = useNavigate();
    const { login }                       = useAuth();
    const [phone, setPhone]               = useState('');
    const [password, setPassword]         = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe]     = useState(false);
    const [loading, setLoading]           = useState(false);
    const [errors, setErrors]             = useState({ phone: '', password: '' });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrors({ phone: '', password: '' });

        let hasError = false;
        const newErrors = { phone: '', password: '' };

        if (!phone) {
            newErrors.phone = 'Phone number is required';
            hasError = true;
        }

        if (!password) {
            newErrors.password = 'Password is required';
            hasError = true;
        }

        if (hasError) {
            setErrors(newErrors);
            return;
        }

        setLoading(true);

        try {
            const res = await api.post('/admin/login', {phone_number: phone, password});
            const resData = res?.data;

            if (resData && resData.success) {
                login(resData.result.user, resData.result.token);
                navigate('/dashboard', { replace: true });
                return;
            }

            const msg = res?.data?.msg || 'Login failed';
            setErrors({ ...newErrors, phone: msg, password: msg });
        } catch (err) {
            const msg = err?.response?.data?.msg || 'Login failed';
            setErrors({ ...newErrors, phone: msg, password: msg });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-layout">
            <main className="form-wrap" aria-labelledby="login-title">
                <form className="auth-card" onSubmit={handleSubmit} noValidate>
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
                        {loading ? "Signing in..." : "Sign In"}
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
