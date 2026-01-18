import { useEffect, useMemo, useState } from "react";
import { Modal, Timeline, Typography, Skeleton, Tag, Empty } from "antd";
import { CheckCircleFilled, ClockCircleOutlined } from "@ant-design/icons";
import { getDatas } from "../../api/common/common";

const { Text } = Typography;

const formatDateTime = (date) => new Date(date).toLocaleString("bn-BD", {day: "2-digit",month: "long",year: "numeric",hour: "2-digit",minute: "2-digit",hour12: true,});

const getActor = (item) => {
    if (item.user?.username) {
        return `${item.user.username} (Employee ID: ${
            item.user?.id ?? "N/A"
        })`;
    }
    return "System";
};

export default function OrderHistoryModal({ orderId, open, onClose }) {
    // State
    const [history, setHistory] = useState([]);
    const [statusMap, setStatusMap] = useState({});
    const [loading, setLoading] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [historyRes, statusRes] = await Promise.all([
                getDatas(`/admin/orders/history/${orderId}`),
                getDatas("/admin/statuses/list"),
            ]);

            const map = {};
            statusRes?.result?.forEach((s) => {map[s.id] = s;});

            setStatusMap(map);
            setHistory(historyRes?.result || []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (open && orderId) fetchData();
    }, [open, orderId]);

    const timelineItems = useMemo(() => {
        return history.filter((item) => item.event === "created" || (item.event === "updated" && item.new_values?.current_status_id))
        .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    }, [history]);

    return (
        <Modal title="Order History" open={open} onCancel={onClose} footer={null} width={720}>
            {loading ? (
                <Skeleton active />
            ) : timelineItems.length === 0 ? (
                <Empty description="No order history found" />
            ) : (
                <Timeline mode="left" items={timelineItems.map((item, index) => {const isCreated = item.event === "created";
                    const status = statusMap[item.new_values?.current_status_id];

                    return {
                        dot:
                            index === 0 ? (
                                <CheckCircleFilled
                                    style={{ color: "#52c41a", fontSize: 16 }}
                                />
                            ) : (
                                <ClockCircleOutlined
                                    style={{ color: "#bfbfbf", fontSize: 14 }}
                                />
                            ),
                    children: (
                        <div>
                            <Text strong>
                                {isCreated ? "Order Created" : "Status Updated"}
                                {!isCreated && status && (
                                    <Tag style={{marginLeft: 8,backgroundColor: status.bg_color,color: status.text_color,border: "none",}}>
                                        {status.name}
                                    </Tag>
                                )}
                            </Text>

                            <div style={{ marginTop: 6 }}>
                                <Text type="secondary">
                                    by {getActor(item)}
                                </Text>
                            </div>

                            <div style={{ marginTop: 2 }}>
                                <Text type="secondary" style={{ fontSize: 12 }}>
                                    {formatDateTime(item.created_at)}
                                </Text>
                            </div>
                        </div>
                    ),
                    };
                })}
                />
            )}
        </Modal>
    );
}
