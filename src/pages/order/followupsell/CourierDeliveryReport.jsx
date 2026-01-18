import { useMemo, useState } from "react";
import { Card, Empty, Progress, Table, Button, Space, Tag } from "antd";

export default function CourierDeliveryReport({ data, onRecheck }) {
    const { courier_delivery_report = {} } = data || {};

    const [showDetails, setShowDetails] = useState(true);

    const round = (n) => Math.round(Number(n || 0));

    const tableData = useMemo(() => {
        if (!courier_delivery_report || typeof courier_delivery_report !== "object") {
            return [];
        }

        return Object.entries(courier_delivery_report)
            .filter(([key]) => key !== "summary")
            .map(([_, courier]) => {
                const total = Number(courier.total_parcel || 0);
                const delivered = Number(courier.success_parcel || 0);
                const canceled = Number(courier.cancelled_parcel || 0);

                return {
                    courier_name      : courier.name,
                    logo              : courier.logo,
                    total_parcels     : total,
                    delivered_parcels : delivered,
                    canceled_parcels  : canceled,
                    success_percentage: total > 0 ? round((delivered / total) * 100): 0,
                    cancel_percentage : total > 0 ? round((canceled / total) * 100) : 0,
                };
            });
    }, [courier_delivery_report]);

    const overallSuccess = useMemo(() => {
        return round(courier_delivery_report?.summary?.success_ratio || 0);
    }, [courier_delivery_report]);

    const columns = [
        {
            title: "Courier",
            dataIndex: "courier_name",
            fixed: "left",
            render: (_, row) => (
                <Space>
                    {row.logo && (
                        <img
                            src={row.logo}
                            alt={row.courier_name}
                            style={{ width: 22, height: 22, objectFit: "contain" }}
                        />
                    )}
                    <strong>{row.courier_name}</strong>
                </Space>
            ),
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
                <>
                    <Tag color="green">{val}</Tag>
                    <Progress percent={row.success_percentage} size="small" strokeColor="#52c41a" format={(p) => `${p}%`}/>
                </>
            ),
        },
        {
            title: "Canceled",
            dataIndex: "canceled_parcels",
            align: "center",
            width: 150,
            render: (val, row) => (
                <>
                    <Tag color="red">{val}</Tag>
                    <Progress percent={row.cancel_percentage} size="small" strokeColor="#ff4d4f" format={(p) => `${p}%`}/>
                </>
            ),
        },
        {
            title: "Success %",
            dataIndex: "success_percentage",
            align: "center",
            width: 120,
            render: (p) => (
                <Progress percent={p} size="small" strokeColor="#52c41a" format={(v) => `${v}%`}/>
            ),
        },
        {
            title: "Cancel %",
            dataIndex: "cancel_percentage",
            align: "center",
            width: 120,
            render: (p) => (
                <Progress percent={p} size="small" strokeColor="#ff4d4f" format={(v) => `${v}%`}/>
            ),
        },
    ];

    return (
        <Card>
            <div style={{display: "flex",justifyContent: "space-between",alignItems: "center",marginBottom: 12}}>
                <div style={{ fontWeight: 600, color: "#7a7a7a" }}>
                    Delivery Success Rate
                </div>

                <Space>
                    <Button size="small" style={{ backgroundColor: "#1C558B", color: "#fff" }} onClick={onRecheck}>
                        Re-Check
                    </Button>

                    <Button size="small" type="link" onClick={() => setShowDetails((p) => !p)}>
                        {showDetails ? "Hide" : "Details"}
                    </Button>
                </Space>
            </div>

            <Progress percent={overallSuccess} strokeColor="#1C558B" strokeWidth={10} format={(p) => `${p}%`}/>

            {/* Table */}
            {showDetails && (
                <div style={{ marginTop: 16 }}>
                    <Table rowKey="courier_name" columns={columns} dataSource={tableData} pagination={false} size="middle" scroll={{ x: 900 }}
                        locale={{emptyText: <Empty description="No courier data" />}}
                    />
                </div>
            )}
        </Card>
    );
}
