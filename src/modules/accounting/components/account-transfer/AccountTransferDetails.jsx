import { ArrowRightOutlined } from "@ant-design/icons";
import {Descriptions,Drawer,Space,Tag,Typography} from "antd";
import dayjs from "dayjs";

const { Text, Title } = Typography;

const money = (value) =>
    `৳${Number(value || 0).toLocaleString("en-BD", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;

const statusColor = {
    posted   : "green",
    draft    : "gold",
    cancelled: "default",
};

export default function AccountTransferDetails({transfer,open,onClose}) {
    if (!transfer) return null;

    return (
        <Drawer title="Account transfer details" width={620} open={open} onClose={onClose}>
            <div className="transfer-detail-hero">
                <Text type="secondary">
                    {transfer.transfer_no}
                </Text>

                <Title level={2}>
                    {money(transfer.amount)}
                </Title>

                <Tag color={statusColor[transfer.status] || "default"} style={{textTransform: "capitalize"}}>
                    {transfer.status}
                </Tag>
            </div>

            <div className="transfer-account-path">
                <div>
                    <Text type="secondary">From</Text>

                    <strong>
                        {transfer.from_account?.name || "-"}
                    </strong>

                    <span>
                        {transfer.from_account?.code || ""}
                    </span>
                </div>

                <ArrowRightOutlined />

                <div>
                    <Text type="secondary">To</Text>

                    <strong>
                        {transfer.to_account?.name || "-"}
                    </strong>

                    <span>
                        {transfer.to_account?.code || ""}
                    </span>
                </div>
            </div>

            <Descriptions bordered column={1} size="small" className="transfer-details-grid">
                <Descriptions.Item label="Transfer date">
                    {transfer.transfer_date ? dayjs(transfer.transfer_date).format("DD MMM YYYY, hh:mm A") : "-"}
                </Descriptions.Item>

                <Descriptions.Item label="Transaction reference">
                    {transfer.transaction_reference || "-"}
                </Descriptions.Item>

                <Descriptions.Item label="Note">
                    {transfer.note || "-"}
                </Descriptions.Item>

                <Descriptions.Item label="Created by">
                    {transfer.created_by?.username || "-"}
                </Descriptions.Item>

                <Descriptions.Item label="Updated by">
                    {transfer.updated_by?.username || "-"}
                </Descriptions.Item>
            </Descriptions>

            {Array.isArray(transfer.payments) &&
                transfer.payments.length > 0 && (
                    <div className="transfer-payment-list">
                        <Text strong>Accounting entries</Text>

                        {transfer.payments.map((payment) => (
                            <Space key={payment.id} className="transfer-payment-row">
                                <Tag color={payment.direction === "out" ? "red" : "green"}>
                                    {payment.direction}
                                </Tag>

                                <Text>
                                    {payment.payment_no}
                                </Text>

                                <Text strong>
                                    {money(payment.amount)}
                                </Text>
                            </Space>
                        ))}
                    </div>
                )}
        </Drawer>
    );
}