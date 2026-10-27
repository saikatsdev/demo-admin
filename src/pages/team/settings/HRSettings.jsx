import {ArrowLeftOutlined,AuditOutlined,DollarOutlined,GiftOutlined,SaveOutlined,SettingOutlined,ShoppingCartOutlined} from "@ant-design/icons";
import {Alert,Breadcrumb,Button,Card,Col,Form,Input,InputNumber,Row,Select,Skeleton,Switch,Tabs,Tag,message} from "antd";
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getDatas, postData } from "../../../api/common/common";
import { usePermission } from "../../../hooks/usePermission";
import useTitle from "../../../hooks/useTitle";
import "./TeamSetting.css";

const DEFAULT_SETTINGS = {
    team_module_active: false,
    otp_required: false,
    screening_duration: 10,
    assign_rule: "auto_assign",
    sales_commission: {
        enabled: false,
        earning_event: "return_period_completed",
        return_protection_days: 7,
        calculation_base: "net_product_amount",
        approval_mode: "automatic",
    },
    packaging_incentive: {
        enabled: false,
        entry_method: "assigned_order",
        prevent_duplicate_order: true,
        verification_required: true,
        allow_multiple_packages_per_order: false,
        daily_max_quantity: null,
    },
    attendance_salary: {
        calculation_basis: "working_days",
        absent_deduction_enabled: true,
        weekly_holidays_paid: true,
        public_holidays_paid: true,
    },
    payroll: {
        cycle: "monthly",
        cutoff_day: 31,
        payment_day: 1,
        publish_payslip_after: "paid",
        currency: "BDT",
        decimal_places: 2,
    },
};

function SettingSection({ icon, title, description, children }) {
    return (
        <Card className="hr-settings-card" bordered={false}>
            <div className="hr-settings-card__heading">
                <span className="hr-settings-card__icon">{icon}</span>
                <div>
                    <h3>{title}</h3>
                    <p>{description}</p>
                </div>
            </div>
            <div className="hr-settings-card__body">{children}</div>
        </Card>
    );
}

function ToggleField({ name, title, description, disabled = false }) {
    return (
        <div className="hr-settings-toggle">
            <div>
                <strong>{title}</strong>
                <span>{description}</span>
            </div>
            <Form.Item name={name} valuePropName="checked" noStyle>
                <Switch disabled={disabled} />
            </Form.Item>
        </div>
    );
}

