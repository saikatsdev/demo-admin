import { useEffect, useState } from "react";
import { Alert, Avatar, Button, Col, DatePicker, Descriptions, Empty, Form, Input, InputNumber, message, Modal, Row, Select, Skeleton, Space, Tag, Typography } from "antd";
import { EditOutlined, PhoneOutlined, UserOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { getDatas, postData } from "../../api/common/common";

const dateValue = (value) => value && dayjs(value).isValid() ? dayjs(value) : null;
const showDate = (value) => dateValue(value)?.format("DD MMM YYYY") || "Not provided";

export default function CustomerProfileModal({ customer, onClose }) {
    const [profile, setProfile]         = useState(null);
    const [loading, setLoading]         = useState(true);
    const [loadError, setLoadError]     = useState("");
    const [editing, setEditing]         = useState(false);
    const [saving, setSaving]           = useState(false);
    const [saveError, setSaveError]     = useState("");
    const [jobTypes, setJobTypes]       = useState([]);
    const [jobsLoading, setJobsLoading] = useState(true);
    const [jobsError, setJobsError]     = useState("");
    const [reload, setReload]           = useState(0);
    const [form]                        = Form.useForm();
    const [messageApi, contextHolder]   = message.useMessage();

    useEffect(() => {
        let cancelled = false;
        const loadProfile = async () => {
            try {
                const res = await getDatas("/admin/customer-profiles", { phone_number: customer.phone_number });
                if (cancelled) return;
                if (res?.success && res.result === "Profile not found") {
                    setProfile(null);
                } else if (res?.success && res.result && typeof res.result === "object" && !Array.isArray(res.result)) {
                    setProfile(res.result);
                } else {
                    setLoadError(res?.message || res?.msg || "Unable to load customer profile.");
                }
            } catch {
                if (!cancelled) setLoadError("Unable to load customer profile. Please try again.");
            } finally {
                if (!cancelled) setLoading(false);
            }
        };
        const loadJobs = async () => {
            try {
                const res = await getDatas("/admin/job-types");
                if (cancelled) return;
                if (res?.success && Array.isArray(res.result)) setJobTypes(res.result);
                else setJobsError("Unable to load job types. Please retry before saving.");
            } catch {
                if (!cancelled) setJobsError("Unable to load job types. Please retry before saving.");
            } finally {
                if (!cancelled) setJobsLoading(false);
            }
        };
        loadProfile();
        loadJobs();
        return () => { cancelled = true; };
    }, [customer.phone_number, reload]);

    const retry = () => {
        setLoading(true);
        setJobsLoading(true);
        setLoadError("");
        setJobsError("");
        setReload((value) => value + 1);
    };

    const openForm = () => {
        form.resetFields();
        form.setFieldsValue({
            phone_number    : customer.phone_number,
            customer_name   : profile?.customer_name ?? customer.customer_name ?? "",
            job_type_id     : profile?.job_type_id == null ? undefined              : Number(profile.job_type_id),
            home_address    : profile?.home_address ?? "",
            office_address  : profile?.office_address ?? "",
            date_of_birth   : dateValue(profile?.date_of_birth),
            anniversary_date: dateValue(profile?.anniversary_date),
            marital_status  : profile?.marital_status ?? "unmarried",
            children_count  : Number(profile?.children_count ?? 0),
            son             : Number(profile?.son ?? 0),
            daughter        : Number(profile?.daughter ?? 0),
        });
        setSaveError("");
        setEditing(true);
    };

    const save = async (values) => {
        if (saving || loading || jobsLoading || jobsError || loadError) return;
        setSaving(true);
        setSaveError("");
        const payload = {
            phone_number    : customer.phone_number,
            customer_name   : values.customer_name.trim(),
            job_type_id     : values.job_type_id ?? null,
            home_address    : values.home_address?.trim() || null,
            office_address  : values.office_address?.trim() || null,
            date_of_birth   : values.date_of_birth?.format("YYYY-MM-DD") || null,
            anniversary_date: values.anniversary_date?.format("YYYY-MM-DD") || null,
            marital_status  : values.marital_status ?? "unmarried",
            children_count  : values.children_count ?? 0,
            son             : values.son ?? 0,
            daughter        : values.daughter ?? 0,
        };
        try {
            const res = await postData("/admin/customer-profiles", payload);

            if (!res?.success) {
                setSaveError(res?.message || res?.msg || "Unable to save the profile. Please try again.");
                if (res?.errors) form.setFields(Object.keys(payload).filter((name) => res.errors[name]).map((name) => ({
                    name, errors: Array.isArray(res.errors[name]) ? res.errors[name] : [String(res.errors[name])],
                })));
                return;
            }
            setProfile({ ...profile, ...payload, ...(res.result && typeof res.result === "object" && !Array.isArray(res.result) ? res.result : {}) });
            setEditing(false);
            messageApi.success(res.msg || "Customer profile updated.");
        } catch {
            setSaveError("Unable to save the profile. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    const jobName = profile?.job_type?.name || jobTypes.find((job) => String(job.id) === String(profile?.job_type_id))?.name;
    const detailStyle = { whiteSpace: "pre-wrap", overflowWrap: "anywhere" };

    return (
        <Modal open title={editing ? "Update Customer Profile" : "Customer Profile"} width={720} forceRender
            onCancel={() => { if (!saving) onClose(); }} closable={!saving} maskClosable={!saving} keyboard={!saving}
            footer={editing ? <Space><Button disabled={saving} onClick={() => setEditing(false)}>Back</Button><Button type="primary" loading={saving} disabled={loading || jobsLoading || Boolean(jobsError) || Boolean(loadError)} onClick={() => form.submit()}>Save Profile</Button></Space> : <Button onClick={onClose}>Close</Button>}
        >
            {contextHolder}
            <div style={{ background: "linear-gradient(135deg, #eff6ff, #f8fafc)", padding: 20, borderRadius: 14, marginBottom: 24 }}>
                <Space size={16} align="start">
                    <Avatar size={52} icon={<UserOutlined />} style={{ background: "#1677ff", flexShrink: 0 }} />
                    <div style={{ overflowWrap: "anywhere" }}>
                        <Typography.Title level={4} style={{ margin: "0 0 4px" }}>{profile?.customer_name || customer.customer_name || "Customer"}</Typography.Title>
                        <Typography.Text type="secondary"><PhoneOutlined /> {customer.phone_number}</Typography.Text>
                        {profile && <div style={{ marginTop: 8 }}><Tag color="blue">Customer profile</Tag></div>}
                    </div>
                </Space>
            </div>

            {loading ? <Skeleton active paragraph={{ rows: 5 }} /> : loadError ? (
                <Alert type="error" showIcon message="Profile could not be loaded" description={loadError} action={<Button onClick={retry}>Retry</Button>} />
            ) : !editing && !profile ? (
                <div style={{ padding: "16px 12px 28px", textAlign: "center" }}>
                    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={<><Typography.Title level={5}>No profile added yet</Typography.Title><Typography.Paragraph type="secondary">Add this customer’s personal details and addresses to keep their profile up to date.</Typography.Paragraph></>}>
                        <Button type="primary" icon={<EditOutlined />} onClick={openForm}>Update Profile</Button>
                    </Empty>
                </div>
            ) : !editing ? (
                <>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                        <Typography.Text strong>Personal details</Typography.Text>
                        <Button icon={<EditOutlined />} onClick={openForm}>Update Profile</Button>
                    </div>
                    <Descriptions bordered size="small" column={{ xs: 1, sm: 2, md: 2 }} layout="vertical" styles={{ content: detailStyle }} items={[
                        { key: "job", label: "Job Type", children: jobName || (profile.job_type_id ? `Job type #${profile.job_type_id}` : "Not provided") },
                        { key: "marital", label: "Marital Status", children: <span style={{ textTransform: "capitalize" }}>{profile.marital_status || "Not provided"}</span> },
                        { key: "birth", label: "Date of Birth", children: showDate(profile.date_of_birth) },
                        { key: "anniversary", label: "Anniversary Date", children: showDate(profile.anniversary_date) },
                        { key: "children", label: "Children", children: profile.children_count ?? 0 },
                        { key: "son", label: "Son", children: profile.son ?? 0 },
                        { key: "daughter", label: "Daughter", children: profile.daughter ?? 0 },
                        { key: "home", label: "Home Address", children: profile.home_address || "Not provided", span: 2 },
                        { key: "office", label: "Office Address", children: profile.office_address || "Not provided", span: 2 },
                    ]} />
                </>
            ) : null}

            <div style={{ display: editing && !loading && !loadError ? "block" : "none" }}>
                {saveError && <Alert type="error" showIcon message={saveError} style={{ marginBottom: 16 }} />}
                {jobsError && <Alert type="error" showIcon message={jobsError} action={<Button onClick={retry}>Retry</Button>} style={{ marginBottom: 16 }} />}
                <Form form={form} layout="vertical" onFinish={save} disabled={saving}>
                    <Row gutter={16}>
                        <Col xs={24} sm={12}>
                            <Form.Item name="phone_number" label="Phone Number">
                                <Input readOnly />
                            </Form.Item>
                        </Col>

                        <Col xs={24} sm={12}>
                            <Form.Item name="customer_name" label="Customer Name" rules={[{ required: true, whitespace: true, message: "Please enter the customer name." }]}>
                                <Input placeholder="Enter customer name" />
                            </Form.Item>
                        </Col>

                        <Col xs={24} sm={12}>
                            <Form.Item name="job_type_id" label="Job Type">
                                <Select allowClear showSearch optionFilterProp="label" placeholder="Select job type" loading={jobsLoading} options={jobTypes.map((job) => ({ value: Number(job.id), label: job.name }))} />
                            </Form.Item>
                        </Col>

                        <Col xs={24} sm={12}>
                            <Form.Item name="marital_status" label="Marital Status" rules={[{ required: true }]}>
                                <Select options={["unmarried", "married", "divorced", "widows"].map((value) => ({ value, label: value.charAt(0).toUpperCase() + value.slice(1) }))} />
                            </Form.Item>
                        </Col>

                        <Col xs={24} sm={12}>
                            <Form.Item name="date_of_birth" label="Date of Birth">
                                <DatePicker format="DD-MM-YYYY" style={{ width: "100%" }} />
                            </Form.Item>
                        </Col>

                        <Col xs={24} sm={12}>
                            <Form.Item name="anniversary_date" label="Anniversary Date">
                                <DatePicker format="DD-MM-YYYY" style={{ width: "100%" }} />
                            </Form.Item>
                        </Col>

                        <Col xs={24} sm={12}>
                            <Form.Item name="children_count" label="Children Count" rules={[{ type: "integer", min: 0, message: "Enter a whole number of 0 or more." }]}>
                                <InputNumber min={0} precision={0} style={{ width: "100%" }} />
                            </Form.Item>
                        </Col>

                        <Col xs={24} sm={12}>
                            <Form.Item name="son" label="Son" rules={[{ type: "integer", min: 0, message: "Enter a whole number of 0 or more." }]}>
                                <InputNumber min={0} precision={0} style={{ width: "100%" }} />
                            </Form.Item>
                        </Col>

                        <Col xs={24} sm={12}>
                            <Form.Item name="daughter" label="Daughter" rules={[{ type: "integer", min: 0, message: "Enter a whole number of 0 or more." }]}>
                                <InputNumber min={0} precision={0} style={{ width: "100%" }} />
                            </Form.Item>
                        </Col>

                        <Col span={24}>
                            <Form.Item name="home_address" label="Home Address">
                                <Input.TextArea rows={2} placeholder="Enter home address" />
                            </Form.Item>
                        </Col>

                        <Col span={24}>
                            <Form.Item name="office_address" label="Office Address">
                                <Input.TextArea rows={2} placeholder="Enter office address" />
                            </Form.Item>
                        </Col>
                    </Row>
                </Form>
            </div>
        </Modal>
    );
}
