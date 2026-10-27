import dayjs from "dayjs";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Button, Progress, Spin, Tag, Typography, message } from "antd";
import { postData, getDatas } from "../../api/common/common";
import { CheckCircleFilled, ClockCircleOutlined, FieldTimeOutlined, LoginOutlined, LogoutOutlined, ReloadOutlined, WarningFilled } from "@ant-design/icons";

const { Text } = Typography;

const formatDuration = (minutes = 0) => {
    const total = Math.max(0, Math.floor(Number(minutes) || 0));
    return `${Math.floor(total / 60)}h ${total % 60}m`;
};

const responseMessage = (response, fallback) => response?.message || response?.msg || fallback;

export default function AttendanceWorkspace({ onUpdate }) {
    const [currentTime, setCurrentTime]       = useState(dayjs());
    const [attendance, setAttendance]         = useState(null);
    const [initialLoading, setInitialLoading] = useState(true);
    const [actionLoading, setActionLoading]   = useState(null);

    useEffect(() => {
        const timer = window.setInterval(() => setCurrentTime(dayjs()), 1000);
        return () => window.clearInterval(timer);
    }, []);

    const fetchAttendance = useCallback(async () => {
        setInitialLoading(true);
        try {
            const response = await getDatas("/admin/attendance/my-attendance");
            if (response?.success) {
                setAttendance(response.result || null);
            } else if (response?.message === "Not found") {
                setAttendance(null);
            } else {
                message.error(responseMessage(response, "Unable to load today's attendance"));
            }
        } finally {
            setInitialLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAttendance();
    }, [fetchAttendance]);

    const runAttendanceAction = async (type) => {
        setActionLoading(type);
        try {
            const endpoint = type === "in" ? "check-in" : "check-out";
            const response = await postData(`/admin/attendance/${endpoint}`, {});

            if (!response?.success) {
                message.error(responseMessage(response, `Unable to check ${type}`));
                return;
            }

            setAttendance(response.result || null);
            message.success(response.msg || `Check ${type} successful`);
            onUpdate?.(response.result);
        } catch (error) {
            console.error(error);
            message.error(`Unable to check ${type}. Please try again.`);
        } finally {
            setActionLoading(null);
        }
    };

    const workingMinutes = useMemo(() => {
        if (!attendance?.check_in_at) return 0;
        if (attendance.check_out_at) return Number(attendance.working_minutes || 0);
        return Math.max(0, currentTime.diff(dayjs(attendance.check_in_at), "minute"));
    }, [attendance, currentTime]);

    const scheduledMinutes = useMemo(() => {
        if (!attendance?.scheduled_start_at || !attendance?.scheduled_end_at) return 0;
        return Math.max(0, dayjs(attendance.scheduled_end_at).diff(dayjs(attendance.scheduled_start_at), "minute"));
    }, [attendance]);

    const progress = scheduledMinutes ? Math.min(100, Math.round((workingMinutes / scheduledMinutes) * 100)) : 0;
    const status = String(attendance?.status || "not_started").toLowerCase();
    const statusLabels = {
        present: "Present", late: "Late", half_day: "Half Day", absent: "Absent",
        holiday: "Holiday", weekly_off: "Weekly Off", on_leave: "On Leave", not_started: "Not Started",
    };

    return (
        <section className="attendance-workspace">
            <div className="attendance-workspace__top">
                <div>
                    <div className="attendance-workspace__eyebrow">
                        Today&apos;s attendance
                    </div>

                    <h2>
                        Start your workday
                    </h2>

                    <p>
                        Your attendance is recorded securely using your signed-in account.
                    </p>
                </div>
                <div className="attendance-live-clock">
                    <ClockCircleOutlined />
                    <div>
                        <strong>
                            {currentTime.format("hh:mm:ss A")}
                        </strong>

                        <span>
                            {currentTime.format("dddd, DD MMMM YYYY")}
                        </span>
                    </div>
                </div>
            </div>

            <Spin spinning={initialLoading}>
                <div className="attendance-workspace__body">
                    <div className="attendance-main-card">
                        <div className="attendance-main-card__status">
                            <div className={`attendance-status-icon attendance-status-icon--${status}`}>
                                {attendance?.check_in_at ? <CheckCircleFilled /> : <FieldTimeOutlined />}
                            </div>

                            <div>
                                <span>
                                    Current status
                                </span>
                                <strong>
                                    {statusLabels[status] || status}
                                </strong>
                            </div>

                            <Tag className={`attendance-status-tag attendance-status-tag--${status}`}>
                                {attendance?.check_out_at ? "Day completed" : attendance?.check_in_at ? "Working now" : "Awaiting check-in"}
                            </Tag>
                        </div>

                        <div className="attendance-shift-row">
                            <div>
                                <span>
                                    Scheduled shift
                                </span>
                                <strong>
                                    {attendance?.scheduled_start_at ? dayjs(attendance.scheduled_start_at).format("hh:mm A") : "—"}<b>→</b>{attendance?.scheduled_end_at ? dayjs(attendance.scheduled_end_at).format("hh:mm A") : "—"}
                                </strong>
                            </div>

                            <div>
                                <span>
                                    Work progress
                                </span>

                                <strong>
                                    {formatDuration(workingMinutes)}
                                </strong>
                            </div>
                        </div>

                        <Progress percent={progress} showInfo={false} strokeColor={{ "0%": "#0ea5e9", "100%": "#10b981" }} trailColor="#e8eef5" />

                        <div className="attendance-actions">
                            <Button type="primary" size="large" icon={<LoginOutlined />} loading={actionLoading === "in"} disabled={Boolean(attendance?.check_in_at) || Boolean(actionLoading)} onClick={() => runAttendanceAction("in")} className="attendance-check-in-btn">
                                {attendance?.check_in_at ? `Checked in ${dayjs(attendance.check_in_at).format("hh:mm A")}` : "Check In Now"}
                            </Button>

                            <Button size="large" danger icon={<LogoutOutlined />} loading={actionLoading === "out"} disabled={!attendance?.check_in_at || Boolean(attendance?.check_out_at) || Boolean(actionLoading)} onClick={() => runAttendanceAction("out")}>
                                {attendance?.check_out_at ? `Checked out ${dayjs(attendance.check_out_at).format("hh:mm A")}` : "Check Out"}
                            </Button>

                            <Button icon={<ReloadOutlined />} onClick={fetchAttendance} disabled={Boolean(actionLoading)}>
                                Refresh
                            </Button>
                        </div>
                    </div>

                    <div className="attendance-metrics">
                        <article>
                            <LoginOutlined />
                            <div>
                                <span>
                                    Check In
                                </span>

                                <strong>
                                    {attendance?.check_in_at ? dayjs(attendance.check_in_at).format("hh:mm A") : "—"}
                                </strong>
                            </div>
                        </article>

                        <article>
                            <LogoutOutlined />
                            <div>
                                <span>
                                    Check Out
                                </span>
                                <strong>
                                    {attendance?.check_out_at ? dayjs(attendance.check_out_at).format("hh:mm A") : "—"}
                                </strong>
                            </div>
                        </article>

                        <article className={Number(attendance?.late_minutes) > 0 ? "is-warning" : ""}>
                            <WarningFilled />
                            <div>
                                <span>
                                    Late Time
                                </span>
                                <strong>
                                    {formatDuration(attendance?.late_minutes)}
                                </strong>
                            </div>
                        </article>

                        <article>
                            <ClockCircleOutlined />
                            <div>
                                <span>
                                    Working Time
                                </span>
                                <strong>
                                    {formatDuration(workingMinutes)}
                                </strong>
                            </div>
                        </article>

                        <article>
                            <FieldTimeOutlined />
                            <div>
                                <span>
                                    Early Leave
                                </span>
                                <strong>
                                    {formatDuration(attendance?.early_leave_minutes)}
                                </strong>
                            </div>
                        </article>

                    </div>
                </div>
            </Spin>

            {!initialLoading && !attendance && 
                <div className="attendance-workspace__notice">
                    <Text type="secondary">
                        No attendance recorded yet. Use “Check In Now” when your shift begins.
                    </Text>
                </div>
            }
        </section>
    );
}
