import { useState, useEffect, useRef } from "react";
import { BellOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import useNotifications from "./notification";

const NotificationsDropdown = () => {
    // State
    const [showNoti, setShowNoti]                    = useState(false);
    const { notifications, setNotifications, loading } = useNotifications();
    const dropdownRef                                = useRef(null);
    const navigate                                   = useNavigate();

    const handleNotiClick = (id) => {
        // Mark as read (update local state)
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
        // Navigate to order-edit page
        navigate(`/order-edit/${id}`);
        // Close dropdown
        setShowNoti(false);
    }

    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowNoti(false);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);


    return (
        <div className="noti-wrapper" ref={dropdownRef}>
            <button type="button" className="icon-btn" aria-label="Notifications" onClick={() => setShowNoti(!showNoti)}>
                <BellOutlined className="i" />
                {notifications.filter(n => !n.read).length > 0 && (
                    <span className="badge">{notifications.filter(n => !n.read).length}</span>
                )}
            </button>

            {showNoti && (
                <div className="noti-dropdown">
                    <div className="noti-header">Notifications</div>

                    {loading ? (
                        <div className="noti-empty">Loading...</div>
                    ) : notifications.length === 0 ? (
                        <div className="noti-empty">No notifications</div>
                    ) : (
                        notifications.map((n) => (
                            <div 
                                key={n.id} 
                                className={`noti-item ${!n.read ? "unread" : ""}`} 
                                onClick={() => handleNotiClick(n.id)} 
                                style={{ 
                                    cursor: "pointer",
                                    backgroundColor: !n.read ? "#f0f7ff" : "#fff",
                                    position: "relative"
                                }}
                            >
                                {!n.read && (
                                    <div style={{
                                        position: "absolute",
                                        right: "15px",
                                        top: "15px",
                                        width: "8px",
                                        height: "8px",
                                        backgroundColor: "#1890ff",
                                        borderRadius: "50%"
                                    }} />
                                )}
                                <div className="noti-left">
                                    <img src={n.image || "/default-avatar.png"} alt="avatar" className="noti-avatar" />
                                </div>
                                <div className="noti-right w-100">
                                    <div className="noti-text" style={{textTransform:"capitalize"}}>{n.text}</div>
                                    <div className="noti-details">
                                        <p>Phone: {n.phone}</p>
                                        <div className="d-flex justify-content-between">
                                            <p>Amount: {n.amount}</p>
                                            <p>{n.time}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
};

export default NotificationsDropdown;
