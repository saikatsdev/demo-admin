import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import api from '../../api/index';
import useTitle from '../../hooks/useTitle';
import './auth.css';

const Login = () => {
  // Hooks
  useTitle("Admin Login");

  const navigate                = useNavigate();
  const { login }               = useAuth();
  const [phone, setPhone]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [errors, setErrors]     = useState({ phone: '', password: '' });

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
      const res = await api.post('/admin/login', {phone_number: phone,password});
      
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

  const handleClick = () => {
    navigate("/");
  }

  return (
    <div className="auth-layout">
      <main className="form-wrap" aria-labelledby="login-title">
        <form className="auth-card" onSubmit={handleSubmit} noValidate>
          <div className="auth-head">
            <div className="brand">
              <span>
                Admin Panel
              </span>
            </div>

            <span className="badge">Login</span>

          </div>

          <h2 id="login-title">Sign In</h2>

          <p className="sub">
            Please write your correct information.
          </p>

          <div className="field">
            <label htmlFor="phone">Phone Number</label>

            <input id="phone" className="input" name="phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="01000000000" value={phone} onChange={(e) => setPhone(e.target.value)} required/>

            {errors.phone && <small style={{ color: 'hsl(0 70% 50%)', fontWeight: 700 }}>{errors.phone}</small>}
          </div>

          <div className="field">

            <label htmlFor="password">Password</label>

            <input id="password" className="input" name="password" type="password" minLength={8} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required/>

            <small className="help">
              Use at least 8 digits password.
            </small>
            {errors.password && <small style={{ color: 'hsl(0 70% 50%)', fontWeight: 700 }}>{errors.password}</small>}
          </div>

          <div className="row">
            <label className="checkbox">
              <input type="checkbox" name="remember" />
              <span>Remember me</span>
            </label>

            <a className="muted" href="#">
              Forgot password?
            </a>
          </div>

          <button className="btn btn--primary" type="submit" disabled={loading} aria-busy={loading}>
            Sign In
          </button>

          <div className="divider">
            <span className="muted">Or</span>
          </div>

          <button className="btn btn--ghost" type="button" onClick={handleClick}>
            Back to Homepage
          </button>
        </form>
      </main>
    </div>
  );
};

export default Login;
