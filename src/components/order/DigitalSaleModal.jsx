import { Modal,Spin,Button,Table,message,Descriptions  } from "antd";
import { useEffect, useState } from "react";
import { CopyOutlined } from "@ant-design/icons";
import { getDatas } from "../../api/common/common";

const DigitalSaleModal = ({ open, onClose, orderId }) => {
    // State
    const [loading, setLoading]         = useState(false);
    const [transaction, setTransaction] = useState(null);
    const [customer, setCustomer]       = useState({ name: "", email: "" });
    const [messageApi, contextHolder]   = message.useMessage();

    useEffect(() => {
        if(!open || !orderId) return;

        const fetchedOrderInfo = async () => {
            try {
                setLoading(true);

                const res = await getDatas(`/admin/orders/${orderId}`);

                if(res && res?.success){
                    const result = res.result;
                    setTransaction(result.transaction || null);
                    setCustomer({
                        name: result.customer_name || "N/A",
                        email: result.customer_email || "N/A",
                    });
                }
            } catch (error) {
                console.log(error);
            }finally{
                setLoading(false);
            }
        };

        fetchedOrderInfo();
    }, [open, orderId]);

    const handleCopy = (value) => {
        navigator.clipboard.writeText(value || "");
        
        messageApi.open({
            type: "success",
            content: "Copied to clipboard!",
        });
    };

    const columns = 
    [
        {
            title: "Payment Gateway",
            key: "payment_gateway",
            render: (_, record) => record?.payment_gateway?.name || "N/A",
        },
        {
            title: "Transaction ID",
            key: "trx",
            render: (_, record) => record?.payment_gateway_trx_id || "N/A",
        },
        {
            title: "Send Number",
            key: "send",
            render: (_, record) => record?.payment_send_number || "N/A",
        },
        {
            title: "Action",
            key: "action",
            render: (_, record) => (
                <Button size="small" icon={<CopyOutlined />} disabled={!record?.payment_gateway_trx_id} onClick={() => handleCopy(record?.payment_gateway_trx_id)}>
                    Copy TRX
                </Button>
            ),
        },
    ];


    return (
        <>
            {contextHolder}
            <Modal title={`Transaction Info (Order #${orderId})`} open={open} onCancel={onClose} footer={null} width={800} destroyOnClose>
                <Spin spinning={loading}>
                    <Descriptions title="Customer Info" bordered column={1} size="small" style={{ marginBottom: 16 }}>
                        <Descriptions.Item label="Customer Name">
                            {customer.name}
                        </Descriptions.Item>

                        <Descriptions.Item label="Customer Email">
                            <span style={{ marginRight: 8 }}>{customer.email}</span>
                            {customer.email !== "N/A" && (
                                <Button size="small" icon={<CopyOutlined />} onClick={() => handleCopy(customer.email)}>
                                    Copy
                                </Button>
                            )}
                        </Descriptions.Item>
                    </Descriptions>

                    {transaction ? (
                        <Table dataSource={transaction ? [transaction] : []}  rowKey="id" columns={columns} pagination={false} size="small"/>
                    ) : (
                        !loading && <p>No transaction data found.</p>
                    )}
                </Spin>
            </Modal>
        </>
    );
};

export default DigitalSaleModal;
