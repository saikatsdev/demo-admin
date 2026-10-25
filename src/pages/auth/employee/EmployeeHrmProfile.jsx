import {ArrowLeftOutlined,BankOutlined,CalendarOutlined,CheckCircleFilled,ClockCircleOutlined,DeleteOutlined,EditOutlined,FileTextOutlined,IdcardOutlined,MailOutlined,PhoneOutlined,PlusOutlined,SaveOutlined,TeamOutlined,UploadOutlined,UserOutlined} from "@ant-design/icons";
import {Avatar,Breadcrumb,Button,Card,Col,DatePicker,Empty,Form,Input,message,Modal,Popconfirm,Row,Select,Space,Spin,Switch,Table,Tabs,Tag,Typography,Upload} from "antd";
import dayjs from "dayjs";
import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { deleteData, getDatas, postData, putData } from "../../../api/common/common";
import { usePermission } from "../../../hooks/usePermission";
import useTitle from "../../../hooks/useTitle";
import "./employeeHrmProfile.css";

const { Text, Title } = Typography;
const statusOptions = [{ value: "active", label: "Active" }, { value: "inactive", label: "Inactive" }, { value: "draft", label: "Draft" }];
const dateValue = (value) => value ? dayjs(value) : null;
const responseMessage = (response, fallback) => Object.values(response?.errors || {})?.[0]?.[0] || response?.msg || response?.message || fallback;

