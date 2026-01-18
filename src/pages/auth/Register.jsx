import useTitle from '../../hooks/useTitle';
import './auth.css';


const Register = () => {
  // Hook
  useTitle("Register");

  return (
    <div className="auth-layout">
      {/* Left: Hero */}
      <aside className="hero">
        <div className="brand">
          <svg className="logo" viewBox="0 0 24 24" aria-hidden="true">
            <path
              fill="currentColor"
              d="M7 18a2 2 0 1 0 0 4a2 2 0 0 0 0-4m10 0a2 2 0 1 0 0 4a2 2 0 0 0 0-4M6.2 6h14.3l-1.4 7.2a3 3 0 0 1-3 2.4H9.5a3 3 0 0 1-3-2.4L5.2 3.8H3a1 1 0 1 1 0-2h3a1 1 0 0 1 .98.8L7.3 6z"
            />
          </svg>
          <span>ShopStack Admin</span>
        </div>
        <h1>দ্রুত অ্যাডমিন অ্যাকাউন্ট তৈরি করুন ✨</h1>
        <p>
          রোল ম্যানেজমেন্ট, পারমিশন, ও অ্যাক্টিভিটি লগ সহ নিরাপদ অ্যাডমিন
          প্যানেল।
        </p>
        <ul className="hero-stats">
          <li>
            <strong>রোল:</strong> Admin / Manager / Staff
          </li>
          <li>
            <strong>2FA প্রস্তুত:</strong> হ্যাঁ
          </li>
          <li>
            <strong>অডিট লগ:</strong> সক্ষম
          </li>
        </ul>
      </aside>
      {/* Right: Register Card */}
      <main className="form-wrap" aria-labelledby="register-title">
        <form className="auth-card" action="#" method="post" noValidate>
          <div className="auth-head">
            <div className="brand">
              <svg className="logo" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="currentColor"
                  d="M7 18a2 2 0 1 0 0 4a2 2 0 0 0 0-4m10 0a2 2 0 1 0 0 4a2 2 0 0 0 0-4M6.2 6h14.3l-1.4 7.2a3 3 0 0 1-3 2.4H9.5a3 3 0 0 1-3-2.4L5.2 3.8H3a1 1 0 1 1 0-2h3a1 1 0 0 1 .98.8L7.3 6z"
                />
              </svg>
              <span>ShopStack Admin</span>
            </div>
            <span className="badge">Register</span>
          </div>
          <h2 id="register-title">নতুন অ্যাডমিন একাউন্ট</h2>
          <p className="sub">নিচের তথ্যগুলো পূরণ করুন।</p>
          <div className="field">
            <label htmlFor="name">পূর্ণ নাম</label>
            <input
              id="name"
              className="input"
              name="name"
              type="text"
              autoComplete="name"
              placeholder="জুহাইর আহমেদ"
              required
            />
            <small className="help">নামটি লিখুন।</small>
          </div>
          <div className="field">
            <label htmlFor="reg-email">কর্মস্থলের ইমেইল</label>
            <input
              id="reg-email"
              className="input"
              name="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="you@yourstore.com"
              required
            />
            <small className="help">একটি বৈধ ইমেইল লিখুন।</small>
          </div>
          <div className="field">
            <label>রোল নির্বাচন</label>
            <div
              className="segmented"
              role="radiogroup"
              aria-label="রোল নির্বাচন"
            >
              <label className="opt">
                <input type="radio" name="role" defaultValue="admin" required />
                <span>Admin</span>
              </label>
              <label className="opt">
                <input type="radio" name="role" defaultValue="manager" />
                <span>Manager</span>
              </label>
              <label className="opt">
                <input type="radio" name="role" defaultValue="staff" />
                <span>Staff</span>
              </label>
            </div>
          </div>
          <div className="field">
            <label htmlFor="reg-pass">পাসওয়ার্ড</label>
            <input
              id="reg-pass"
              className="input"
              name="password"
              type="password"
              autoComplete="new-password"
              minLength={8}
              placeholder="কমপক্ষে ৮ অক্ষর"
              required
            />
            <small className="help">কমপক্ষে ৮ অক্ষর দিন।</small>
          </div>
          <div className="field">
            <label htmlFor="reg-pass2">পাসওয়ার্ড নিশ্চিত করুন</label>
            <input
              id="reg-pass2"
              className="input"
              name="password_confirm"
              type="password"
              autoComplete="new-password"
              minLength={8}
              placeholder="পুনরায় পাসওয়ার্ড লিখুন"
              required
            />
            <small className="help">পাসওয়ার্ড মিল আছে কিনা যাচাই করুন।</small>
          </div>
          <div className="field">
            <label className="checkbox">
              <input type="checkbox" name="terms" required />
              <span>আমি শর্তাবলী মেনে নিচ্ছি</span>
            </label>
          </div>
          <button className="btn btn--primary" type="submit">
            একাউন্ট তৈরি করুন
          </button>
          <div className="auth-foot">
            <p className="muted">
              আগেই একাউন্ট আছে? <a href="login.html">সাইন ইন করুন</a>
            </p>
          </div>
        </form>
      </main>
    </div>
  );
};

export default Register;
