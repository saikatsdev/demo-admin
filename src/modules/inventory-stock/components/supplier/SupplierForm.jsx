import { BankOutlined, ShopOutlined } from "@ant-design/icons";
import {Alert,Button,Card,Col,Form,Input,InputNumber,Row,Select,Space} from "antd";
import { useEffect } from "react";

const statusOptions = 
[
    {
        value: "active",
        label: "Active",
    },
    {
        value: "inactive",
        label: "Inactive",
    },
    {
        value: "draft",
        label: "Draft",
    },
];

export default function SupplierForm({supplier,saving,serverError,fieldErrors,onSave,onCancel,onChange}) {
    const [form] = Form.useForm();

    useEffect(() => {
        form.resetFields();
        form.setFieldsValue(
            supplier || {
                status: "active",
                opening_balance: "0.00",
                opening_balance_type: "payable",
            }
        );
    }, [form, supplier]);

    useEffect(() => {
        if (!fieldErrors) return;

        form.setFields(
            Object.entries(fieldErrors).map(([name, errors]) => ({
                name,
                errors: Array.isArray(errors) ? errors : [errors],
            }))
        );
    }, [fieldErrors, form]);

    const field = (name, label, input, rules = [], span = 12) => (
        <Col xs={24} md={span} key={name}>
            <Form.Item name={name} label={label} rules={rules}>
                {input}
            </Form.Item>
        </Col>
    );

    const required = (label) => [
        {
            required: true,
            whitespace: true,
            message: `${label} is required`,
        },
    ];

    return (
        <Card className="supplier-editor-card" styles={{ body: { padding: 0 } }}>
            {serverError && (
                <Alert type="error" showIcon message={serverError} className="supplier-form-error"/>
            )}

            <Form
                form={form}
                layout="vertical"
                onFinish={onSave}
                onValuesChange={onChange}
                disabled={saving}
                requiredMark="optional"
                className="supplier-form"
            >
                <section className="supplier-form-section">
                    <div className="supplier-section-heading">
                        <span className="supplier-section-icon">
                            <ShopOutlined />
                        </span>

                        <div>
                            <h2>Supplier information</h2>
                            <p>
                                Basic identity and contact details for this
                                supplier.
                            </p>
                        </div>
                    </div>

                    <Row gutter={[20, 0]}>
                        {field(
                            "name",
                            "Supplier or company name",
                            <Input size="large" placeholder="e.g. ABC Traders" maxLength={255}/>,
                            required("Supplier name"),
                            16
                        )}

                        {field(
                            "status",
                            "Status",
                            <Select size="large" options={statusOptions} />,
                            [
                                {
                                    required: true,
                                    message: "Select a status",
                                },
                            ],
                            8
                        )}

                        {field(
                            "contact_person",
                            "Contact person",
                            <Input size="large" placeholder="Contact person name" maxLength={255}/>
                        )}

                        {field(
                            "phone_number",
                            "Phone number",
                            <Input size="large" placeholder="Primary phone number" maxLength={30}/>,
                            required("Phone number")
                        )}

                        {field(
                            "alternate_phone_number",
                            "Alternate phone",
                            <Input size="large" placeholder="Optional phone number" maxLength={30}/>
                        )}

                        {field(
                            "email",
                            "Email",
                            <Input size="large" placeholder="supplier@example.com" maxLength={255}/>,
                            [
                                {
                                    type: "email",
                                    message: "Enter a valid email address",
                                },
                            ]
                        )}

                        {field(
                            "address",
                            "Address",
                            <Input.TextArea rows={3} maxLength={5000} showCount placeholder="Enter the supplier address"/>,
                            [],
                            24
                        )}
                    </Row>
                </section>

                <section className="supplier-form-section supplier-balance-section">
                    <div className="supplier-section-heading">
                        <span className="supplier-section-icon supplier-balance-icon">
                            <BankOutlined />
                        </span>

                        <div>
                            <h2>Opening balance</h2>
                            <p>
                                Record any payable amount or advance carried
                                into the system.
                            </p>
                        </div>
                    </div>

                    <div className="supplier-balance-note">
                        Use zero when there is no previous balance with this
                        supplier.
                    </div>

                    <Row gutter={[20, 0]}>
                        {field(
                            "opening_balance",
                            "Opening balance amount",
                            <InputNumber
                                size="large"
                                stringMode
                                min="0"
                                max="999999999999.99"
                                precision={2}
                                className="supplier-full-width"
                                placeholder="0.00"
                            />,
                            [
                                {
                                    required: true,
                                    message: "Enter the opening balance",
                                },
                            ]
                        )}

                        {field(
                            "opening_balance_type",
                            "Balance type",
                            <Select
                                size="large"
                                options={[
                                    {
                                        value: "payable",
                                        label: "Payable — পাবে",
                                    },
                                    {
                                        value: "receivable",
                                        label: "Advance — দিবে",
                                    },
                                ]}
                            />,
                            [
                                {
                                    required: true,
                                    message: "Select an opening balance type",
                                },
                            ]
                        )}
                    </Row>
                </section>

                <section className="supplier-form-section supplier-notes-section">
                    <Form.Item name="note" label="Internal notes" className="supplier-notes">
                        <Input.TextArea rows={3} maxLength={5000} showCount placeholder="Add any useful information about this supplier"/>
                    </Form.Item>
                </section>

                <div className="supplier-form-actions">
                    <Space>
                        <Button onClick={onCancel} disabled={saving}>
                            Cancel
                        </Button>

                        <Button type="primary" htmlType="submit" loading={saving}>
                            {supplier ? "Save Changes" : "Create Supplier"}
                        </Button>
                    </Space>
                </div>
            </Form>
        </Card>
    );
}