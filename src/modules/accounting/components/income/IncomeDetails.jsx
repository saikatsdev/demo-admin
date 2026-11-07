import {BankOutlined,CalendarOutlined,FileTextOutlined,NumberOutlined,ShopOutlined,TagOutlined,UserOutlined} from "@ant-design/icons";
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

export default function IncomeDetails({ income, onClose }) {
    return (
        <Drawer
            open={Boolean(income)}
            onClose={onClose}
            width={560}
            title="Income details"
            destroyOnHidden
        >
            {income && (
                <div className="income-details">
                    <div className="income-details-hero">
                        <div>
                            <Text type="secondary">
                                {income.income_no}
                            </Text>

                            <Title level={3}>
                                {income.title}
                            </Title>

                            <Space wrap>
                                <Tag color={statusColor[income.status]} style={{textTransform: "capitalize"}}>
                                    {income.status}
                                </Tag>

                                <Tag icon={<TagOutlined />}>
                                    {income.category?.name || "Uncategorized"}
                                </Tag>
                            </Space>
                        </div>

                        <div className="income-details-amount">
                            {money(income.amount)}
                        </div>
                    </div>

                    <Descriptions
                        bordered
                        size="small"
                        column={1}
                        className="income-details-grid"
                    >
                        <Descriptions.Item
                            label={
                                <>
                                    <CalendarOutlined /> Income date
                                </>
                            }
                        >
                            {income.income_date ? dayjs(income.income_date).format("DD MMM YYYY") : "-"}
                        </Descriptions.Item>

                        <Descriptions.Item
                            label={
                                <>
                                    <BankOutlined /> Account
                                </>
                            }
                        >
                            {income.account?.name || "-"}
                            {income.account?.code ? ` (${income.account.code})` : ""}
                        </Descriptions.Item>

                        <Descriptions.Item
                            label={
                                <>
                                    <ShopOutlined /> Payer / source
                                </>
                            }
                        >
                            {income.payer || "-"}
                        </Descriptions.Item>

                        <Descriptions.Item
                            label={
                                <>
                                    <NumberOutlined /> Transaction ref.
                                </>
                            }
                        >
                            {income.transaction_reference || "-"}
                        </Descriptions.Item>

                        <Descriptions.Item
                            label={
                                <>
                                    <FileTextOutlined /> Note
                                </>
                            }
                        >
                            {income.note || "-"}
                        </Descriptions.Item>

                        <Descriptions.Item
                            label={
                                <>
                                    <UserOutlined /> Created by
                                </>
                            }
                        >
                            {income.created_by?.username || "-"}
                        </Descriptions.Item>
                    </Descriptions>
                </div>
            )}
        </Drawer>
    );
}