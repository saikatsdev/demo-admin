import { BankOutlined, CalendarOutlined, EnvironmentOutlined, FileTextOutlined, MailOutlined, PhoneOutlined, ShopOutlined, UserOutlined } from "@ant-design/icons";
import { Avatar, Button, Modal, Tag, Typography } from "antd";
import dayjs from "dayjs";

const { Text, Title } = Typography;
const showDate = (value) => value ? dayjs(value).format("DD MMM YYYY, hh:mm A") : "—";
const formatAmount = (value) => Number(value || 0).toLocaleString("en-BD", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function DetailItem({ icon, label, value, wide = false }) {
    return (
        <div className={`supplier-preview-item${wide ? " wide" : ""}`}>
            <span className="supplier-preview-item-icon">{icon}</span>
            <div>
                <Text className="supplier-preview-label">{label}</Text>
                <div className="supplier-preview-value">{value || <Text type="secondary">Not provided</Text>}</div>
            </div>
        </div>
    );
}

export default function SupplierDetails({ supplier, onClose }) {
    if (!supplier) return null;

    const receivable = supplier.opening_balance_type === "receivable";
    const statusColor = supplier.status === "active" ? "green" : supplier.status === "draft" ? "gold" : "default";

    return (
        <Modal
            open
            title={null}
            onCancel={onClose}
            width={760}
            className="supplier-preview-modal"
            footer={<Button type="primary" onClick={onClose}>Close preview</Button>}
        >
            <div className="supplier-preview-hero">
                <Avatar shape="square" size={64} className="supplier-preview-avatar" icon={<ShopOutlined />} />
                <div className="supplier-preview-identity">
                    <div className="supplier-preview-badges">
                        <Tag bordered={false} className="supplier-preview-code">{supplier.code}</Tag>
                        <Tag bordered={false} color={statusColor} className="supplier-preview-status">{supplier.status}</Tag>
                    </div>
                    <Title level={3}>{supplier.name}</Title>
                    <Text>Supplier account overview and contact information</Text>
                </div>
            </div>

            <div className={`supplier-preview-balance ${receivable ? "receivable" : "payable"}`}>
                <span className="supplier-preview-balance-icon"><BankOutlined /></span>
                <div>
                    <Text>Opening balance</Text>
                    <div className="supplier-preview-balance-amount">৳ {formatAmount(supplier.opening_balance)}</div>
                </div>
                <Tag bordered={false} className="supplier-preview-balance-tag">
                    {receivable ? "Receivable / Advance" : "Payable"}
                </Tag>
            </div>

            <section className="supplier-preview-section">
                <div className="supplier-preview-section-title">Contact information</div>
                <div className="supplier-preview-grid">
                    <DetailItem icon={<UserOutlined />} label="Contact person" value={supplier.contact_person} />
                    <DetailItem icon={<PhoneOutlined />} label="Primary phone" value={supplier.phone_number} />
                    <DetailItem icon={<PhoneOutlined />} label="Alternate phone" value={supplier.alternate_phone_number} />
                    <DetailItem icon={<MailOutlined />} label="Email address" value={supplier.email} />
                    <DetailItem icon={<EnvironmentOutlined />} label="Address" value={supplier.address} wide />
                </div>
            </section>

            <section className="supplier-preview-section">
                <div className="supplier-preview-section-title">Additional information</div>
                <div className="supplier-preview-note">
                    <FileTextOutlined />
                    <div>
                        <Text className="supplier-preview-label">Internal notes</Text>
                        <p>{supplier.note || "No notes have been added for this supplier."}</p>
                    </div>
                </div>
            </section>

            <section className="supplier-preview-meta">
                <div><CalendarOutlined /><span>Created</span><strong>{showDate(supplier.created_at)}</strong></div>
                <div><CalendarOutlined /><span>Last updated</span><strong>{showDate(supplier.updated_at)}</strong></div>
                {supplier.created_by?.username && <div><UserOutlined /><span>Created by</span><strong>{supplier.created_by.username}</strong></div>}
                {supplier.deleted_at && <div className="deleted"><CalendarOutlined /><span>Deleted</span><strong>{showDate(supplier.deleted_at)}</strong></div>}
            </section>
        </Modal>
    );
}
