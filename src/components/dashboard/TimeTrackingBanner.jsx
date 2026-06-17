import { useState, useEffect } from 'react';
import { Button, Typography, message } from 'antd';
import { ClockCircleOutlined, LoginOutlined, LogoutOutlined, PlusOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { postData, getDatas } from '../../api/common/common';

const { Text } = Typography;

const TimeTrackingBanner = ({ initialCheckIn, initialCheckOut, onUpdate, userId }) => {
    const [currentTime, setCurrentTime] = useState(dayjs());
    const [checkIn, setCheckIn] = useState(initialCheckIn);
    const [checkOut, setCheckOut] = useState(initialCheckOut);
    const [loading, setLoading] = useState({ in: false, out: false });

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(dayjs());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        if (initialCheckIn) setCheckIn(initialCheckIn);
    }, [initialCheckIn]);

    useEffect(() => {
        if (initialCheckOut) setCheckOut(initialCheckOut);
    }, [initialCheckOut]);

    useEffect(() => {
        const fetchAttendance = async () => {
            if (!userId) return;
            try {
                const res = await getDatas('/admin/attendance/my-attendance', { user_id: userId });
                if (res && res.success && res.result) {
                    if (res.result.check_in_at) setCheckIn(res.result.check_in_at);
                    if (res.result.check_out_at) setCheckOut(res.result.check_out_at);
                }
            } catch (err) {
                console.error("Failed to fetch attendance:", err);
            }
        };

        fetchAttendance();
    }, [userId]);

    const handleCheckIn = async () => {
        setLoading(prev => ({ ...prev, in: true }));
        try {
            const res = await postData('/admin/attendance/check-in', { user_id: userId });
            if (res && res.success) {
                const now = dayjs().format("YYYY-MM-DD HH:mm:ss");
                setCheckIn(now);
                message.success("Checked in successfully");
                if (onUpdate) onUpdate();
            } else {
                const now = dayjs().format("YYYY-MM-DD HH:mm:ss");
                setCheckIn(now);
                message.warning("Simulated Check-In (API not connected)");
            }
        } catch (err) {
            console.error(err);
            const now = dayjs().format("YYYY-MM-DD HH:mm:ss");
            setCheckIn(now);
        } finally {
            setLoading(prev => ({ ...prev, in: false }));
        }
    };

    const handleCheckOut = async () => {
        setLoading(prev => ({ ...prev, out: true }));
        try {
            const res = await postData('/admin/attendance/check-out', { user_id: userId })
            if (res && res.success) {
                const now = dayjs().format("YYYY-MM-DD HH:mm:ss");
                setCheckOut(now);
                message.success("Checked out successfully");
                if (onUpdate) onUpdate();
            } else {
                const now = dayjs().format("YYYY-MM-DD HH:mm:ss");
                setCheckOut(now);
                message.warning("Simulated Check-Out (API not connected)");
            }
        } catch (err) {
            console.error(err);
            const now = dayjs().format("YYYY-MM-DD HH:mm:ss");
            setCheckOut(now);
        } finally {
            setLoading(prev => ({ ...prev, out: false }));
        }
    };

    return (
        <div className="time-tracking-banner" style={{ 
            marginBottom: 24, 
            padding: '16px 24px', 
            background: '#fff', 
            borderRadius: '12px', 
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '16px'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ padding: '8px', background: '#e6f7ff', borderRadius: '8px' }}>
                    <ClockCircleOutlined style={{ fontSize: '24px', color: '#1890ff' }} />
                </div>
                <div>
                    <div style={{ fontSize: '12px', color: '#8c8c8c', fontWeight: 600, textTransform: 'uppercase' }}>Current Time</div>
                    <div style={{ fontSize: '20px', fontWeight: 700, color: '#262626', fontFamily: 'monospace' }}>
                        {currentTime.format("hh-mm-ss A")}
                    </div>
                </div>
            </div>

            <div style={{ height: '40px', width: '1px', background: '#f0f0f0' }}></div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ padding: '8px', background: '#f6ffed', borderRadius: '8px' }}>
                    <LoginOutlined style={{ fontSize: '24px', color: '#52c41a' }} />
                </div>
                <div>
                    <div style={{ fontSize: '12px', color: '#8c8c8c', fontWeight: 600, textTransform: 'uppercase' }}>Check In</div>
                    {checkIn && dayjs(checkIn).isValid() ? (
                        <div style={{ fontSize: '18px', fontWeight: 600, color: '#52c41a' }}>
                            {dayjs(checkIn).format("hh-mm-ss A")}
                        </div>
                    ) : (
                        <Button type="primary" size="small" icon={<PlusOutlined />} loading={loading.in} onClick={handleCheckIn} style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}>
                            Add Check In
                        </Button>
                    )}
                </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ padding: '8px', background: '#fff1f0', borderRadius: '8px' }}>
                    <LogoutOutlined style={{ fontSize: '24px', color: '#ff4d4f' }} />
                </div>
                <div>
                    <div style={{ fontSize: '12px', color: '#8c8c8c', fontWeight: 600, textTransform: 'uppercase' }}>Check Out</div>
                    {checkOut && dayjs(checkOut).isValid() ? (
                        <div style={{ fontSize: '18px', fontWeight: 600, color: '#ff4d4f' }}>
                            {dayjs(checkOut).format("hh-mm-ss A")}
                        </div>
                    ) : (
                        <Button 
                            type="primary" 
                            danger 
                            size="small" 
                            icon={<PlusOutlined />} 
                            loading={loading.out}
                            disabled={!checkIn} // Can't check out without checking in
                            onClick={handleCheckOut}
                        >
                            Add Check Out
                        </Button>
                    )}
                </div>
            </div>

            <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '12px', color: '#8c8c8c', fontWeight: 600, textTransform: 'uppercase' }}>Today's Date</div>
                <div style={{ fontSize: '14px', fontWeight: 600 }}>{currentTime.format("dddd, MMMM DD")}</div>
            </div>
        </div>
    );
};

export default TimeTrackingBanner;
