import { useState } from "react";
import { Outlet } from "react-router-dom";
import { MenuProvider } from "../contexts/MenuContext";
import useTitle from "../hooks/useTitle";
import Header from "./Header";
import Sidebar from "./Sidebar";

const AdminLayout = ({ children }) => {
    // Hook
    useTitle("Admin Dashboard");

    const [activeSubmenus, setActiveSubmenus] = useState([]);

    const handleMenuSelect = (menu) => {
      setActiveSubmenus(menu);
    };

    return (
      <MenuProvider>
        <input id="sidebar-toggle" type="checkbox" className="visually-hidden" />
        <input id="theme-toggle" type="checkbox" className="visually-hidden" />

        <div className="layout admin">
          <Header submenus={activeSubmenus} />

          <div className="sidewrap">
            <Sidebar onMenuSelect={handleMenuSelect} />
          </div>

          <main className="content" id="main-content" tabIndex={-1}>
            {children}
            <Outlet />
          </main>

          <label htmlFor="sidebar-toggle" className="scrim" aria-hidden="true"></label>
        </div>
      </MenuProvider>
    );
};

export default AdminLayout;
