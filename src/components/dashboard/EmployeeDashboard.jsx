import { useMemo, useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import "./css/EmployeeDashboard.css";

export default function EmployeeDashboard() {
    const { user } = useAuth();
    const data = user ?? {};

    const {id,username,phone_number,email,status,salary,is_verified,image,login_at,logout_at,roles} = data;

    const [imgOk, setImgOk] = useState(true);

    const safeStatus = useMemo(() => {
        const s = String(status || "unknown").toLowerCase();
        if (["active", "inactive", "suspended"].includes(s)) return s;
        return "unknown";
    }, [status]);

    const statusLabel = useMemo(() => {
        if (safeStatus === "active") return "ACTIVE";
        if (safeStatus === "inactive") return "INACTIVE";
        if (safeStatus === "suspended") return "SUSPENDED";
        return (status ? String(status).toUpperCase() : "UNKNOWN");
    }, [safeStatus, status]);

    const initials = useMemo(() => {
        const name = (username || "Employee").trim();
        const parts = name.split(/\s+/).slice(0, 2);
        return (
        parts
            .map((p) => p[0]?.toUpperCase())
            .join("")
            .slice(0, 2) || "E"
        );
    }, [username]);

    const formatMoney = (value) => {
        const n = Number(value);
        if (!Number.isFinite(n)) return "—";
        return n.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
    };

    const valueOrDash = (v) => (v === null || v === undefined || v === "" ? "—" : v);

    const roleBadges = useMemo(() => {
        if (!Array.isArray(roles) || roles.length === 0) return [];
        return roles.map((r, idx) => {
            const name = r?.name || r?.title || r?.role || r?.slug || (typeof r === "string" ? r : `Role ${idx + 1}`);
            return {key: r?.id ?? `${idx}`,name: String(name).toUpperCase(),};
        });
    }, [roles]);

  return (
        <div className="ed-app">
            <header className="ed-topbar">
                <div className="ed-topbar__left">
                    <div className="ed-brandMark" />
                    <div>
                        <div className="ed-topTitle">EMPLOYEE DASHBOARD</div>
                        <div className="ed-topSub">
                            {username ? `WELCOME, ${String(username).toUpperCase()}` : "WELCOME"}
                        </div>
                    </div>
                </div>

                <div className="ed-topbar__right">
                    <Pill variant={`status-${safeStatus}`}>{statusLabel}</Pill>

                    {is_verified ? (
                        <span className="ed-verifiedBadge" title="This account is verified">
                        <span className="ed-verifiedBadge__icon" aria-hidden="true">✓</span>
                            VERIFIED
                        </span>
                    ) : (
                        <span className="ed-unverifiedBadge" title="This account is not verified">
                            NOT VERIFIED
                        </span>
                    )}
                </div>
            </header>

            <div className="ed-shell">
                <aside className="ed-sidebar">
                    <div className="ed-card ed-card--sidebar">
                        <div className="ed-profile">
                            <div className="ed-avatar">
                                {image && imgOk ? (
                                    <img src={image} alt={username || "Employee"} className="ed-avatar__img" onError={() => setImgOk(false)}/>
                                ) : (
                                    <div className="ed-avatar__fallback">{initials}</div>
                                )}
                                <span className={`ed-statusDot ed-statusDot--${safeStatus}`} />
                            </div>

                            <div className="ed-profile__info">
                                <div className="ed-name" title={valueOrDash(username)}>
                                    {valueOrDash(username)}
                                </div>
                                <div className="ed-miniMuted">EMPLOYEE ID: {valueOrDash(id)}</div>

                                <div className="ed-miniRow">
                                    <span className="ed-miniLabel">PHONE</span>
                                    <span className="ed-miniValue">{valueOrDash(phone_number)}</span>
                                </div>

                                <div className="ed-miniRow">
                                    <span className="ed-miniLabel">EMAIL</span>
                                    <span className={`ed-miniValue ${email ? "" : "is-muted"}`}>
                                        {email || "NOT PROVIDED"}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="ed-sep" />

                        <div className="ed-sidebarSection">
                            <div className="ed-sectionHead">
                                <div className="ed-sectionTitle">ROLES</div>
                                <div className="ed-sectionMeta">{roleBadges.length} TOTAL</div>
                            </div>

                            {roleBadges.length ? (
                                <div className="ed-badges">
                                    {roleBadges.map((r) => (
                                        <span key={r.key} className="ed-roleBadge">
                                            {r.name}
                                        </span>
                                    ))}
                                </div>
                            ) : (
                                <div className="ed-empty">NO ROLES ASSIGNED</div>
                            )}
                        </div>

                        <div className="ed-sep" />

                        <div className="ed-sidebarSection">
                            <div className="ed-sectionTitle">QUICK ACTIONS</div>
                            <div className="ed-actionsCol">
                                <button type="button" className="ed-btn ed-btn--primary" onClick={() => console.log("View profile clicked")}>
                                    VIEW PROFILE
                                </button>
                                <button type="button" className="ed-btn ed-btn--ghost" onClick={() => console.log("Support clicked")}>
                                    SUPPORT
                                </button>
                            </div>
                        </div>
                    </div>
                </aside>

                <main className="ed-main">
                    <div className="ed-mainGrid">
                        <div className="ed-stats">
                            <StatCard title="STATUS" value={statusLabel} hint="ACCOUNT STATE" variant={`status-${safeStatus}`}/>

                            <StatCard title="SALARY" value={`${formatMoney(salary)} BDT`} hint="CURRENT BASE"/>

                            <StatCard title="LAST LOGIN" value={valueOrDash(login_at)} hint="AUTH ACTIVITY"/>

                            <StatCard title="LAST LOGOUT" value={logout_at ? logout_at : "—"} hint="AUTH ACTIVITY"/>
                        </div>

                        <div className="ed-card ed-card--main">
                            <div className="ed-cardHeader">
                                <div>
                                <div className="ed-cardTitle">ACCOUNT DETAILS</div>
                                <div className="ed-cardSub">Summary of your profile information</div>
                                </div>
                            </div>

                            <div className="ed-details">
                                <Detail label="EMPLOYEE ID" value={valueOrDash(id)} />
                                <Detail label="USERNAME" value={valueOrDash(username)} />
                                <Detail label="PHONE NUMBER" value={valueOrDash(phone_number)} />
                                <Detail label="EMAIL" value={email || "NOT PROVIDED"} muted={!email} />
                                <Detail label="STATUS" value={statusLabel} />
                                <Detail label="VERIFIED" value={is_verified ? "YES" : "NO"} />
                                <Detail label="SALARY" value={`${formatMoney(salary)} BDT`} />
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
  );
}

function Pill({ children, variant = "neutral" }) {
    return <span className={`ed-pill ed-pill--${variant}`}>{children}</span>;
}

function StatCard({ title, value, hint, variant }) {
    return (
        <div className={`ed-stat ${variant ? `ed-stat--${variant}` : ""}`}>
            <div className="ed-stat__title">{title}</div>
            <div className="ed-stat__value" title={String(value)}>{value}</div>
            <div className="ed-stat__hint">{hint}</div>
        </div>
    );
}

function Detail({ label, value, muted = false }) {
    return (
        <div className="ed-detail">
            <div className="ed-detail__label">{label}</div>
            <div className={`ed-detail__value ${muted ? "is-muted" : ""}`} title={String(value)}>
                {value}
            </div>
        </div>
    );
}
