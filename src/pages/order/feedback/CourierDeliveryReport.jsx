import { useMemo, useState } from "react";
import { Card, Empty, Progress, Table, Button, Space, Tag } from "antd";

export default function CourierDeliveryReport({ data, onRecheck }) {
    const {
        courier_delivery_report = [],
        overall_success_percentage = 0,
    } = data || {};

    const [showDetails, setShowDetails] = useState(false);

    const round = (n) => Math.round((Number(n) || 0) * 100) / 100;
    const safePercent = (part, total) => Number(total) > 0 ? round((Number(part) / Number(total)) * 100) : 0;

    const overallSuccess = useMemo(() => round(overall_success_percentage), [overall_success_percentage]);

    const columns = 
    [
        {
            title: "Courier",
            dataIndex: "courier_name",
            key: "courier_name",
            render: (name) => <strong>{name}</strong>,
            fixed: "left",
        },
        {
            title: "Total",
            dataIndex: "total_parcels",
            align: "center",
            width: 90,
        },
        {
            title: "Delivered",
            dataIndex: "delivered_parcels",
            align: "center",
            width: 150,
            render: (val, row) => (
                <div>
                    <Tag color="green" style={{ marginBottom: 6 }}>
                        {val}
                    </Tag>
                    <Progress percent={safePercent(val, row.total_parcels)} size="small" strokeColor="#52c41a" format={(p) => `${p}%`}/>
                </div>
            ),
        },
        {
            title: "Canceled",
            dataIndex: "canceled_parcels",
            align: "center",
            width: 150,
            render: (val, row) => (
                <div>
                <Tag color="red" style={{ marginBottom: 6 }}>
                    {val}
                </Tag>
                <Progress percent={safePercent(val, row.total_parcels)} size="small" strokeColor="#ff4d4f" format={(p) => `${p}%`}/>
                </div>
            ),
        },
        {
            title: "Success %",
            dataIndex: "success_percentage",
            align: "center",
            width: 140,
            render: (p) => (
                <Progress percent={round(p)} size="small" strokeColor="#52c41a" format={(val) => `${val}%`}/>
            ),
        },
        {
            title: "Cancel %",
            dataIndex: "cancel_percentage",
            align: "center",
            width: 140,
            render: (p) => (
                <Progress percent={round(p)} size="small" strokeColor="#ff4d4f" format={(val) => `${val}%`}/>
            ),
        },
    ];

    return (
        <Card>
        <div style={{display: "flex",justifyContent: "space-between",alignItems: "center",gap: 12,marginBottom: 8,}}> 
            <div style={{ minWidth: 160, fontWeight: 600, color: "#7a7a7a" }}>
                Delivery Success Rate
            </div>

            <Space>
                <Button size="small" style={{backgroundColor: "#1C558B",color: "#fff",border: "none",}}onClick={() => onRecheck?.()} disabled={!onRecheck}> Re-Check </Button>

                <Button size="small" style={{ color: "#1C558B" }} onClick={() => setShowDetails((p) => !p)}>
                    Details
                </Button>
            </Space>
        </div>


        <Progress percent={overallSuccess} strokeColor="#1C558B" strokeWidth={10} format={(p) => `${Math.round(p)}%`}/>

        {showDetails && (
            <div style={{ marginTop: 12 }}>
            <Table rowKey="courier_name" columns={columns} dataSource={courier_delivery_report} pagination={false} size="middle" scroll={{ x: 720 }}
                locale={{ emptyText: <Empty description="No courier data" /> }}
            />
            </div>
        )}
        </Card>
    );
}
