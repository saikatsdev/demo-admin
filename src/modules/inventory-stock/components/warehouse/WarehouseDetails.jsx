import { CalendarOutlined, EnvironmentOutlined, MailOutlined, PhoneOutlined, ShopOutlined, UserOutlined } from "@ant-design/icons";
import { Avatar, Button, Modal, Tag, Typography } from "antd";
import dayjs from "dayjs";

const { Text, Title } = Typography;
const showDate = (value) => value ? dayjs(value).format("DD MMM YYYY, hh:mm A") : "—";

function Detail({ icon, label, value, wide = false }) {
    return (
        <div className={`warehouse-preview-item${wide ? " wide" : ""}`}>
            <span className="warehouse-preview-icon">
                {icon}
            </span>
            <div>
                <Text>
                    {label}
                </Text>

                <strong>
                    {value || "Not provided"}
                </strong>
            </div>
        </div>
    );
}

export default function WarehouseDetails({ warehouse, onClose }) {
    if (!warehouse) return null;
    const statusColor = warehouse.status === "active" ? "green" : warehouse.status === "draft" ? "gold" : "default";
    return (
        <Modal open title={null} onCancel={onClose} width={740} className="warehouse-preview-modal" footer={<Button type="primary" onClick={onClose}>Close preview</Button>}>
            <div className="warehouse-preview-hero">
                <Avatar shape="square" size={64} icon={<ShopOutlined />} />
                <div>
                    <div className="warehouse-preview-tags">
                        <Tag bordered={false}>
                            {warehouse.code}
                        </Tag>

                        <Tag bordered={false} color={statusColor}>
                            {warehouse.status}
                        </Tag>

                        {warehouse.is_default && 
                            <Tag bordered={false} color="blue">
                                Default warehouse
                            </Tag>
                        }
                    </div>

                    <Title level={3}>
                        {warehouse.name}
                    </Title>

                    <Text>
                        Storage location and operational contact overview
                    </Text>
                </div>
            </div>

            <section className="warehouse-preview-section">
                <h3>Warehouse details</h3>

                <div className="warehouse-preview-grid">
                    <Detail icon={<UserOutlined />} label="Contact person" value={warehouse.contact_person} />
                    <Detail icon={<PhoneOutlined />} label="Phone number" value={warehouse.phone_number} />
                    <Detail icon={<MailOutlined />} label="Email address" value={warehouse.email} />
                    <Detail icon={<EnvironmentOutlined />} label="Address" value={warehouse.address} wide />
                </div>
            </section>

            <section className="warehouse-preview-note"><Text>Internal notes</Text><p>{warehouse.note || "No notes have been added for this warehouse."}</p></section>
            <div className="warehouse-preview-meta">
                <div>
                    <CalendarOutlined />

                    <span>Created</span>

                    <strong>
                        {showDate(warehouse.created_at)}
                    </strong>
                </div>

                <div>
                    <CalendarOutlined />

                    <span>Last updated</span>

                    <strong>
                        {showDate(warehouse.updated_at)}
                    </strong>
                </div>
                {warehouse.created_by?.username && 
                    <div>
                        <UserOutlined />

                        <span>Created by</span>
                        
                        <strong>
                            {warehouse.created_by.username}
                        </strong>
                    </div>
                }
            </div>
        </Modal>
    );
}
