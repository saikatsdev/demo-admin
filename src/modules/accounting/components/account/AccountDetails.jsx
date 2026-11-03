import { BankOutlined, CalendarOutlined, IdcardOutlined, UserOutlined, WalletOutlined } from "@ant-design/icons";
import { Avatar, Button, Modal, Tag, Typography } from "antd";
import dayjs from "dayjs";

const { Text, Title } = Typography;
const money           = (value) => `৳${Number(value || 0).toLocaleString("en-BD", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const showDate        = (value) => value ? dayjs(value).format("DD MMM YYYY, hh:mm A") : "—";
const labelType       = (value) => value?.replaceAll("_", " ") || "Other";

function Detail({ icon, label, value }) {
    return <div className="account-preview-item"><span className="account-preview-icon">{icon}</span><div><Text>{label}</Text><strong>{value || "Not provided"}</strong></div></div>;
}

export default function AccountDetails({ account, onClose }) {
    if (!account) return null;
    return (
        <Modal open title={null} onCancel={onClose} width={760} className="account-preview-modal" footer={<Button type="primary" onClick={onClose}>Close preview</Button>}>
            <div className="account-preview-hero">
                <Avatar shape="square" size={64} icon={<WalletOutlined />} />
                <div className="account-preview-identity">
                    <div>
                        <Tag bordered={false}>
                            {account.code}
                        </Tag>

                        <Tag bordered={false} color="blue">
                            {labelType(account.type)}
                        </Tag>

                        <Tag bordered={false} color={account.status === "active" ? "green" : "default"}>
                            {account.status}
                        </Tag>
                    </div>
                    <Title level={3}>{account.name}</Title><Text>Account identity, balance and financial information</Text>
                </div>

                <div className="account-preview-balance">
                    <span>Current balance</span>
                    <strong>{money(account.current_balance)}</strong>
                    <small>Opening: {money(account.opening_balance)}</small>
                </div>
            </div>

            <section className="account-preview-section">
                <h3>Financial details</h3>
                <div className="account-preview-grid">
                    <Detail icon={<IdcardOutlined />} label="Account number" value={account.account_number} />
                    <Detail icon={<UserOutlined />} label="Account holder" value={account.account_holder_name} />
                    <Detail icon={<BankOutlined />} label="Bank / provider" value={account.bank_name} />
                    <Detail icon={<BankOutlined />} label="Branch" value={account.branch_name} />
                </div>
            </section>

            <section className="account-preview-note">
                <Text>Internal note</Text>
                <p>{account.note || "No note has been added for this account."}</p>
            </section>

            <div className="account-preview-meta">
                <div>
                    <CalendarOutlined />
                    <span>Created</span>
                    <strong>{showDate(account.created_at)}</strong>
                </div>

                <div>
                    <CalendarOutlined />
                    <span>Last updated</span>
                    <strong>{showDate(account.updated_at)}</strong>
                </div>

                {account.created_by?.username && 
                    <div>
                        <UserOutlined />
                        <span>Created by</span>
                        <strong>{account.created_by.username}</strong>
                    </div>
                }
            </div>
        </Modal>
    );
}
