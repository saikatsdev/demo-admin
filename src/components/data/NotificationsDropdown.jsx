import { useState, useEffect, useRef } from "react";
import { BellOutlined } from "@ant-design/icons";
import useNotifications from "./notification";

const NotificationsDropdown = () => {
    // State
    const [showNoti, setShowNoti]    = useState(false);
    const { notifications, loading } = useNotifications();
    const dropdownRef                = useRef(null);

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
                <span className="badge">{notifications.length}</span>
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
                            <div key={n.id} className="noti-item">
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