export default function HRSettings() {
    useTitle("HR Settings");

    const { can }                     = usePermission();
    const [form]                      = Form.useForm();
    const [messageApi, contextHolder] = message.useMessage();
    const [loading, setLoading]       = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [loadError, setLoadError]   = useState("");
    const [lastSaved, setLastSaved]   = useState(null);
    const canUpdate                   = can("hr-settings-update");

    const loadSettings = useCallback(async () => {
        setLoading(true);
        setLoadError("");

        const response = await getDatas("/admin/team-setting");

        if (response?.success && response?.result) {
            const values = {
                ...DEFAULT_SETTINGS,
                ...response.result,
                sales_commission: { ...DEFAULT_SETTINGS.sales_commission, ...response.result.sales_commission },
                packaging_incentive: { ...DEFAULT_SETTINGS.packaging_incentive, ...response.result.packaging_incentive },
                attendance_salary: { ...DEFAULT_SETTINGS.attendance_salary, ...response.result.attendance_salary },
                payroll: { ...DEFAULT_SETTINGS.payroll, ...response.result.payroll },
            };

            form.setFieldsValue(values);
            setLastSaved(values);
        } else {
            form.setFieldsValue(DEFAULT_SETTINGS);
            setLoadError(response?.message || response?.msg || "Unable to load HR settings.");
        }

        setLoading(false);
    }, [form]);

    useEffect(() => {
        loadSettings();
    }, [loadSettings]);

    const handleSubmit = async (values) => {
        setSubmitting(true);
        const response = await postData("/admin/team-setting", values);

        if (response?.success) {
            const savedValues = response.result || values;
            form.setFieldsValue(savedValues);
            setLastSaved(savedValues);
            messageApi.success(response.msg || "HR settings saved successfully.");
        } else {
            const validationMessage = response?.errors ? Object.values(response.errors).flat().join(" ") : null;
            messageApi.error(validationMessage || response?.message || response?.msg || "Unable to save HR settings.");
        }

        setSubmitting(false);
    };

    const generalTab = (
        <SettingSection icon={<SettingOutlined />} title="Team module" description="Control team assignment and staff screening behaviour.">
            <ToggleField name="team_module_active" title="Enable team module" description="Activates team-based order assignment and related controls." disabled={!canUpdate} />
            <ToggleField name="otp_required" title="Require OTP" description="Employees must complete OTP verification where team authentication is used." disabled={!canUpdate} />
            <Row gutter={16}>
                <Col xs={24} md={12}>
                    <Form.Item label="Screening duration (minutes)" name="screening_duration" rules={[{ required: true, message: "Enter a screening duration." }]}>
                        <InputNumber min={1} max={1440} disabled={!canUpdate} style={{ width: "100%" }} />
                    </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                    <Form.Item label="Order assignment rule" name="assign_rule" rules={[{ required: true }]}>
                        <Select disabled={!canUpdate} options={[
                            { value: "auto_assign", label: "Auto assign" },
                            { value: "manual_assign", label: "Manual assign" },
                            { value: "all", label: "All orders visible" },
                        ]} />
                    </Form.Item>
                </Col>
            </Row>
        </SettingSection>
    );

    const commissionTab = (
        <SettingSection icon={<ShoppingCartOutlined />} title="Sales commission policy" description="Choose when commission becomes eligible and how returns are handled.">
            <ToggleField name={["sales_commission", "enabled"]} title="Enable sales commission" description="Eligible sales activity can create commission entries." disabled={!canUpdate} />
            <Row gutter={16}>
                <Col xs={24} md={12}>
                    <Form.Item label="Commission earned when" name={["sales_commission", "earning_event"]} rules={[{ required: true }]}>
                        <Select disabled={!canUpdate} options={[
                            { value: "confirmed", label: "Order confirmed" },
                            { value: "prepared", label: "Order prepared" },
                            { value: "shipped", label: "Order shipped" },
                            { value: "delivered", label: "Order delivered" },
                            { value: "return_period_completed", label: "Return protection period completed" },
                        ]} />
                    </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                    <Form.Item label="Return protection (days)" name={["sales_commission", "return_protection_days"]} rules={[{ required: true }]}>
                        <InputNumber min={0} max={365} disabled={!canUpdate} style={{ width: "100%" }} />
                    </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                    <Form.Item label="Calculation base" name={["sales_commission", "calculation_base"]} rules={[{ required: true }]}>
                        <Select disabled={!canUpdate} options={[
                            { value: "product_subtotal", label: "Product subtotal" },
                            { value: "net_product_amount", label: "Net product amount" },
                            { value: "grand_total", label: "Grand total" },
                            { value: "final_collected_amount", label: "Final collected amount" },
                        ]} />
                    </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                    <Form.Item label="Approval mode" name={["sales_commission", "approval_mode"]} rules={[{ required: true }]}>
                        <Select disabled={!canUpdate} options={[
                            { value: "automatic", label: "Automatic" },
                            { value: "supervisor", label: "Supervisor approval" },
                            { value: "admin", label: "Admin approval" },
                        ]} />
                    </Form.Item>
                </Col>
            </Row>
        </SettingSection>
    );

    const packagingTab = (
        <SettingSection icon={<GiftOutlined />} title="Packaging incentive policy" description="Define how completed packages are recorded, verified and sent to payroll.">
            <ToggleField name={["packaging_incentive", "enabled"]} title="Enable packaging incentive" description="Approved package completion records can generate incentive entries." disabled={!canUpdate} />
            <Row gutter={16}>
                <Col xs={24} md={12}>
                    <Form.Item label="Completion entry method" name={["packaging_incentive", "entry_method"]} rules={[{ required: true }]}>
                        <Select disabled={!canUpdate} options={[
                            { value: "assigned_order", label: "Assigned order" },
                            { value: "barcode_scan", label: "Barcode / QR scan" },
                        ]} />
                    </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                    <Form.Item label="Daily maximum quantity" name={["packaging_incentive", "daily_max_quantity"]} extra="Leave empty for no daily limit.">
                        <InputNumber min={1} disabled={!canUpdate} placeholder="No limit" style={{ width: "100%" }} />
                    </Form.Item>
                </Col>
            </Row>
            <div className="hr-settings-toggle-grid">
                <ToggleField name={["packaging_incentive", "prevent_duplicate_order"]} title="Prevent duplicate completion" description="Do not allow the same order to be completed twice." disabled={!canUpdate} />
                <ToggleField name={["packaging_incentive", "verification_required"]} title="Require verification" description="A supervisor or admin must verify completion." disabled={!canUpdate} />
                <ToggleField name={["packaging_incentive", "allow_multiple_packages_per_order"]} title="Multiple packages per order" description="One order may contain several countable packages." disabled={!canUpdate} />
            </div>
        </SettingSection>
    );

    const salaryTab = (
        <div className="hr-settings-grid hr-settings-grid--two">
            <SettingSection icon={<AuditOutlined />} title="Attendance deductions" description="Choose which attendance events affect salary.">
                <Form.Item label="Salary day calculation" name={["attendance_salary", "calculation_basis"]} rules={[{ required: true }]}>
                    <Select disabled={!canUpdate} options={[
                        { value: "working_days", label: "Actual working days" },
                        { value: "calendar_days", label: "Calendar days" },
                        { value: "fixed_30_days", label: "Fixed 30 days" },
                    ]} />
                </Form.Item>
                <ToggleField name={["attendance_salary", "absent_deduction_enabled"]} title="Absent deduction" description="Deduct salary for unauthorized absence." disabled={!canUpdate} />
            </SettingSection>
            <SettingSection icon={<DollarOutlined />} title="Paid holidays" description="Control paid non-working days.">
                <ToggleField name={["attendance_salary", "weekly_holidays_paid"]} title="Paid weekly holidays" description="Weekly off days remain paid salary days." disabled={!canUpdate} />
                <ToggleField name={["attendance_salary", "public_holidays_paid"]} title="Paid public holidays" description="Public holidays remain paid salary days." disabled={!canUpdate} />
            </SettingSection>
        </div>
    );

    const payrollTab = (
        <SettingSection icon={<DollarOutlined />} title="Payroll processing" description="Configure payroll periods, approval and payslip publication.">
            <Row gutter={16}>
                <Col xs={24} md={12}>
                    <Form.Item label="Payroll cycle" name={["payroll", "cycle"]} rules={[{ required: true }]}>
                        <Select disabled={!canUpdate} options={[{ value: "monthly", label: "Monthly" }, { value: "weekly", label: "Weekly" }]} />
                    </Form.Item>
                </Col>
                
                <Col xs={24} md={12}>
                    <Form.Item label="Payroll cutoff day" name={["payroll", "cutoff_day"]} rules={[{ required: true }]}>
                        <InputNumber min={1} max={31} disabled={!canUpdate} style={{ width: "100%" }} />
                    </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                    <Form.Item label="Payment day" name={["payroll", "payment_day"]} rules={[{ required: true }]}>
                        <InputNumber min={1} max={31} disabled={!canUpdate} style={{ width: "100%" }} />
                    </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                    <Form.Item label="Publish payslip after" name={["payroll", "publish_payslip_after"]} rules={[{ required: true }]}>
                        <Select disabled={!canUpdate} options={[{ value: "approved", label: "Payroll approved" }, { value: "paid", label: "Payroll paid" }]} />
                    </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                    <Form.Item label="Currency" name={["payroll", "currency"]} rules={[{ required: true }, { len: 3, message: "Use a three-letter currency code." }]}>
                        <Input maxLength={3} disabled={!canUpdate} />
                    </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                    <Form.Item label="Decimal places" name={["payroll", "decimal_places"]} rules={[{ required: true }]}>
                        <InputNumber min={0} max={4} disabled={!canUpdate} style={{ width: "100%" }} />
                    </Form.Item>
                </Col>
            </Row>
            <div className="hr-settings-toggle-grid">
            </div>
        </SettingSection>
    );

    const tabItems = [
        { key: "general", label: "General", children: generalTab },
        { key: "commission", label: "Sales Commission", children: commissionTab },
        { key: "packaging", label: "Packaging Incentive", children: packagingTab },
        { key: "salary", label: "Attendance & Salary", children: salaryTab },
        { key: "payroll", label: "Payroll", children: payrollTab },
    ];

    return (
        <div className="hr-settings-page">
            {contextHolder}
            <div className="pagehead hr-settings-pagehead">
                <div className="head-left">
                    <div className="hr-settings-title-row">
                        <span className="hr-settings-title-icon"><SettingOutlined /></span>
                        <div>
                            <h1 className="title">HR Settings</h1>
                            <p className="subtitle">Configure commission, packaging, attendance and payroll policies.</p>
                        </div>
                    </div>
                </div>
                <div className="head-actions hr-settings-head-actions">
                    <Button icon={<ArrowLeftOutlined />} onClick={() => window.history.back()}>Back</Button>
                    <Breadcrumb items={[{ title: <Link to="/dashboard">Dashboard</Link> }, { title: "HR Settings" }]} />
                </div>
            </div>

            {!canUpdate && <Alert className="hr-settings-alert" type="info" showIcon message="Read-only access" description="You can review these settings, but you do not have permission to update them." />}
            {loadError && <Alert className="hr-settings-alert" type="error" showIcon message={loadError} action={<Button size="small" onClick={loadSettings}>Retry</Button>} />}

            {loading ? (
                <Card bordered={false}><Skeleton active paragraph={{ rows: 12 }} /></Card>
            ) : (
                <Form form={form} layout="vertical" initialValues={DEFAULT_SETTINGS} onFinish={handleSubmit} requiredMark={false}>
                    <div className="hr-settings-toolbar">
                        <div>
                            <Form.Item noStyle shouldUpdate={(previous, current) => previous.sales_commission?.enabled !== current.sales_commission?.enabled || previous.packaging_incentive?.enabled !== current.packaging_incentive?.enabled}>
                                {({ getFieldValue }) => (
                                    <>
                                        <Tag color={getFieldValue(["sales_commission", "enabled"]) ? "green" : "default"}>Sales commission</Tag>
                                        <Tag color={getFieldValue(["packaging_incentive", "enabled"]) ? "green" : "default"}>Packaging incentive</Tag>
                                    </>
                                )}
                            </Form.Item>
                        </div>
                        {canUpdate && (
                            <div className="hr-settings-toolbar__actions">
                                <Button disabled={!lastSaved || submitting} onClick={() => form.setFieldsValue(lastSaved)}>Discard changes</Button>
                                <Button type="primary" htmlType="submit" loading={submitting} icon={<SaveOutlined />}>Save settings</Button>
                            </div>
                        )}
                    </div>
                    <Tabs className="hr-settings-tabs" items={tabItems} />
                </Form>
            )}
        </div>
    );
}
