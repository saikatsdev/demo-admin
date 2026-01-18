import {SyncOutlined } from "@ant-design/icons";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import useAxios from "../hooks/useAxios";
import TopMenuBar from "./TopMenuBar";
import { getDatas } from "../api/common/common";
import { message } from "antd";
import {useEffect, useState } from "react";
import "./Header.css";
import OrderSearch from "./search/OrderSearch";
import useAppSettings from "../hooks/useAppSettings";
import NotificationsDropdown from "./data/NotificationsDropdown";
import { setFavicon } from "../utils/favicon";

export default function Header({ submenus }) {
    // Hook
    const { settings, loading } = useAppSettings(["title", "favicon_icon"]);

    // State
    const [cachLoading, setCacheLoading]       = useState(false);
    const [messageApi, contextHolder] = message.useMessage();

    const { logout, user } = useAuth();
    const api              = useAxios();

    // Variable
    const navigate = useNavigate();

    useEffect(() => {
        if (!loading && settings?.favicon_icon) {
            setFavicon(settings.favicon_icon);
        }
    }, [loading, settings?.favicon_icon]);

    const handleLogout = async () => {
        try {
            await api.post("/admin/logout");
        } catch (e) {
            console.error("Logout error:", e);
        } finally {
            logout();
            navigate("/login");
        }
    };

    const goProfile = () => navigate("/system/user-management");
    const goSettings = () => navigate("/settings");

    const _cacheClear = async () => {
        setCacheLoading(true);
        try {
            const res = await getDatas("/admin/cache-clear");
            
            if (res && res?.success) {
                messageApi.open({
                    type: "success",
                    content: res.msg,
                });

                setTimeout(() => {
                    window.location.reload();
                }, 1000);
            } else {
                messageApi.open({
                    type: "success",
                    content: res.msg,
                });
            }
        } catch (error) {
            console.error("Error:", error);

            messageApi.open({
                type: "success",
                content: "Error clearing cache",
            });
        } finally {
            setCacheLoading(false);
        }
    };

    if(loading) return null;

    return (
        <>
            {contextHolder}
            <header className="topbar">
                <label htmlFor="sidebar-toggle" className="hambtn" aria-label="Toggle sidebar">
                    <span className="bar"></span>
                </label>
        
                <div className="brand logo" aria-label="SOFTEDU Home">
                    <Link to="/">
                        <img src={settings.favicon_icon} alt="" aria-hidden="true" />
                        
                        <h2>{settings.title}</h2>
                    </Link>
                </div>
        
                <TopMenuBar submenus={submenus} />
        
                <div className="spacer"></div>
        
                <OrderSearch getDatas={getDatas} messageApi={messageApi}/>

                <NotificationsDropdown />
        
                <div>
                    <span className="refresh-icon" onClick={_cacheClear}>
                        <SyncOutlined spin={cachLoading} />
                    </span>
                </div>
        
                <details className="avatar-menu">
                    <summary className="avatar-btn" aria-label="User menu">
                        <div className="avatar" aria-hidden="true"></div>
                    </summary>

                    <div className="dropdown" role="list">
                        <div className="userbox">
                            <div className="u-avatar"></div>
                            <div className="u-meta">
                                <strong style={{textTransform:"capitalize"}}>{user?.username ?? "User Name"}</strong>
                                <span className="muted">{user?.email ?? ""}</span>
                            </div>
                        </div>
                        <button onClick={goProfile} className="dropdown-item">
                            Profile
                        </button>
                        <button onClick={goSettings} className="dropdown-item">
                            Settings
                        </button>

                        <hr className="sep" />

                        <button onClick={handleLogout} className="dropdown-item danger">
                            Logout
                        </button>
                    </div>

                </details>
            </header>
        </>
    )
}
