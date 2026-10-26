import { message, Card, Form, Input, Button, Row, Col, Avatar, Typography, Tabs, Divider, Space, Tag, Empty, Skeleton, DatePicker, Select } from "antd";
import { useEffect, useState } from "react";
import { UserOutlined, MailOutlined, PhoneOutlined, LockOutlined, SaveOutlined, PlusOutlined, ClockCircleOutlined, SafetyCertificateOutlined, IdcardOutlined, BankOutlined, CalendarOutlined, FileTextOutlined, TeamOutlined, DownloadOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import { Upload } from "antd";
import useTitle from "../../../hooks/useTitle";
import { getDatas, postData, putData } from "../../../api/common/common";
import { useAuth } from "../../../hooks/useAuth";
import dayjs from "dayjs";
import "./Profile.css";

const { Title, Text } = Typography;
const responseMessage = (response, fallback) => Object.values(response?.errors || {})?.[0]?.[0] || response?.msg || response?.message || fallback;

export default function Profile() {
    // Hooks
    useTitle("Profile Management");

    const { user: authUser } = useAuth();
    const userId = authUser?.id;

    const [form]                                = Form.useForm();
    const [passwordForm]                        = Form.useForm();
    const [user, setUser]                       = useState(null);
    const [employeeProfile, setEmployeeProfile] = useState(null);
    const [documents, setDocuments]             = useState([]);
    const [emergencyContacts, setEmergencyContacts] = useState([]);
    const [hrLoading, setHrLoading]             = useState(true);
    const [loading, setLoading]                 = useState(false);
    const [passwordLoading, setPasswordLoading] = useState(false);
    const [messageApi, contextHolder]           = message.useMessage();

    useEffect(() => {
        if (!userId) return;

        let active = true;
        const load = async () => {
            setHrLoading(true);
            try {
                const res = await getDatas("/admin/employee-self/profile");

                if (!active) return;

                const userData    = res?.result?.user || null;
                const profileData = res?.result?.employee_profile || null;

                setUser(userData);
                setEmployeeProfile(profileData);
                setDocuments(profileData?.documents || []);
                setEmergencyContacts(profileData?.emergency_contacts || []);
                
                if (userData) {
                    form.setFieldsValue({
                        username    : userData.username,
                        email       : userData.email,
                        phone_number: userData.phone_number,
                        dob         : userData.dob ? dayjs(userData.dob) : null,
                        home_address: userData.home_address,
                        office_address: userData.office_address,
                        gender       : profileData?.gender,
                        marital_status: profileData?.marital_status,
                        blood_group  : profileData?.blood_group,
                        image       : userData.image ? [{ uid: "-1", url: userData.image, status: "done" }]: []
                    });
                }
            } catch (err) {
                console.error(err);
            } finally {
                if (active) setHrLoading(false);
            }
        };

        load();
        return () => { active = false; };
    }, [userId, form]);

    const handleSubmit = async (values) => {
        if (!userId) return;
        setLoading(true);

        const fd = new FormData();
        fd.append("username", values.username);
        fd.append("email", values.email || "");
        fd.append("phone_number", values.phone_number || "");
        fd.append("dob", values.dob ? values.dob.format("YYYY-MM-DD") : "");
        fd.append("home_address", values.home_address || "");
        fd.append("office_address", values.office_address || "");
        fd.append("gender", values.gender || "");
        fd.append("marital_status", values.marital_status || "");
        fd.append("blood_group", values.blood_group || "");
        
        if (values.image && values.image.length > 0) {
            const imgObj = values.image[0];
            if (imgObj.originFileObj) {
                fd.append("image", imgObj.originFileObj);
                fd.append("width", 450);
                fd.append("height", 450);
            }
        }
        
        fd.append("_method", "PUT");

        try {
            const res = await postData("/admin/employee-self/profile", fd);
            if (res && res.success) {
                messageApi.open({ type: 'success', content: res.msg });

                const newUser    = res?.result?.user || user;
                const newProfile = res?.result?.employee_profile || employeeProfile;

                setUser(newUser);
                setEmployeeProfile(newProfile);
                setDocuments(newProfile?.documents || []);
                setEmergencyContacts(newProfile?.emergency_contacts || []);

                form.setFieldsValue({
                    username    : newUser.username,
                    email       : newUser.email,
                    phone_number: newUser.phone_number,
                    dob         : newUser.dob ? dayjs(newUser.dob) : null,
                    home_address: newUser.home_address,
                    office_address: newUser.office_address,
                    gender       : newProfile?.gender,
                    marital_status: newProfile?.marital_status,
                    blood_group  : newProfile?.blood_group,
                    image       : newUser.image ? [{ uid: "-1", url: newUser.image, status: "done" }]: []
                });
            } else {
                messageApi.error(responseMessage(res, 'Update failed'));
            }
        } catch (err) {
            console.error(err);
            messageApi.open({ type: 'error', content: err?.response?.data?.msg || 'Update failed' });
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordUpdate = async (values) => {
        if (!userId) return;

        if (values.new_password !== values.confirm_password) {
            return messageApi.open({ type: 'error', content: 'Passwords do not match' });
        }

        setPasswordLoading(true);

        try {
            const res = await putData("/admin/employee-self/password", {
                current_password         : values.current_password,
                new_password             : values.new_password,
                new_password_confirmation: values.confirm_password,
            });

            if (res && res.success) {
                messageApi.open({ type: 'success', content: 'Password updated successfully' });
                passwordForm.resetFields();
            } else {
                messageApi.error(responseMessage(res, 'Password update failed'));
            }
        } catch (err) {
            console.error(err);
            messageApi.open({ type: 'error', content: err?.response?.data?.msg || 'Password update failed' });
        } finally {
            setPasswordLoading(false);
        }
    };

    const tabItems = [
        {
            key: '0',
            label: 'Employee Overview',
            children: (
                <div className="profile-overview">
                    <div className="profile-overview__header">
                        <div>
                            <Text type="secondary">Employee account overview</Text>
                            <Title level={3} style={{ margin: '3px 0 0', textTransform: 'capitalize' }}>{user?.username || 'Employee'}</Title>
                        </div>
                        <Tag color={user?.status === 'active' ? 'green' : 'default'} style={{ textTransform: 'capitalize' }}>{user?.status || 'unknown'}</Tag>
                    </div>

                    <div className="profile-overview__grid">
                        <div>
                            <span>
                                <IdcardOutlined /> Employee User ID
                            </span>

                            <strong>
                                #{user?.id || '—'}
                            </strong>
                        </div>

                        <div>
                            <span>
                                <MailOutlined /> Official Email
                            </span>

                            <strong>
                                {user?.email || '—'}
                            </strong>
                        </div>

                        <div>
                            <span>
                                <PhoneOutlined /> Contact Number
                            </span>

                            <strong>
                                {user?.phone_number || '—'}
                            </strong>
                        </div>

                        <div>
                            <span>
                                <SafetyCertificateOutlined /> Verification
                            </span>

                            <strong>
                                {user?.is_verified ? 'Verified' : 'Not Verified'}
                            </strong>
                        </div>

                        <div>
                            <span>
                                <ClockCircleOutlined /> Last Login
                            </span>

                            <strong>
                                {user?.login_at ? dayjs(user.login_at).format('DD MMM YYYY, hh:mm A') : '—'}
                            </strong>
                        </div>

                        <div>
                            <span>
                                <ClockCircleOutlined /> Last Logout
                            </span>
                            
                            <strong>
                                {user?.logout_at ? dayjs(user.logout_at).format('DD MMM YYYY, hh:mm A') : '—'}
                            </strong>
                        </div>
                    </div>

                    <Divider />
                    {hrLoading ? (
                        <Skeleton active paragraph={{ rows: 10 }} />
                    ) : !employeeProfile ? (
                        <Empty description="Employee HR profile has not been created yet" />
                    ) : (
                        <>
                            <div className="profile-section-title">
                                <div>
                                    <BankOutlined />
                                    <span>
                                        Employment Profile
                                    </span>
                                </div>

                                <Tag color={employeeProfile.status === 'active' ? 'green' : 'default'}>
                                    {employeeProfile.status || 'Unknown'}
                                </Tag>
                            </div>

                            <div className="profile-employment-grid">
                                <div>
                                    <span>
                                        Employee Code
                                    </span>

                                    <strong>
                                        {employeeProfile.employee_code || '—'}
                                    </strong>
                                </div>

                                <div>
                                    <span>
                                        Department
                                    </span>

                                    <strong>
                                        {employeeProfile.department?.name || '—'}
                                    </strong>
                                </div>

                                <div>
                                    <span>
                                        Designation
                                    </span>

                                    <strong>
                                        {employeeProfile.designation?.name || '—'}
                                    </strong>
                                </div>

                                <div>
                                    <span>
                                        Employment Type
                                    </span>
                                    <strong>
                                        {employeeProfile.employment_type?.name || '—'}
                                    </strong>
                                </div>

                                <div>
                                    <span>
                                        Work Shift
                                    </span>
                                    <strong>
                                        {employeeProfile.work_shift?.name || '—'}
                                    </strong>
                                </div>
                                <div>
                                    <span>
                                        Official Email
                                    </span>
                                    <strong>
                                        {employeeProfile.official_email || user?.email || '—'}
                                    </strong>
                                </div>

                                <div>
                                    <span>
                                        Basic Salary
                                    </span>

                                    <strong>
                                        ৳{Number(employeeProfile.basic_salary || 0).toLocaleString('en-BD', { minimumFractionDigits: 2 })}
                                    </strong>
                                </div>

                                <div>
                                    <span>
                                        Salary Type
                                    </span>

                                    <strong className="capitalize">
                                        {employeeProfile.salary_type || 'monthly'}
                                    </strong>
                                </div>
                            </div>

                            <div className="profile-info-columns">
                                <section className="profile-info-card">
                                    <h4>
                                        <CalendarOutlined /> Employment Timeline
                                    </h4>

                                    <div>
                                        <span>
                                            Joining Date
                                        </span>

                                        <strong>
                                            {employeeProfile.joining_date ? dayjs(employeeProfile.joining_date).format('DD MMM YYYY') : '—'}
                                        </strong>
                                    </div>

                                    <div>
                                        <span>
                                            Confirmation Date
                                        </span>
                                        <strong>
                                            {employeeProfile.confirmation_date ? dayjs(employeeProfile.confirmation_date).format('DD MMM YYYY') : '—'}
                                        </strong>
                                    </div>

                                    <div>
                                        <span>
                                            Termination Date
                                        </span>
                                        <strong>
                                            {employeeProfile.termination_date ? dayjs(employeeProfile.termination_date).format('DD MMM YYYY') : '—'}
                                        </strong>
                                    </div>
                                </section>

                                <section className="profile-info-card">
                                    <h4>
                                        <UserOutlined /> Personal Information
                                    </h4>

                                    <div>
                                        <span>
                                            Gender
                                        </span>
                                        <strong className="capitalize">
                                            {employeeProfile.gender || '—'}
                                        </strong>
                                    </div>

                                    <div>
                                        <span>
                                            Marital Status
                                        </span>
                                        <strong className="capitalize">
                                            {employeeProfile.marital_status || '—'}
                                        </strong>
                                    </div>

                                    <div>
                                        <span>
                                            Blood Group
                                        </span>
                                        <strong>
                                            {employeeProfile.blood_group || '—'}
                                        </strong>
                                    </div>
                                </section>
                            </div>

                            <div className="profile-section-title profile-section-title--spaced">
                                <div>
                                    <FileTextOutlined />
                                    <span>
                                        Employee Documents
                                    </span>
                                </div>
                                <Tag color="blue">
                                    {documents.length} Documents
                                </Tag>
                            </div>

                            {documents.length ? (
                                <div className="profile-document-list">
                                    {documents.map((document) => (
                                        <article key={document.id} className="profile-document-card">
                                            <span className="profile-document-card__icon">
                                                <FileTextOutlined />
                                            </span>

                                            <div className="profile-document-card__main">
                                                <strong className="capitalize">
                                                    {document.document_type || 'Document'}
                                                </strong>

                                                <span>
                                                    {document.document_number || 'No document number'}
                                                </span>

                                                <small>
                                                    Issued {document.issue_date ? dayjs(document.issue_date).format('DD MMM YYYY') : '—'} · Expires {document.expiry_date ? dayjs(document.expiry_date).format('DD MMM YYYY') : '—'}
                                                </small>
                                            </div>
                                            <Tag color={document.status === 'active' ? 'green' : 'default'}>{document.status || 'Unknown'}</Tag>
                                            {document.file_url && <Button type="link" href={document.file_url} target="_blank" icon={<DownloadOutlined />}>View</Button>}
                                        </article>
                                    ))}
                                </div>
                            ) : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No employee documents added" />}

                            <div className="profile-section-title profile-section-title--spaced">
                                <div>
                                    <TeamOutlined />
                                    <span>
                                        Emergency Contacts
                                    </span>
                                </div>

                                <Tag color="cyan">
                                    {emergencyContacts.length} Contacts
                                </Tag>
                            </div>
                            {emergencyContacts.length ? (
                                <div className="profile-contact-grid">
                                    {emergencyContacts.map((contact) => (
                                        <article key={contact.id} className={`profile-contact-card ${contact.is_primary ? 'is-primary' : ''}`}>
                                            <Avatar icon={<UserOutlined />} />
                                            <div>
                                                <div className="profile-contact-card__name">
                                                    <strong>
                                                        {contact.name}
                                                    </strong>

                                                    {contact.is_primary && 
                                                        <Tag color="blue">
                                                            Primary
                                                        </Tag>
                                                    }
                                                </div>

                                                <span className="capitalize">
                                                    {contact.relationship || '—'}
                                                </span>

                                                <a href={`tel:${contact.phone_number}`}>
                                                    <PhoneOutlined /> {contact.phone_number}
                                                </a>
                                                {contact.alternate_phone && 
                                                    <small>
                                                        Alternate: {contact.alternate_phone}
                                                    </small>
                                                }

                                                {contact.address && 
                                                    <small>
                                                        {contact.address}
                                                    </small>
                                                }
                                            </div>
                                        </article>
                                    ))}
                                </div>
                            ) : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No emergency contacts added" />}

                            <div className="profile-roles">
                                <Title level={5}>
                                    System Roles
                                </Title>
                                <Space wrap>
                                    {user?.roles?.map((role) => <Tag color="processing" key={role.id}>{role.display_name || role.name}</Tag>)}
                                    {!user?.roles?.length && <Text type="secondary">No roles assigned</Text>}
                                </Space>
                            </div>
                        </>
                    )}
                </div>
            ),
        },
        {
            key: '1',
            label: 'Personal Information',
            children: (
                <Form form={form} layout="vertical" onFinish={handleSubmit} requiredMark={false} className="profile-form">
                    <Row gutter={[24, 0]}>
                        <Col xs={24} md={12}>
                            <Form.Item label="Full Name" name="username" rules={[{ required: true, message: 'Please enter your name' }]}>
                                <Input prefix={<UserOutlined />} placeholder="Enter your full name" size="large" />
                            </Form.Item>
                        </Col>

                        <Col xs={24} md={12}>
                            <Form.Item label="Email Address" name="email" rules={[{ required: true, message: 'Please enter your email' }, { type: 'email', message: 'Enter a valid email' }]}>
                                <Input prefix={<MailOutlined />} placeholder="Enter your email" size="large" />
                            </Form.Item>
                        </Col>

                        <Col xs={24} md={12}>
                            <Form.Item label="Phone Number" name="phone_number" rules={[{ required: true, message: 'Please enter your phone number' }]}>
                                <Input prefix={<PhoneOutlined />} placeholder="Enter your phone number" size="large" />
                            </Form.Item>
                        </Col>

                        <Col xs={24} md={12}>
                            <Form.Item label="Date of Birth" name="dob">
                                <DatePicker size="large" format="DD MMM YYYY" style={{ width: '100%' }} disabledDate={(date) => date && date.isAfter(dayjs(), 'day')} />
                            </Form.Item>
                        </Col>

                        <Col xs={24} md={8}>
                            <Form.Item label="Gender" name="gender">
                                <Select size="large" allowClear placeholder="Select gender" options={[
                                    { value: 'male', label: 'Male' },
                                    { value: 'female', label: 'Female' },
                                    { value: 'other', label: 'Other' },
                                ]} />
                            </Form.Item>
                        </Col>

                        <Col xs={24} md={8}>
                            <Form.Item label="Marital Status" name="marital_status">
                                <Select size="large" allowClear placeholder="Select marital status" options={[
                                    { value: 'single', label: 'Single' },
                                    { value: 'married', label: 'Married' },
                                    { value: 'divorced', label: 'Divorced' },
                                    { value: 'widowed', label: 'Widowed' },
                                ]} />
                            </Form.Item>
                        </Col>

                        <Col xs={24} md={8}>
                            <Form.Item label="Blood Group" name="blood_group">
                                <Select size="large" allowClear placeholder="Select blood group" options={['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((value) => ({ value, label: value }))} />
                            </Form.Item>
                        </Col>

                        <Col xs={24} md={12}>
                            <Form.Item label="Home Address" name="home_address">
                                <Input.TextArea rows={3} placeholder="Enter your home address" showCount maxLength={1000} />
                            </Form.Item>
                        </Col>

                        <Col xs={24} md={12}>
                            <Form.Item label="Office Address" name="office_address">
                                <Input.TextArea rows={3} placeholder="Enter your office address" showCount maxLength={1000} />
                            </Form.Item>
                        </Col>
                        
                        <Col xs={24}>
                            <Divider orientation="left">Profile Picture</Divider>
                            <div style={{ marginBottom: 24 }}>
                                <Form.Item name="image" valuePropName="fileList" getValueFromEvent={(e) => (Array.isArray(e) ? e : e?.fileList)}>
                                    <Upload listType="picture-card" maxCount={1} beforeUpload={() => false} showUploadList={{ showPreviewIcon: false }}>
                                        <div>
                                            <PlusOutlined />
                                            <div style={{ marginTop: 8 }}>Upload</div>
                                        </div>
                                    </Upload>
                                </Form.Item>
                            </div>
                        </Col>
                    </Row>

                    <Form.Item>
                        <Button type="primary" htmlType="submit" size="large" icon={<SaveOutlined />} loading={loading} style={{ borderRadius: '8px', minWidth: '150px' }}>
                            Save Changes
                        </Button>
                    </Form.Item>
                </Form>
            ),
        },
        {
            key: '2',
            label: 'Security & Password',
            children: (
                <div style={{ maxWidth: '500px' }}>
                    <Title level={4}>Change Password</Title>

                    <Text type="secondary">Ensure your account is using a long, random password to stay secure.</Text>

                    <Divider />

                    <Form form={passwordForm} layout="vertical" onFinish={handlePasswordUpdate} requiredMark={false}>
                        <Form.Item label="Current Password" name="current_password" rules={[{ required: true, message: 'Please enter your current password' }]}>
                            <Input.Password prefix={<LockOutlined />} placeholder="Enter current password" size="large" autoComplete="current-password" />
                        </Form.Item>

                        <Form.Item label="New Password" name="new_password" rules={[{ required: true, message: 'Please enter new password' }, { min: 8, message: 'Password must be at least 8 characters' }]}>
                            <Input.Password prefix={<LockOutlined />} placeholder="Enter new password" size="large" autoComplete="new-password" />
                        </Form.Item>

                        <Form.Item label="Confirm New Password" name="confirm_password" dependencies={['new_password']} rules={[
                            { required: true, message: 'Please confirm your password' },
                            ({ getFieldValue }) => ({ validator(_, value) { return !value || getFieldValue('new_password') === value ? Promise.resolve() : Promise.reject(new Error('Passwords do not match')); } }),
                        ]}>
                            <Input.Password prefix={<LockOutlined />} placeholder="Confirm new password" size="large" autoComplete="new-password" />
                        </Form.Item>

                        <Form.Item>
                            <Button type="primary" htmlType="submit" size="large" loading={passwordLoading} style={{ borderRadius: '8px' }}>
                                Update Password
                            </Button>
                        </Form.Item>
                    </Form>
                </div>
            ),
        },
    ];

    return (
        <div style={{ padding: '24px', background: '#f5f7fa', minHeight: '100vh' }}>
            {contextHolder}
            
            <Row gutter={[24, 24]}>
                <Col xs={24}>
                    <div style={{ 
                        background  : 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)',
                        height      : '180px',
                        borderRadius: '16px',
                        marginBottom: '-60px',
                        position    : 'relative',
                        boxShadow   : '0 4px 12px rgba(0,0,0,0.1)'
                    }}>
                        <div style={{ position: 'absolute', bottom: '70px', left: '40px', color: '#fff' }}>
                            <Button
                                type="text"
                                icon={<ArrowLeftOutlined />}
                                onClick={() => window.history.back()}
                                style={{ color: '#fff', padding: 0, height: 'auto', marginBottom: 10 }}
                            >
                                Back
                            </Button>
                            <Title level={2} style={{ color: '#fff', margin: 0 }}>My Profile</Title>
                            <Text style={{ color: 'rgba(255,255,255,0.85)' }}>Manage your account settings and preferences</Text>
                        </div>
                    </div>
                </Col>

                <Col xs={24} lg={8}>
                    <Card 
                        bordered={false} 
                        style={{ 
                            borderRadius: '16px', 
                            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                            textAlign: 'center',
                            paddingTop: '20px'
                        }}
                    >
                        <div style={{ position: 'relative', display: 'inline-block', marginTop: '20px' }}>
                            <Avatar size={120} src={user?.image} icon={<UserOutlined />} style={{ border: '4px solid #fff', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', backgroundColor: '#1890ff' }} />
                            <div style={{ position: 'absolute', bottom: '5px', right: '5px', background: '#52c41a', width: '20px', height: '20px', borderRadius: '50%', border: '3px solid #fff' }}></div>
                        </div>

                        <Title level={3} style={{ marginTop: '16px', marginBottom: '4px', textTransform: 'capitalize' }}>
                            {user?.username || 'User'}
                        </Title>

                        <Tag color="processing" style={{ borderRadius: '10px', padding: '2px 12px' }}>
                            {user?.roles?.[0]?.display_name || 'Staff'}
                        </Tag>

                        <Divider />
                        <div style={{ textAlign: 'left' }}>
                            <Space direction="vertical" style={{ width: '100%' }} size="middle">
                                <div>
                                    <Text type="secondary" style={{ display: 'block', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', marginBottom: '2px' }}>
                                        Email Address
                                    </Text>

                                    <Text strong>
                                        {user?.email || 'N/A'}
                                    </Text>
                                </div>

                                <div>
                                    <Text type="secondary" style={{ display: 'block', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', marginBottom: '2px' }}>
                                        Phone Number
                                    </Text>

                                    <Text strong>
                                        {user?.phone_number || 'N/A'}
                                    </Text>
                                </div>

                                <Row gutter={12}>
                                    <Col span={12}>
                                        <Text type="secondary" style={{ display: 'block', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', marginBottom: '2px' }}>
                                            Employee User ID
                                        </Text>

                                        <Text strong>
                                            #{user?.id || '—'}
                                        </Text>
                                    </Col>

                                    <Col span={12}>
                                        <Text type="secondary" style={{ display: 'block', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', marginBottom: '2px' }}>
                                            Account Status
                                        </Text>
                                        <Tag color={user?.status === 'active' ? 'green' : 'red'} style={{ border: 'none', background: user?.status === 'active' ? '#f6ffed' : '#fff1f0', color: user?.status === 'active' ? '#52c41a' : '#ff4d4f', fontWeight: 600, margin: 0, fontSize: '12px' }}>
                                            {user?.status ? (user.status.charAt(0).toUpperCase() + user.status.slice(1)) : 'Inactive'}
                                        </Tag>
                                    </Col>
                                </Row>

                                <Divider style={{ margin: '8px 0' }} />

                                <div>
                                    <Text type="secondary" style={{ display: 'block', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', marginBottom: '2px' }}>
                                        Last Active
                                    </Text>
                                    
                                    <Text strong>
                                        {user?.login_at || 'Never'}
                                    </Text>
                                </div>
                            </Space>
                        </div>
                    </Card>
                </Col>

                <Col xs={24} lg={16}>
                    <Card 
                        bordered={false} 
                        style={{ 
                            borderRadius: '16px', 
                            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                            minHeight: '520px'
                        }}
                    >
                        <Tabs defaultActiveKey="0" items={tabItems} size="large" indicatorSize={(origin) => origin - 16}/>
                    </Card>
                </Col>
            </Row>
        </div>
    );
}
