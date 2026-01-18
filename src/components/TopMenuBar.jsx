import { ChevronDown } from "lucide-react";
import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import "./TopMenubar.css";

export default function TopMenuBar({ submenus = [] }) {
  const [showMore, setShowMore] = useState(false);
  const [visibleCount, setVisibleCount] = useState(8);

  // Responsive visible count
  useEffect(() => {
    const updateVisibleCount = () => {
      const width = window.innerWidth;

      if (width >= 1400) {
        setVisibleCount(6);
      } else if (width >= 1200) {
        setVisibleCount(4);
      } else if (width >= 992) {
        setVisibleCount(3);
      } else if (width >= 768) {
        setVisibleCount(2);
      } else {
        setVisibleCount(1);
      }
    };

    updateVisibleCount();
    window.addEventListener("resize", updateVisibleCount);
    return () => window.removeEventListener("resize", updateVisibleCount);
  }, []);

  if (visibleCount === 0) return null;

  const visibleMenus = submenus.slice(0, visibleCount);
  const hiddenMenus = submenus.slice(visibleCount);

  return (
    <div className="top-menu-bar">
      {visibleMenus.map((item, i) => (
        <NavLink
          key={i}
          to={item.path}
          className={({ isActive }) =>
            `top-menu-item ${isActive ? "active" : ""}`
          }
        >
          {item.label}
        </NavLink>
      ))}

      {hiddenMenus.length > 0 && (
        <div className="more-menu-wrapper">
          <button className="more-btn" onClick={() => setShowMore(!showMore)}>
            More <ChevronDown size={16} />
          </button>

          {showMore && (
            <div className="dropdown-menu">
              {hiddenMenus.map((item, i) => (
                <NavLink
                  key={i}
                  to={item.path}
                  className={({ isActive }) =>
                    `dropdown-item ${isActive ? "active" : ""}`
                  }
                  onClick={() => setShowMore(false)}
                >
                  {item.label}
                </NavLink>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
