import { Modal, Spin, Button, Table, message, Row, Col,Descriptions, Tag, Space, Typography, Card, Divider } from "antd";
import { useEffect, useState } from "react";
import { CopyOutlined, CreditCardOutlined, UserOutlined, WalletOutlined, CheckCircleOutlined, ExclamationCircleOutlined } from "@ant-design/icons";
import { getDatas } from "../../api/common/common";

const { Text, Title } = Typography;

const DigitalSaleModal = ({ open, onClose, orderId }) => {
    // State
    const [loading, setLoading]         = useState(false);
    const [orderData, setOrderData]     = useState(null);
    const [messageApi, contextHolder]   = message.useMessage();

    useEffect(() => {
        if (!open || !orderId) return;

        const fetchedOrderInfo = async () => {
            try {
                setLoading(true);
                const res = await getDatas(`/admin/orders/${orderId}`);
                if (res && res?.success) {
                    setOrderData(res.result);
                }
            } catch (error) {
                console.error("Error fetching digital sale info:", error);
                message.error("Failed to load transaction details.");
            } finally {
                setLoading(false);
            }
        };

        fetchedOrderInfo();
    }, [open, orderId]);

    const handleCopy = (value, label) => {
        if (!value) return;
        navigator.clipboard.writeText(value);
        messageApi.success(`${label} copied to clipboard!`);
    };

    const columns = [
        {
            title: "Gateway",
            key: "payment_gateway",
            render: (_, record) => (
                <Space>
                    <CreditCardOutlined style={{ color: '#1890ff' }} />
                    <Text strong>{record?.payment_gateway?.name || orderData?.payment_gateway?.name || "N/A"}</Text>
                </Space>
            ),
        },
        {
            title: "Transaction ID",
            key: "trx",
            render: (_, record) => {
                const trxId = record?.payment_gateway_trx_id || orderData?.payment_gateway_trx_id;
                return trxId ? (
                    <Space>
                        <Text code>{trxId}</Text>
                        <Button 
                            type="text" 
                            size="small" 
                            icon={<CopyOutlined />} 
                            onClick={() => handleCopy(trxId, "Transaction ID")} 
                        />
                    </Space>
                ) : "N/A";
            },
        },
        {
            title: "Sender Number",
            key: "send",
            render: (_, record) => record?.payment_send_number || orderData?.payment_send_number || "N/A",
        },
        {
            title: "Amount",
            key: "amount",
            align: 'right',
            render: (_, record) => (
                <Text strong style={{ color: '#52c41a' }}>
                    ৳{Number(record?.amount || orderData?.payable_price || 0).toLocaleString()}
                </Text>
            ),
        }
    ];

    // Determine status tag
    const getStatusTag = (status) => {
        const s = status?.toLowerCase();
        if (s === 'paid') return <Tag color="success" icon={<CheckCircleOutlined />}>PAID</Tag>;
        if (s === 'unpaid') return <Tag color="warning" icon={<ExclamationCircleOutlined />}>UNPAID</Tag>;
        return <Tag color="default">{status?.toUpperCase() || 'N/A'}</Tag>;
    };

    return (
        <>
            {contextHolder}
            <Modal 
                title={
                    <Space>
                        <WalletOutlined style={{ color: '#1890ff' }} />
                        <span style={{ fontWeight: 700 }}>Transaction & Payment Details</span>
                        {orderData?.invoice_number && <Tag color="blue">#{orderData.invoice_number}</Tag>}
                    </Space>
                } 
                open={open} 
                onCancel={onClose} 
                footer={[
                    <Button key="close" onClick={onClose}>Close</Button>
                ]} 
                width={800} 
                destroyOnClose
                centered
            >
                <Spin spinning={loading}>
                    {orderData ? (
                        <div style={{ padding: '4px 0' }}>
                            <Row gutter={24}>
                                <Col span={12}>
                                    <Descriptions title={<Space><UserOutlined /> Customer Details</Space>} bordered column={1} size="small">
                                        <Descriptions.Item label="Name">{orderData.customer_name || "N/A"}</Descriptions.Item>
                                        <Descriptions.Item label="Email">
                                            <Space>
                                                {orderData.email || orderData.customer_email || "N/A"}
                                                {(orderData.email || orderData.customer_email) && (
                                                    <Button type="text" size="small" icon={<CopyOutlined />} onClick={() => handleCopy(orderData.email || orderData.customer_email, "Email")} />
                                                )}
                                            </Space>
                                        </Descriptions.Item>
                                        <Descriptions.Item label="Phone">{orderData.phone_number || "N/A"}</Descriptions.Item>
                                    </Descriptions>
                                </Col>
                                <Col span={12}>
                                    <Descriptions title={<Space><CreditCardOutlined /> Payment Summary</Space>} bordered column={1} size="small">
                                        <Descriptions.Item label="Gateway">
                                            <Tag color="geekblue" style={{ fontWeight: 600 }}>
                                                {orderData.payment_gateway?.name || "Manual / COD"}
                                            </Tag>
                                        </Descriptions.Item>
                                        <Descriptions.Item label="Paid Status">
                                            {getStatusTag(orderData.paid_status)}
                                        </Descriptions.Item>
                                        <Descriptions.Item label="Total Payable">
                                            <Text strong style={{ color: '#1677ff', fontSize: '16px' }}>
                                                ৳{Number(orderData.payable_price || 0).toLocaleString()}
                                            </Text>
                                        </Descriptions.Item>
                                    </Descriptions>
                                </Col>
                            </Row>

                            <Divider orientation="left" style={{ marginTop: 24 }}>
                                <Text strong><CreditCardOutlined /> Transaction Records</Text>
                            </Divider>

                            {orderData.transaction ? (
                                <Table 
                                    dataSource={[orderData.transaction]} 
                                    rowKey="id" 
                                    columns={columns} 
                                    pagination={false} 
                                    size="small" 
                                    bordered
                                />
                            ) : (
                                <Card size="small" style={{ textAlign: 'center', background: '#fafafa', border: '1px dashed #d9d9d9' }}>
                                    <Space direction="vertical">
                                        <ExclamationCircleOutlined style={{ fontSize: 24, color: '#faad14' }} />
                                        <Text type="secondary">No automated transaction log found for this order.</Text>
                                        {orderData.payment_gateway_trx_id && (
                                            <Text>Manual Trx ID: <Text code>{orderData.payment_gateway_trx_id}</Text></Text>
                                        )}
                                    </Space>
                                </Card>
                            )}
                        </div>
                    ) : (
                        !loading && (
                            <div style={{ textAlign: 'center', padding: '40px 0' }}>
                                <ExclamationCircleOutlined style={{ fontSize: 48, color: '#ffa39e', marginBottom: 16 }} />
                                <Title level={4}>Order Data Not Found</Title>
                                <Text type="secondary">We couldn't retrieve the payment details for this order ID.</Text>
                            </div>
                        )
                    )}
                </Spin>
            </Modal>
        </>
    );
};

export default DigitalSaleModal;
