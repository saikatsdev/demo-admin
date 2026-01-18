import { Modal, Spin, Table } from "antd";
import { useEffect, useState } from "react";
import { getDatas } from "../../api/common/common";

const DeliveryReportModal = ({ visible, phoneNumber, onClose }) => {
    // State
    const [loadingReport, setLoadingReport] = useState(false);
    const [reportData, setReportData] = useState(null);

    const columns = 
    [
        { 
            title: "Courier", 
            dataIndex: "courier_name" 
        },
        { 
            title: "Total", 
            dataIndex: "total_parcels" 
        },
        { 
            title: "Delivered", 
            dataIndex: "delivered_parcels" 
        },
        { 
            title: "Canceled", 
            dataIndex: "canceled_parcels" 
        },
        {
            title: "Success %",
            dataIndex: "success_percentage",
            render: (v) => (
                <span className={`success-percent ${v <= 80 ? "warning" : ""}`}>
                    {v?.toFixed(2)}
                </span>
            ),
        },
        {
            title: "Cancel %",
            dataIndex: "cancel_percentage",
            render: (v) => (
                <span className={`cancel-percent ${v > 20 ? "high" : ""}`}>
                    {v?.toFixed(2)}
                </span>
            ),
        },
    ]

    const fetchDeliveryReport = async () => {
        if (!phoneNumber) return;

        try {
            setLoadingReport(true);
            const res = await getDatas("/admin/orders/courier/delivery/report", {
                phone_number: phoneNumber,
            });

            if (res?.success) {
                const report = res.result.courier_delivery_report;

                const couriers = Object.keys(report)
                    .filter(key => key !== "summary")
                    .map(key => {
                        const c = report[key];

                        const total = Number(c.total_parcel || 0);
                        const success = Number(c.success_parcel || 0);
                        const cancel = Number(c.cancelled_parcel || 0);

                        const successPercentage = total > 0 ? (success / total) * 100 : 0;
                        const cancelPercentage = total > 0 ? (cancel / total) * 100 : 0;

                        return {
                            courier_key: key,
                            courier_name: c.name,
                            logo: c.logo,
                            total_parcels: total,
                            delivered_parcels: success,
                            canceled_parcels: cancel,
                            success_percentage: successPercentage,
                            cancel_percentage: cancelPercentage,
                        };
                    });

                const summary = report.summary;

                const total = Number(summary.total_parcel || 0);
                const success = Number(summary.success_parcel || 0);
                const cancel = Number(summary.cancelled_parcel || 0);

                const successRate = total > 0 ? (success / total) * 100 : 0;
                const cancelRate = total > 0 ? (cancel / total) * 100 : 0;

                setReportData({
                    couriers,
                    summary: {
                        ...summary,
                        success_rate: successRate,
                        cancel_rate: cancelRate,
                    },
                    order_summary: res.result.order_summary,
                });
            }

        } catch (error) {
            console.error("Error fetching delivery report:", error);
        } finally {
            setLoadingReport(false);
        }
    };

    useEffect(() => {
        if (visible && phoneNumber) {
            fetchDeliveryReport();
        }
    }, [visible, phoneNumber]);

    return (
        <Modal open={visible} title={`Delivery Report — ${phoneNumber}`} onCancel={onClose} footer={null} width={700} className="delivery-modal" destroyOnClose>
            {loadingReport ? (
                <div className="loading-spinner">
                    <Spin size="large" />
                </div>
            ) : reportData ? (
                <>
                    <div className="status-cards">
                        <div className="status-card success-card">
                            <h4>Overall Success Rate</h4>
                            <p>{reportData?.summary?.success_rate?.toFixed(2)}%</p>
                        </div>

                        <div className="status-card cancel-card">
                            <h4>Overall Cancel Rate</h4>
                            <p>{reportData?.summary?.cancel_rate?.toFixed(2)}%</p>
                        </div>
                    </div>

                <Table size="middle" bordered dataSource={reportData.couriers} pagination={false} rowKey="courier_key" columns={columns} rowClassName={(record, index) => index % 2 === 0 ? "table-row-light" : "table-row-dark"} style={{ marginBottom: 24, borderRadius: 8, overflow: "hidden" }}/>

                    <div className="order-summary">
                        <h4>Order Summary</h4>
                        <p>Total Orders: {reportData.order_summary.total_order}</p>
                        <p>Total Amount: {reportData.order_summary.total_amount}</p>
                    </div>
                </>
            ) : (
                <p className="no-data">No data available for this number.</p>
            )}
        </Modal>
    );
};

export default DeliveryReportModal;