export default function EmployeeHrmProfile() {
    const { id }                                = useParams();
    const { can }                               = usePermission();
    const [profileForm]                         = Form.useForm();
    const [documentForm]                        = Form.useForm();
    const [contactForm]                         = Form.useForm();
    const [messageApi, contextHolder]           = message.useMessage();
    const [employee, setEmployee]               = useState(null);
    const [profile, setProfile]                 = useState(null);
    const [documents, setDocuments]             = useState([]);
    const [contacts, setContacts]               = useState([]);
    const [options, setOptions]                 = useState({ departments: [], designations: [], employmentTypes: [], workShifts: [] });
    const [loading, setLoading]                 = useState(true);
    const [optionsLoading, setOptionsLoading]   = useState(true);
    const [relatedLoading, setRelatedLoading]   = useState(true);
    const [minimumLoading, setMinimumLoading]   = useState(true);
    const [saving, setSaving]                   = useState(false);
    const [documentModal, setDocumentModal]     = useState(false);
    const [contactModal, setContactModal]       = useState(false);
    const [editingDocument, setEditingDocument] = useState(null);
    const [editingContact, setEditingContact]   = useState(null);
    
    useTitle(employee ? `${employee.username} - HR Profile` : "Employee HR Profile");

    useEffect(() => {
        setMinimumLoading(true);
        const timer = window.setTimeout(() => setMinimumLoading(false), 700);
        return () => window.clearTimeout(timer);
    }, [id]);

    const fillProfileForm = useCallback((data) => {
        profileForm.setFieldsValue({
            employee_code     : data?.employee_code,
            department_id     : data?.department_id,
            designation_id    : data?.designation_id,
            employment_type_id: data?.employment_type_id,
            work_shift_id     : data?.work_shift_id,
            official_email    : data?.official_email,
            joining_date      : dateValue(data?.joining_date),
            confirmation_date : dateValue(data?.confirmation_date),
            termination_date  : dateValue(data?.termination_date),
            gender            : data?.gender,
            marital_status    : data?.marital_status,
            blood_group       : data?.blood_group,
            status            : data?.status || "active",
        });
    }, [profileForm]);

    useEffect(() => {
        let active = true;
        const loadPage = async () => {
            setLoading(true);
            const userResponse = await getDatas(`/admin/users/${id}`);
            if (!active) return;
            const user = userResponse?.result;
            setEmployee(user || null);

            if (user) {
                const profileResponse = await getDatas("/admin/employee-profiles", { search_key: user.phone_number, paginate_size: 100 });
                if (!active) return;
                const found = (profileResponse?.result?.data || []).find((item) => Number(item.user_id) === Number(id)) || null;
                setProfile(found);
                fillProfileForm(found);
            }
            setLoading(false);
        };
        loadPage();
        return () => { active = false; };
    }, [fillProfileForm, id]);

    useEffect(() => {
        let active = true;
        const loadOptions = async () => {
            setOptionsLoading(true);
            try {
                const [departments, designations, employmentTypes, workShifts] = await Promise.all([
                    getDatas("/admin/departments", { paginate_size: 100, status: "active" }),
                    getDatas("/admin/designations", { paginate_size: 100, status: "active" }),
                    getDatas("/admin/employment-types", { paginate_size: 100, status: "active" }),
                    getDatas("/admin/work-shifts", { paginate_size: 100, status: "active" }),
                ]);
                if (!active) return;
                const map = (response) => (response?.result?.data || []).map((item) => ({ value: item.id, label: `${item.name}${item.code ? ` (${item.code})` : ""}` }));
                setOptions({ departments: map(departments), designations: map(designations), employmentTypes: map(employmentTypes), workShifts: map(workShifts) });
            } finally {
                if (active) setOptionsLoading(false);
            }
        };
        loadOptions();
        return () => { active = false; };
    }, []);

    const loadDocuments = useCallback(async () => {
        if (!profile?.id) return;
        const response = await getDatas("/admin/employee-documents", { employee_profile_id: profile.id, paginate_size: 100 });
        setDocuments(response?.result?.data || []);
    }, [profile?.id]);

    const loadContacts = useCallback(async () => {
        if (!profile?.id) return;
        const response = await getDatas("/admin/employee-emergency-contacts", { employee_profile_id: profile.id, paginate_size: 100 });
        setContacts(response?.result?.data || []);
    }, [profile?.id]);

    useEffect(() => {
        let active = true;

        const loadRelatedData = async () => {
            if (loading) return;

            if (!profile?.id) {
                setRelatedLoading(false);
                return;
            }

            setRelatedLoading(true);
            try {
                await Promise.all([loadDocuments(), loadContacts()]);
            } finally {
                if (active) setRelatedLoading(false);
            }
        };

        loadRelatedData();
        return () => { active = false; };
    }, [loadContacts, loadDocuments, loading, profile?.id]);

    const saveProfile = async (values) => {
        setSaving(true);
        const payload = {
            user_id           : Number(id),
            employee_code     : values.employee_code.trim(),
            department_id     : values.department_id || null,
            designation_id    : values.designation_id || null,
            employment_type_id: values.employment_type_id || null,
            work_shift_id     : values.work_shift_id || null,
            official_email    : values.official_email?.trim() || null,
            joining_date      : values.joining_date?.format("YYYY-MM-DD") || null,
            confirmation_date : values.confirmation_date?.format("YYYY-MM-DD") || null,
            termination_date  : values.termination_date?.format("YYYY-MM-DD") || null,
            gender            : values.gender || null,
            marital_status    : values.marital_status || null,
            blood_group       : values.blood_group || null,
            status            : values.status,
        };

        const response = profile ? await putData(`/admin/employee-profiles/${profile.id}`, payload) : await postData("/admin/employee-profiles", payload);

        setSaving(false);

        if (!response?.success) return messageApi.error(responseMessage(response, "Unable to save employee profile"));

        setProfile(response.result);

        fillProfileForm(response.result);

        messageApi.success(response.msg || "Employee profile saved successfully");
    };

    const openDocument = (record = null) => {
        setEditingDocument(record);
        documentForm.resetFields();
        documentForm.setFieldsValue(record ? {
            document_type: record.document_type, document_number: record.document_number,
            issue_date: dateValue(record.issue_date), expiry_date: dateValue(record.expiry_date), status: record.status,
        } : { status: "active" });
        setDocumentModal(true);
    };

    const saveDocument = async () => {
        const values = await documentForm.validateFields();

        const data = new FormData();

        data.append("employee_profile_id", profile.id); data.append("document_type", values.document_type);

        if (values.document_number) data.append("document_number", values.document_number);

        const selectedFile = values.file?.[0]?.originFileObj;

        if (selectedFile) data.append("file", selectedFile);

        if (values.issue_date) data.append("issue_date", values.issue_date.format("YYYY-MM-DD"));

        if (values.expiry_date) data.append("expiry_date", values.expiry_date.format("YYYY-MM-DD"));

        data.append("status", values.status);

        if (editingDocument) data.append("_method", "PUT");

        setSaving(true);

        const response = await postData(editingDocument ? `/admin/employee-documents/${editingDocument.id}` : "/admin/employee-documents", data, { headers: { "Content-Type": "multipart/form-data" } });

        setSaving(false);

        if (!response?.success) return messageApi.error(responseMessage(response, "Unable to save document"));

        setDocumentModal(false); await loadDocuments(); messageApi.success(response.msg);
    };

    const openContact = (record = null) => {
        setEditingContact(record); contactForm.resetFields();
        contactForm.setFieldsValue(record ? { ...record } : { is_primary: false, status: "active" });
        setContactModal(true);
    };

    const saveContact = async () => {
        const values = await contactForm.validateFields();
        
        const payload = { 
            ...values, employee_profile_id: profile.id, 
            is_primary: Boolean(values.is_primary) 
        };
        setSaving(true);

        const response = editingContact ? await putData(`/admin/employee-emergency-contacts/${editingContact.id}`, payload) : await postData("/admin/employee-emergency-contacts", payload);

        setSaving(false);

        if (!response?.success) return messageApi.error(responseMessage(response, "Unable to save emergency contact"));

        setContactModal(false); await loadContacts(); messageApi.success(response.msg);
    };

    const overviewTab = (
        <div className="employee-overview">
            <div className="employee-overview__hero">
                <div className="employee-overview__identity">
                    <Avatar size={76} src={employee?.image} icon={<UserOutlined />} />
                    <div>
                        <div className="employee-overview__eyebrow">
                            Employee Profile
                        </div>

                        <Title level={3}>
                            {employee?.username || "Employee"}
                        </Title>

                        <Space size={[6, 6]} wrap>
                            {profile?.employee_code && 
                            <Tag icon={<IdcardOutlined />} color="blue">
                                {profile.employee_code}
                            </Tag>}

                            <Tag style={{textTransform:"capitalize"}} icon={<CheckCircleFilled />} color={employee?.status === "active" ? "green" : "default"}>
                                {employee?.status || "Unknown"}
                            </Tag>

                            {employee?.roles?.map((role) => <Tag key={role.id}>{role.display_name || role.name}</Tag>)}
                        </Space>
                    </div>
                </div>
                <div className="employee-overview__quick-contact">
                    <div>
                        <MailOutlined />
                        <span>
                            {profile?.official_email || employee?.email || "No email available"}
                        </span>
                    </div>

                    <div>
                        <PhoneOutlined />
                        <span>
                            {employee?.phone_number || "No phone available"}
                        </span>
                    </div>
                </div>
            </div>

            {!profile ? (
                <Empty className="employee-overview__empty" description="Employment profile has not been created yet" />
            ) : (
                <Row gutter={[16, 16]}>
                    <Col xs={24} lg={12}>
                        <Card className="employee-detail-card" title={<span><BankOutlined /> Employment Information</span>}>
                            <div className="employee-detail-grid">
                                <div>
                                    <span>
                                        Department
                                    </span>
                                    <strong>
                                        {profile.department?.name || "—"}
                                    </strong>
                                </div>

                                <div>
                                    <span>
                                        Designation
                                    </span>

                                    <strong>
                                        {profile.designation?.name || "—"}
                                    </strong>
                                </div>

                                <div>
                                    <span>
                                        Employment Type
                                    </span>

                                    <strong>
                                        {profile.employment_type?.name || "—"}
                                    </strong>
                                </div>

                                <div>
                                    <span>
                                        Work Shift
                                    </span>

                                    <strong>
                                        {profile.work_shift?.name || "—"}
                                    </strong>
                                </div>
                            </div>
                        </Card>
                    </Col>

                    <Col xs={24} lg={12}>
                        <Card className="employee-detail-card" title={<span><CalendarOutlined /> Employment Timeline</span>}>
                            <div className="employee-detail-grid">
                                <div>
                                    <span>
                                        Joining Date
                                    </span>

                                    <strong>
                                        {profile.joining_date ? dayjs(profile.joining_date).format("DD MMM YYYY") : "—"}
                                    </strong>
                                </div>
                                
                                <div>
                                    <span>
                                        Confirmation Date
                                    </span>

                                    <strong>
                                        {profile.confirmation_date ? dayjs(profile.confirmation_date).format("DD MMM YYYY") : "—"}
                                    </strong>
                                </div>

                                <div>
                                    <span>
                                        Termination Date
                                    </span>
                                    <strong>
                                        {profile.termination_date ? dayjs(profile.termination_date).format("DD MMM YYYY") : "—"}
                                    </strong>
                                </div>

                                <div>
                                    <span>
                                        Account Activity
                                    </span>
                                    <strong>
                                        {employee?.active ? "Online / Active" : "Offline"}
                                    </strong>
                                </div>
                            </div>
                        </Card>
                    </Col>

                    <Col xs={24} lg={12}>
                        <Card className="employee-detail-card" title={<span><UserOutlined /> Personal Information</span>}>
                            <div className="employee-detail-grid">
                                <div>
                                    <span>
                                        Gender
                                    </span>

                                    <strong className="capitalize">
                                        {profile.gender || "—"}
                                    </strong>
                                </div>

                                <div>
                                    <span>
                                        Marital Status
                                    </span>

                                    <strong className="capitalize">
                                        {profile.marital_status || "—"}
                                    </strong>
                                </div>

                                <div>
                                    <span>
                                        Blood Group
                                    </span>
                                    <strong>
                                        {profile.blood_group || "—"}
                                    </strong>
                                </div>

                                <div>
                                    <span>
                                        Profile Status
                                    </span>

                                    <strong className="capitalize">
                                        {profile.status || "—"}
                                    </strong>
                                </div>
                            </div>
                        </Card>
                    </Col>
                    <Col xs={24} lg={12}>
                        <Card className="employee-detail-card" title={<span><ClockCircleOutlined /> Account Information</span>}>
                            <div className="employee-detail-grid">
                                <div>
                                    <span>
                                        User ID
                                    </span>
                                    <strong>
                                        #{employee?.id}
                                    </strong>
                                </div>

                                <div>
                                    <span>
                                        User Type
                                    </span>
                                    <strong className="capitalize">
                                        {employee?.user_type || "—"}
                                    </strong>
                                </div>

                                <div>
                                    <span>
                                        Last Login
                                    </span>
                                    <strong>
                                        {employee?.login_at || "—"}
                                    </strong>
                                </div>

                                <div>
                                    <span>
                                        Verification
                                    </span>
                                    <strong>
                                        {employee?.is_verified ? "Verified" : "Not Verified"}
                                    </strong>
                                </div>
                            </div>
                        </Card>
                    </Col>
                </Row>
            )}
        </div>
    );

    const profileTab = (
        <Form form={profileForm} layout="vertical" onFinish={saveProfile} requiredMark="optional">
            <Row gutter={16}>
                <Col xs={24} md={12}>
                    <Form.Item name="employee_code" label="Employee Code" rules={[{ required: true }]}>
                        <Input placeholder="EMP-0001" />
                    </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                    <Form.Item name="official_email" label="Official Email">
                        <Input />
                    </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                    <Form.Item name="department_id" label="Department">
                        <Select allowClear showSearch optionFilterProp="label" options={options.departments} />
                    </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                    <Form.Item name="designation_id" label="Designation">
                        <Select allowClear showSearch optionFilterProp="label" options={options.designations} />
                    </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                    <Form.Item name="employment_type_id" label="Employment Type">
                        <Select allowClear options={options.employmentTypes} />
                    </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                    <Form.Item name="work_shift_id" label="Work Shift">
                        <Select allowClear options={options.workShifts} />
                    </Form.Item>
                </Col>

                <Col xs={24} md={8}>
                    <Form.Item name="joining_date" label="Joining Date">
                        <DatePicker style={{ width: "100%" }} />
                    </Form.Item>
                </Col>

                <Col xs={24} md={8}>
                    <Form.Item name="confirmation_date" label="Confirmation Date">
                        <DatePicker style={{ width: "100%" }} />
                    </Form.Item>
                </Col>

                <Col xs={24} md={8}>
                    <Form.Item name="termination_date" label="Termination Date">
                        <DatePicker style={{ width: "100%" }} />
                    </Form.Item>
                </Col>

                <Col xs={24} md={8}>
                    <Form.Item name="gender" label="Gender">
                        <Select allowClear options={[{value:"male",label:"Male"},{value:"female",label:"Female"},{value:"other",label:"Other"}]} />
                    </Form.Item>
                </Col>

                <Col xs={24} md={8}>
                    <Form.Item name="marital_status" label="Marital Status">
                        <Select allowClear options={["single","married","divorced","widowed"].map(value=>({value,label:value[0].toUpperCase()+value.slice(1)}))} />
                    </Form.Item>
                </Col>

                <Col xs={24} md={8}>
                    <Form.Item name="blood_group" label="Blood Group">
                        <Select allowClear options={["A+","A-","B+","B-","AB+","AB-","O+","O-"].map(value=>({value,label:value}))} />
                    </Form.Item>
                </Col>

                <Col xs={24} md={8}>
                    <Form.Item name="status" label="Status" rules={[{ required: true }]}>
                        <Select options={statusOptions} />
                    </Form.Item>
                </Col>
            </Row>
            {can(profile ? "employees-update" : "employees-create") && <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={saving}>Save Employment Profile</Button>}
        </Form>
    );

    const documentColumns = 
    [
        { 
            title: "Type", 
            dataIndex: "document_type" 
        }, 
        { 
            title: "Number", 
            dataIndex: "document_number", 
            render: value => value || "—" 
        },
        { 
            title: "Issue", 
            dataIndex: "issue_date", 
            render: value => value || "—" 
        }, 
        { 
            title: "Expiry", 
            dataIndex: "expiry_date", 
            render: value => value || "—" 
        },
        { 
            title: "File", 
            dataIndex: "file_url", 
            render: value => <a href={value} target="_blank" rel="noreferrer">View</a> 
        },
        { 
            title: "Status", 
            dataIndex: "status", 
            render: value => <Tag style={{textTransform:"capitalize"}} color={value === "active" ? "green" : "default"}>{value}</Tag> 
        },
        { 
            title: "Action", 
            render: (_, record) => 
            <Space>
                {can("employee-documents-update") && 
                    <Button icon={<EditOutlined />} onClick={()=>openDocument(record)} />
                }

                {can("employee-documents-delete") && 
                    <Popconfirm title="Delete document?" onConfirm={async()=>{
                        const r=await deleteData(`/admin/employee-documents/${record.id}`);
                        if(r?.success){
                            loadDocuments();
                            messageApi.success(r.msg);
                        }}}>
                        <Button danger icon={<DeleteOutlined />} />
                    </Popconfirm>
                }
            </Space> 
        },
    ];

    const contactColumns = 
    [
        { 
            title: "Name", 
            dataIndex: "name" 
        }, 
        { 
            title: "Relationship", 
            dataIndex: "relationship" 
        }, 
        { 
            title: "Phone", 
            dataIndex: "phone_number" 
        },
        { 
            title: "Primary", 
            dataIndex: "is_primary", 
            render: value => value ? <Tag color="blue">Primary</Tag> : "—" 
        },
        { 
            title: "Status", 
            dataIndex: "status", 
            render: value => <Tag style={{textTransform:"capitalize"}} color={value === "active" ? "green" : "default"}>{value}</Tag> 
        },
        { 
            title: "Action", 
            render: (_, record) => 
            <Space>
                {can("employees-update") && 
                    <Button icon={<EditOutlined />} onClick={()=>openContact(record)} />
                }
                {can("employees-update") && 
                    <Popconfirm title="Delete contact?" onConfirm={async()=>{
                        const r=await deleteData(`/admin/employee-emergency-contacts/${record.id}`);
                        if(r?.success){
                            loadContacts();
                            messageApi.success(r.msg);
                        }}}>
                        <Button danger icon={<DeleteOutlined />} />
                    </Popconfirm>
                }
            </Space> 
        },
    ];

    if (loading || optionsLoading || relatedLoading || minimumLoading) {
        return (
            <div className="employee-details-loader">
                <Spin size="large" />
                <Title level={5}>Loading employee details</Title>
                <Text type="secondary">Please wait while profile, documents and contacts are being prepared...</Text>
            </div>
        );
    }

    return (
        <div style={{ padding: 24, background: "#f8fafc", minHeight: "100vh" }}>
            {contextHolder}
            <Card style={{ marginBottom: 20, borderRadius: 16 }}>
                <Row justify="space-between" align="middle">
                    <Col>
                        <Space>
                            <Avatar size={52} src={employee?.image} icon={<UserOutlined />} />
                            <div>
                                <Title level={3} style={{margin:0}}>
                                    {employee?.username || "Employee"}
                                </Title>

                                <Text type="secondary">
                                    {employee?.phone_number}
                                </Text>
                            </div>
                        </Space>
                    </Col>

                    <Col>
                        <Button icon={<ArrowLeftOutlined />} onClick={()=>window.history.back()}>
                            Back
                        </Button>
                    </Col>
                </Row>

                <Breadcrumb style={{marginTop:12}} items={[{title:<Link to="/dashboard">Dashboard</Link>},{title:<Link to="/hrm/employees">HRM Employees</Link>},{title:"HR Profile"}]} />
            </Card>

            <Card style={{ borderRadius: 16 }}>
                <Tabs items={[
                    {
                        key:"overview",
                        label:
                        <span>
                            <IdcardOutlined /> Overview
                        </span>,
                        children:overviewTab
                    },
                    { 
                        key:"profile", 
                        label:
                        <span>
                            <UserOutlined /> Employment Profile
                        </span>, 
                        children:profileTab 
                    },
                    can("employee-documents-read") && 
                    { 
                        key:"documents", 
                        label:
                        <span>
                            <FileTextOutlined /> 
                            Documents
                        </span>,

                        children:profile ? 
                        <>
                            <div style={{textAlign:"right",marginBottom:12}}>
                                {can("employee-documents-create")&&
                                    <Button type="primary" icon={<PlusOutlined />} onClick={()=>openDocument()}>
                                        Add Document
                                    </Button>
                                }
                            </div>
                            <Table rowKey="id" dataSource={documents} columns={documentColumns} pagination={false} scroll={{x:800}} />
                        </> : 
                        <Empty description="Create the employment profile first" /> 
                    },
                    can("employees-read") && 
                    { 
                        key:"contacts", 
                        label:
                        <span>
                            <TeamOutlined /> Emergency Contacts
                        </span>, 
                        children:profile ? 
                        <>
                            <div style={{textAlign:"right",marginBottom:12}}>
                                {
                                can("employees-update")
                                &&
                                <Button type="primary" icon={<PlusOutlined />} onClick={()=>openContact()}>
                                    Add Contact
                                </Button>}
                            </div>
                            <Table rowKey="id" dataSource={contacts} columns={contactColumns} pagination={false} scroll={{x:700}} />
                        </> : 
                        <Empty description="Create the employment profile first" /> },
                ].filter(Boolean)} />
            </Card>

            <Modal open={documentModal} title={editingDocument?"Edit Document":"Add Document"} onCancel={()=>setDocumentModal(false)} onOk={saveDocument} confirmLoading={saving} destroyOnHidden>
                <Form form={documentForm} layout="vertical">
                    <Form.Item name="document_type" label="Document Type" rules={[{required:true}]}>
                        <Select options={["NID","Passport","Birth Certificate","Educational Certificate","Appointment Letter","Other"].map(value=>({value,label:value}))} />
                    </Form.Item>

                    <Form.Item name="document_number" label="Document Number">
                        <Input />
                    </Form.Item>

                    <Row gutter={12}>
                        <Col span={12}>
                            <Form.Item name="issue_date" label="Issue Date">
                                <DatePicker style={{width:"100%"}} />
                            </Form.Item>
                        </Col>

                        <Col span={12}>
                            <Form.Item name="expiry_date" label="Expiry Date" dependencies={["issue_date"]} rules={[({getFieldValue})=>({validator(_,value){const issueDate=getFieldValue("issue_date");return !value||!issueDate||!value.isBefore(issueDate,"day")?Promise.resolve():Promise.reject(new Error("Expiry date cannot be before issue date"));}})]}>
                                <DatePicker style={{width:"100%"}} />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Form.Item name="file" label="File" valuePropName="fileList" getValueFromEvent={event=>Array.isArray(event)?event:event?.fileList} rules={editingDocument?[]:[{required:true,message:"Please select a document"}]}>
                        <Upload beforeUpload={()=>false} maxCount={1} accept=".pdf,.jpg,.jpeg,.png">
                            <Button icon={<UploadOutlined />}>
                                Select File
                            </Button>
                        </Upload>
                    </Form.Item>

                    <Form.Item name="status" label="Status" rules={[{required:true}]}>
                        <Select options={statusOptions} />
                    </Form.Item>
                </Form>
            </Modal>

            <Modal open={contactModal} title={editingContact?"Edit Emergency Contact":"Add Emergency Contact"} onCancel={()=>setContactModal(false)} onOk={saveContact} confirmLoading={saving} destroyOnHidden>
                <Form form={contactForm} layout="vertical">
                    <Row gutter={12}>
                        <Col span={12}>
                            <Form.Item name="name" label="Name" rules={[{required:true}]}>
                                <Input />
                            </Form.Item>
                        </Col>

                        <Col span={12}>
                            <Form.Item name="relationship" label="Relationship" rules={[{required:true}]}>
                                <Input />
                            </Form.Item>
                        </Col>

                        <Col span={12}>
                            <Form.Item name="phone_number" label="Phone" rules={[{required:true}]}>
                                <Input />
                            </Form.Item>
                        </Col>

                        <Col span={12}>
                            <Form.Item name="alternate_phone" label="Alternate Phone">
                                <Input />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Form.Item name="address" label="Address">
                        <Input.TextArea rows={3} />
                    </Form.Item>

                    <Form.Item name="is_primary" label="Primary Contact" valuePropName="checked">
                        <Switch />
                    </Form.Item>

                    <Form.Item name="status" label="Status" rules={[{required:true}]}>
                        <Select options={statusOptions} />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    )
}
