import {BankOutlined,CalendarOutlined,FileTextOutlined,NumberOutlined,ShopOutlined,TagOutlined,UserOutlined} from "@ant-design/icons";
import {Descriptions,Drawer,Space,Tag,Typography} from "antd";
import dayjs from "dayjs";

const { Text, Title } = Typography;

const money = (value) =>
    `৳${Number(value || 0).toLocaleString("en-BD", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;

const statusColor = 
{
    posted   : "green",
    draft    : "gold",
    cancelled: "default",
};

export default function ExpenseDetails({ expense, onClose }) {
    return (
        <Drawer
            open={Boolean(expense)}
            onClose={onClose}
            width={560}
            title="Expense details"
            destroyOnHidden
        >
            {expense && (
                <div className="expense-details">
                    <div className="expense-details-hero">
                        <div>
                            <Text type="secondary">
                                {expense.expense_no}
                            </Text>

                            <Title level={3}>
                                {expense.title}
                            </Title>

                            <Space wrap>
                                <Tag color={statusColor[expense.status]} style={{textTransform:"capitalize"}}>
                                    {expense.status}
                                </Tag>

                                <Tag icon={<TagOutlined />}>
                                    {expense.category?.name || "Uncategorized"}
                                </Tag>
                            </Space>
                        </div>

                        <div className="expense-details-amount">
                            {money(expense.amount)}
                        </div>
                    </div>

                    <Descriptions bordered size="small" column={1} className="expense-details-grid">
                        <Descriptions.Item
                            label={
                                <>
                                    <CalendarOutlined /> Expense date
                                </>
                            }
                        >
                            {expense.expense_date ? dayjs(expense.expense_date).format("DD MMM YYYY") : "-"}
                        </Descriptions.Item>

                        <Descriptions.Item
                            label={
                                <>
                                    <BankOutlined /> Account
                                </>
                            }
                        >
                            {expense.account?.name || "-"}
                            {expense.account?.code
                                ? ` (${expense.account.code})`
                                : ""}
                        </Descriptions.Item>

                        <Descriptions.Item
                            label={
                                <>
                                    <ShopOutlined /> Pay To
                                </>
                            }
                        >
                            {expense.payee || "-"}
                        </Descriptions.Item>

                        <Descriptions.Item
                            label={
                                <>
                                    <NumberOutlined /> Transaction ref.
                                </>
                            }
                        >
                            {expense.transaction_reference || "-"}
                        </Descriptions.Item>

                        <Descriptions.Item
                            label={
                                <>
                                    <FileTextOutlined /> Note
                                </>
                            }
                        >
                            {expense.note || "-"}
                        </Descriptions.Item>

                        <Descriptions.Item
                            label={
                                <>
                                    <UserOutlined /> Created by
                                </>
                            }
                        >
                            {expense.created_by?.username || "-"}
                        </Descriptions.Item>
                    </Descriptions>
                </div>
            )}
        </Drawer>
    );
}