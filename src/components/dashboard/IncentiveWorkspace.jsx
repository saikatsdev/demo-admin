import {DollarOutlined,GiftOutlined,PlusOutlined,ShoppingCartOutlined,WalletOutlined} from "@ant-design/icons";
import {Alert,Button,Card,Col,DatePicker,Form,Input,InputNumber,Modal,Row,Select,Skeleton,Statistic,Table,Tag,message} from "antd";
import dayjs from "dayjs";
import { useCallback, useEffect, useState } from "react";
import { getDatas, postData } from "../../api/common/common";
import "./css/IncentiveWorkspace.css";

const statusColor = { approved: "green", pending: "gold", rejected: "red" };

export default function IncentiveWorkspace() {
    const [form]                      = Form.useForm();
    const [messageApi, contextHolder] = message.useMessage();
    const [loading, setLoading]       = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [open, setOpen]             = useState(false);
    const [summary, setSummary]       = useState(null);
    const [error, setError]           = useState("");
    const [orders, setOrders]         = useState([]);

    const loadSummary = useCallback(async () => {
        setLoading(true);
        const [response, orderResponse] = await Promise.all([
            getDatas("/admin/employee-self/incentives/summary", {
                month: dayjs().format("YYYY-MM"),
            }),
            getDatas("/admin/employee-self/incentives/packaging-orders"),
        ]);
        if (response?.success) {
            setSummary(response.result);
            setError("");
        } else setError(response?.message || "Unable to load earning summary.");
        setOrders(orderResponse?.result || []);
        setLoading(false);
    }, []);

    useEffect(() => {
        loadSummary();
    }, [loadSummary]);

    const submitPackaging = async (values) => {
        setSubmitting(true);
        const response = await postData("/admin/employee-self/incentives/packaging", {
            ...values,
            order_id: values.order_id || null,
            completed_on: values.completed_on.format("YYYY-MM-DD"),
        });
        setSubmitting(false);
        if (!response?.success)
            return messageApi.error(response?.message || "Unable to submit packaging work.");
        messageApi.success(response.msg);
        setOpen(false);
        form.resetFields();
        loadSummary();
    };

    if (loading)
        return (
            <Card className="incentive-workspace">
                <Skeleton active paragraph={{ rows: 4 }} />
            </Card>
        );

    const cards = 
    [
        {
            title: "Basic Salary",
            value: summary?.basic_salary,
            icon: <WalletOutlined />,
            color: "blue",
        },
        ...(summary?.capabilities?.sales
            ? [
                  {
                      title: "Sales Commission",
                      value: summary?.sales_commission,
                      icon: <ShoppingCartOutlined />,
                      color: "purple",
                  },
              ]
            : []),
        ...(summary?.capabilities?.packaging
            ? [
                  {
                      title: "Packaging Incentive",
                      value: summary?.packaging_incentive,
                      icon: <GiftOutlined />,
                      color: "orange",
                  },
              ]
            : []),
        {
            title: "Estimated Gross",
            value: summary?.estimated_gross_salary,
            icon: <DollarOutlined />,
            color: "green",
        },
    ];

    return (
        <section className="ed-section incentive-workspace">
            {contextHolder}
            <div className="ed-section__head incentive-workspace__head">
                <div>
                    <h2 className="ed-section__title">Current Month Earnings</h2>
                    <p className="ed-section__subtitle">
                        Basic salary plus approved commission and packaging incentive
                    </p>
                </div>
                {summary?.capabilities?.packaging && (
                    <Button
                        type="primary"
                        disabled={!summary?.packaging_incentive_enabled}
                        icon={<PlusOutlined />}
                        onClick={() => {
                            form.setFieldsValue({ quantity: 1, completed_on: dayjs() });
                            setOpen(true);
                        }}
                    >
                        Complete Package
                    </Button>
                )}
            </div>
            {error ? (
                <Alert type="warning" showIcon message={error} />
            ) : (
                <>
                    <Row gutter={[12, 12]}>
                        {cards.map((card) => (
                            <Col xs={24} sm={12} lg={6} key={card.title}>
                                <Card className={`incentive-stat incentive-stat--${card.color}`}>
                                    <span className="incentive-stat__icon">{card.icon}</span>
                                    <Statistic
                                        title={card.title}
                                        value={Number(card.value || 0)}
                                        precision={2}
                                        prefix="৳"
                                    />
                                </Card>
                            </Col>
                        ))}
                    </Row>
                    {summary?.capabilities?.packaging && (
                        <div className="incentive-history">
                            <h3>Recent packaging entries</h3>
                            <Table
                                size="small"
                                rowKey="id"
                                pagination={false}
                                dataSource={summary?.recent_packaging_entries || []}
                                columns={[
                                    {
                                        title: "Order",
                                        render: (_, row) =>
                                            row.order?.invoice_number || "Manual entry",
                                    },
                                    { title: "Quantity", dataIndex: "quantity" },
                                    {
                                        title: "Incentive",
                                        render: (_, row) =>
                                            `৳${Number(row.incentive_amount || 0).toLocaleString()}`,
                                    },
                                    {
                                        title: "Date",
                                        render: (_, row) => row.completed_on?.slice(0, 10),
                                    },
                                    {
                                        title: "Status",
                                        dataIndex: "status",
                                        render: (value) => (
                                            <Tag color={statusColor[value]}>{value}</Tag>
                                        ),
                                    },
                                ]}
                            />
                        </div>
                    )}
                </>
            )}

            <Modal
                title="Submit completed packaging work"
                open={open}
                onCancel={() => setOpen(false)}
                footer={null}
                destroyOnClose
            >
                <Alert
                    className="incentive-form-alert"
                    type="info"
                    showIcon
                    message="Select an order assigned to or prepared by you, then enter the number of completed packages."
                />
                <Form form={form} layout="vertical" onFinish={submitPackaging} preserve={false}>
                    <Form.Item
                        name="order_id"
                        label="Order"
                        rules={[{ required: true, message: "Select an order." }]}
                    >
                        <Select
                            showSearch
                            optionFilterProp="label"
                            placeholder="Select an eligible order"
                            options={orders.map((order) => ({
                                value: order.id,
                                label: `${order.invoice_number || `Order #${order.id}`} — ${order.customer_name || "Customer"}`,
                            }))}
                        />
                    </Form.Item>
                    <Form.Item
                        name="quantity"
                        label="Completed package quantity"
                        rules={[{ required: true }]}
                    >
                        <InputNumber min={1} style={{ width: "100%" }} />
                    </Form.Item>
                    <Form.Item
                        name="completed_on"
                        label="Completion date"
                        rules={[{ required: true }]}
                    >
                        <DatePicker
                            disabledDate={(date) => date?.isAfter(dayjs(), "day")}
                            style={{ width: "100%" }}
                        />
                    </Form.Item>
                    <Form.Item name="notes" label="Notes">
                        <Input.TextArea rows={3} maxLength={1000} />
                    </Form.Item>
                    <div className="incentive-form-actions">
                        <Button onClick={() => setOpen(false)}>Cancel</Button>
                        <Button type="primary" htmlType="submit" loading={submitting}>
                            Submit work
                        </Button>
                    </div>
                </Form>
            </Modal>
        </section>
    );
}
