import { CalendarOutlined, ShopOutlined, UserOutlined } from "@ant-design/icons";
import { Button, Descriptions, Modal, Table, Tag, Typography } from "antd";
import dayjs from "dayjs";

const { Text, Title } = Typography;
const money           = (value) => `৳ ${Number(value || 0).toLocaleString("en-BD", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const color           = (status) => ({ draft: "gold", completed: "green", paid: "green", partial: "blue", unpaid: "red" }[status] || "default");

export default function PurchaseDetails({ purchase, onClose }) {
    if (!purchase) return null;
    const columns = 
    [
        { 
            title: "Product", 
            render: (_, item) => 
            <div>
                <Text strong>
                    {item.product_name}
                </Text>
                {item.variation_name && 
                    <div>
                        <Text type="secondary">
                            {item.variation_name}
                        </Text>
                    </div>
                }
                {item.sku && 
                    <div className="purchase-item-sku">
                        {item.sku}
                    </div>
                }
            </div> 
        },
        { 
            title: "Qty", 
            dataIndex: "quantity", 
            width: 70, 
            align: "center" 
        },
        { 
            title: "Buy price", 
            dataIndex: "unit_cost", 
            width: 120, 
            align: "right", 
            render: money 
        },
        { 
            title: "Discount", 
            dataIndex: "discount_amount", 
            width: 110, 
            align: "right", 
            render: money 
        },
        { 
            title: "Tax", 
            dataIndex: "tax_amount", 
            width: 100, 
            align: "right", 
            render: money 
        },
        { 
            title: "Total", 
            dataIndex: "line_total", 
            width: 125, 
            align: "right", 
            render: (value) => 
            <Text strong>
                {money(value)}
            </Text> 
        },
    ];
    return (
        <Modal open title={null} onCancel={onClose} width={920} className="purchase-preview-modal" footer={<Button type="primary" onClick={onClose}>Close preview</Button>}>
            <div className="purchase-preview-hero">
                <div className="purchase-preview-icon">
                    <ShopOutlined />
                </div>

                <div>
                    <div className="purchase-preview-tags">
                        <Tag color={color(purchase.status)}>
                            {purchase.status}
                        </Tag>

                        <Tag color={color(purchase.payment_status)}>
                            {purchase.payment_status}
                        </Tag>
                    </div>
                    
                    <Title level={3}>
                        {purchase.purchase_no}
                    </Title>
                    <Text>
                        Purchase draft and cost overview
                    </Text>
                </div>
            </div>

            <Descriptions className="purchase-preview-info" column={{ xs: 1, sm: 2, md: 3 }} bordered size="small" items={[
                { 
                    key: "supplier", 
                    label: "Supplier", 
                    children: purchase.supplier ? `${purchase.supplier.code} — ${purchase.supplier.name}` : "—" 
                },
                { 
                    key: "warehouse", 
                    label: "Warehouse", 
                    children: purchase.warehouse ? `${purchase.warehouse.code} — ${purchase.warehouse.name}` : "—" 
                },
                { 
                    key: "date", 
                    label: "Purchase date", 
                    children: purchase.purchase_date ? dayjs(purchase.purchase_date).format("DD MMM YYYY") : "—" 
                },
                { 
                    key: "created", 
                    label: "Created", 
                    children: purchase.created_at ? dayjs(purchase.created_at).format("DD MMM YYYY, hh:mm A") : "—" 
                },
                { 
                    key: "creator", 
                    label: "Created by", 
                    children: purchase.created_by?.username || "—" 
                },
            ]} />

            <Table rowKey="id" className="purchase-preview-items" columns={columns} dataSource={purchase.items || []} pagination={false} scroll={{ x: 720 }} size="small" />

            <div className="purchase-preview-bottom">
                <div className="purchase-preview-note">
                    <Text type="secondary">
                        Internal note
                    </Text>

                    <p>
                        {purchase.note || "No note was added."}
                    </p>
                </div>

                <div className="purchase-preview-totals">
                    <div>
                        <span>
                            Subtotal
                        </span>
                        <strong>
                            {money(purchase.subtotal)}
                        </strong>
                    </div>
                    
                    <div>
                        <span>
                            Discount
                        </span>

                        <strong>
                            - {money(purchase.discount_amount)}
                        </strong>
                    </div>

                    <div>
                        <span>
                            VAT
                        </span>

                        <strong>
                            {money(purchase.vat_amount)}
                        </strong>
                    </div>

                    <div>
                        <span>
                            Transport cost
                        </span>

                        <strong>
                            {money(purchase.transport_cost)}
                        </strong>
                    </div>

                    <div>
                        <span>
                            Other cost
                        </span>

                        <strong>
                            {money(purchase.other_cost)}
                        </strong>
                    </div>

                    <div className="grand">
                        <span>
                            Grand total
                        </span>

                        <strong>
                            {money(purchase.grand_total)}
                        </strong>
                    </div>

                    <div>
                        <span>
                            Due
                        </span>

                        <strong>
                            {money(purchase.due_amount)}
                        </strong>
                    </div>
                </div>
            </div>

            <div className="purchase-preview-meta">
                <span>
                    <CalendarOutlined /> Last updated {purchase.updated_at ? dayjs(purchase.updated_at).format("DD MMM YYYY, hh:mm A") : "—"}
                </span>

                {purchase.updated_by?.username && 
                    <span>
                        <UserOutlined /> {purchase.updated_by.username}
                    </span>
                }
            </div>
        </Modal>
    )
}
