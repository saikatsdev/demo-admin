import { useEffect, useState } from "react";
import { Modal, Table, Spin, Tag, Divider, Typography } from "antd";
import { getDatas } from "../../api/common/common";

const { Title, Text } = Typography;

export default function UpsellProducts({ upsellId, onClose }) {
    // State
    const [loading, setLoading]                 = useState(false);
    const [offerProducts, setOfferProducts]     = useState([]);
    const [triggerProducts, setTriggerProducts] = useState([]);
    const [info, setInfo]                       = useState(null);

    useEffect(() => {
        const fetchProducts = async () => {
            setLoading(true);
            try {
                const res = await getDatas(`/admin/up-sells/${upsellId}`);

                const result = res?.result || {};

                setInfo(result);
                setOfferProducts(result.offer_products || []);
                setTriggerProducts(result.trigger_products || []);
                
            } finally {
                setLoading(false);
            }
        };

        fetchProducts();
    }, [upsellId]);

    const productColumns = 
    [
        {
            title: "Product",
            key: "product",
            render: (_, p) => (
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <img src={p.img_path} alt={p.name} style={{width: 45,height: 45,borderRadius: 6,objectFit: "cover",border: "1px solid #eee"}}/>
                    <div>
                        <Text strong>{p.name}</Text>
                        <div style={{ fontSize: 12, color: "#888" }}>SKU: {p.sku}</div>
                    </div>
                </div>
            ),
        },
        {
            title: "Price",
            render: (_, p) => (
                <div>
                    <Text>MRP: {p.mrp}</Text>
                    <br />
                    <Text type="success">Sell: {p.sell_price}</Text>
                </div>
            ),
        },
        {
            title: "Stock",
            dataIndex: "current_stock",
            render: (v) => <Tag color="blue">{v}</Tag>,
        },
    ];

    const offerColumns = [
        ...productColumns,
        {
            title: "Custom Name",
            dataIndex: ["pivot", "custom_name"],
        },
        {
            title: "Discount",
            render: (_, p) => (
                <Tag color="green">
                    {p.pivot?.discount_type} — {p.pivot?.discount_amount}
                </Tag>
            ),
        },
    ];
    return (
        <>
            <Modal open title={`Upsell Details — ${info?.title || ""}`} onCancel={onClose} footer={null} width={900}>
                {loading ? (
                    <div style={{ textAlign: "center", padding: 30 }}>
                        <Spin size="large" />
                    </div>
                ) : (
                    <>
                        <div style={{ marginBottom: 10 }}>
                            <Text>Status: </Text>
                                <Tag color={info?.status === "active" ? "green" : "red"} style={{textTransform:"capitalize"}}>
                                    {info?.status}
                                </Tag>

                            {info?.is_all ? (
                                <Tag color="blue">Applies to ALL Products</Tag>
                            ) : (
                                <Tag color="gold">Conditional Trigger</Tag>
                            )}
                        </div>

                        <Title level={5} style={{ marginTop: 10 }}>
                            Trigger Products
                        </Title>

                        <Table size="small" columns={productColumns} dataSource={triggerProducts} rowKey="id" pagination={false} bordered/>

                        <Divider />

                        <Title level={5}>Offer Products</Title>
                        <Table size="small" columns={offerColumns} dataSource={offerProducts} rowKey="id" pagination={false} bordered/>
                    </>
                )}
            </Modal>
        </>
    )
}
