
export default function Intro() {
    return (
        <div className="topbar-left" style={{ marginBottom: "1.5rem" }}>
            <div className="page-title" style={{ fontSize: "20px", fontWeight: "600", color: "var(--text-1)" }}>
                Dashboard
            </div>
            <div className="page-sub" style={{ fontSize: "13px", color: "var(--text-3)", marginTop: "2px" }}>
                {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
            </div>
        </div>
    )
}
