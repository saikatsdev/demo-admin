import { Modal, Timeline, Tag, Typography, Divider, Empty } from "antd";

const eventMapBn = {
    "order.created": {
        title: "অর্ডার তৈরি হয়েছে",
        color: "blue",
        note: "কুরিয়ার সিস্টেমে নতুন অর্ডার তৈরি করা হয়েছে"
    },
    "order.updated": {
        title: "অর্ডার আপডেট হয়েছে",
        color: "orange",
        note: "অর্ডারের স্ট্যাটাস বা তথ্য পরিবর্তন করা হয়েছে"
    },
    "order.picked": {
        title: "পণ্য সংগ্রহ করা হয়েছে",
        color: "purple",
        note: "কুরিয়ার পণ্য সংগ্রহ করেছে"
    },
    "order.in_transit": {
        title: "ডেলিভারির পথে",
        color: "cyan",
        note: "পণ্য ডেলিভারির জন্য পথে রয়েছে"
    },
    "order.delivered": {
        title: "ডেলিভারি সম্পন্ন",
        color: "green",
        note: "পণ্য সফলভাবে গ্রাহকের কাছে পৌঁছেছে"
    },
    "order.cancelled": {
        title: "অর্ডার বাতিল",
        color: "red",
        note: "অর্ডারটি বাতিল করা হয়েছে"
    }
};

const formatDate = (date) =>
    new Date(date).toLocaleString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });

export default function CourierStatusModal({ open, onClose, data }) {

    const logs = [...(data || [])].sort(
        (a, b) => new Date(b.updated_at) - new Date(a.updated_at)
    );

    return (
        <Modal title="Courier Status Timeline" open={open} onCancel={onClose} footer={null} width={700}>
            {logs.length ? (
                <Timeline mode="left">
                    {logs.map((log, index) => {
                        const eventInfo = eventMapBn[log.event] || { title: "অজানা আপডেট", color: "gray", note: "অর্ডারে একটি পরিবর্তন হয়েছে"};

                        return (
                            <Timeline.Item key={index} color={eventInfo.color} label={formatDate(log.updated_at)}>
                                <div style={{ marginBottom: 6 }}>
                                    <Tag color={eventInfo.color}>
                                        {eventInfo.title}
                                    </Tag>

                                    <Typography.Text strong style={{ marginLeft: 8 }}>
                                        Order ID: {log.merchant_order_id}
                                    </Typography.Text>
                                </div>

                                <Typography.Text>
                                    {eventInfo.note}
                                </Typography.Text>

                                {log.reason && (
                                    <>
                                        <br />
                                        <Typography.Text type="danger">
                                            কারণ: {log.reason}
                                        </Typography.Text>
                                    </>
                                )}

                                <Divider style={{ margin: "8px 0" }} />

                                <div style={{ fontSize: 12, color: "#666" }}>
                                    <div>Consignment ID: {log.consignment_id}</div>
                                    <div>Store ID: {log.store_id}</div>
                                </div>
                            </Timeline.Item>
                        );
                    })}
                </Timeline>
            ) : (
                <Empty description="কোনো কুরিয়ার স্ট্যাটাস পাওয়া যায়নি" />
            )}
        </Modal>
    );
}
