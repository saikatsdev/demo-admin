import { Breadcrumb, message, Select as AntSelect, Card, Row, Col, Input as AntInput, Button, Typography, Space, Divider, Form } from "antd";
import { UserOutlined, PhoneOutlined, MailOutlined, LockOutlined, DollarCircleOutlined, TeamOutlined, AppstoreOutlined, CheckCircleOutlined, ArrowLeftOutlined, CameraOutlined, DeleteOutlined, SaveOutlined } from "@ant-design/icons";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getDatas, postData } from "../../../api/common/common";
import useTitle from "../../../hooks/useTitle";
import ImagePicker from "../../../components/image/ImagePicker";

const { Title, Text, Paragraph } = Typography;
const { Option } = AntSelect;

export default function EditEmployee() {
    // Hook
    useTitle("Edit Employee");

    // Variable
    const navigate = useNavigate();
    const {id} = useParams();

    const [image, setImage]                       = useState(null);
    const [preview, setPreview]                   = useState(null);
    const [roleOptions, setRoleOptions]           = useState([]);
    const [categoryOptions, setCategoryOptions]   = useState([]);
    const [managerOptions, setManagerOptions]     = useState([]);
    const [messageApi, contextHolder]             = message.useMessage();
    const [selectedRoles, setSelectedRoles]       = useState([]);
    const [user, setUser]                         = useState({});
    const [selectedCategory, setSelectedCategory] = useState("");
    const [status, setStatus]                     = useState("");
    const [manager, setManager]                   = useState("");
    const [loading, setLoading]                   = useState(false);

    // Gallery States for ImagePicker
    const [gallery, setGallery]                 = useState([]);
    const [page, setPage]                       = useState(1);
    const [hasMore, setHasMore]                 = useState(true);
    const [loadingMore, setLoadingMore]         = useState(false);

    const [form] = Form.useForm();

    // Local Styles for Professional Look
    const styles = {
        container: {
            padding: '24px',
            background: '#f8fafc',
            minHeight: '100vh',
        },
        header: {
            background: '#ffffff',
            padding: '24px 30px',
            borderRadius: '16px',
            marginBottom: '24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            boxShadow: '0 4px 15px rgba(0, 0, 0, 0.03)',
            border: '1px solid #e2e8f0',
        },
        card: {
            borderRadius: '20px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.02)',
            overflow: 'hidden',
        },
        sectionTitle: {
            fontSize: '16px',
            fontWeight: 700,
            color: '#1e293b',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
        },
        input: {
            borderRadius: '10px',
            height: '46px',
        },
        uploadBox: {
            border: '2px dashed #e2e8f0',
            borderRadius: '16px',
            padding: '30px',
            textAlign: 'center',
            background: '#f8fafc',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
        },
        submitBtn: {
            height: '52px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
            border: 'none',
            boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
            fontSize: '16px',
            fontWeight: 600,
        }
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setImage(file);
        setPreview(URL.createObjectURL(file));
    };

    const fetchGallery = async (pageNum = 1) => {
        try {
            setLoadingMore(true);
            const res = await getDatas(`/admin/gallary?page=${pageNum}`);
            if (res && res.success) {
                const newData = res.result.data || [];
                setGallery(prev => pageNum === 1 ? newData : [...prev, ...newData]);
                setHasMore(res.result.current_page < res.result.last_page);
            }
        } catch (error) {
            console.error("Error fetching gallery:", error);
        } finally {
            setLoadingMore(false);
        }
    };

    useEffect(() => {
        let active = true;

        const loadOptions = async () => {
            try {
                const [rolesRes, catsRes, userRes, userData] = await Promise.all([
                    getDatas("/admin/roles"),
                    getDatas("/admin/user-categories"),
                    getDatas("/admin/users"),
                    getDatas(`/admin/users/${id}`),
                ]);

                if (!active) return;

                setManagerOptions(
                    userRes?.result?.data?.map((u) => ({ label: u.username, value: u.id }))
                );

                setRoleOptions(
                    (rolesRes?.result?.data || []).map((r) => ({
                        label: r.display_name || r.name,
                        value: r.id,
                    }))
                );

                setCategoryOptions(
                    (catsRes?.result?.data || []).map((c) => ({
                        label: c.name,
                        value: c.id,
                    }))
                );

                if (userData?.result) {
                    const u = userData.result;
                    setUser(u);
                    
                    const userRoles = u.roles?.map(r => r.id) || [];
                    
                    // Pre-fill form
                    form.setFieldsValue({
                        username: u.username,
                        email: u.email,
                        phone_number: u.phone_number,
                        salary: u.salary,
                        role_ids: userRoles,
                        manager_id: u.manager?.id,
                        user_category_id: u.category?.id,
                        status: u.status,
                        image: u.image ? [{
                            uid: '-1',
                            name: 'profile-picture.jpg',
                            status: 'done',
                            url: u.image,
                        }] : []
                    });

                    setSelectedCategory(u.category?.id);
                    setStatus(u.status);
                    setManager(u.manager?.id);
                    if (u.image) {
                        setPreview(u.image);
                    }
                }
            } catch (error) {
                console.error("Error loading options:", error);
            }
        };

        loadOptions();
        fetchGallery(1);

        return () => {
            active = false;
        };
    }, [id, form]);

    const handleFetchMore = () => {
        const nextPage = page + 1;
        setPage(nextPage);
        fetchGallery(nextPage);
    };

    const handleUploadSuccess = (newItems) => {
        setGallery(prev => [...newItems, ...prev]);
    };

    const handleSubmit = async (values) => {
        const formData = new FormData();
        formData.append("username", values.username);
        formData.append("email", values.email || "");
        formData.append("phone_number", values.phone_number);
        formData.append("salary", values.salary || "");
        
        if (values.password) {
            formData.append("password", values.password);
        }
        
        if (values.role_ids) {
            values.role_ids.forEach((roleId) => formData.append("role_ids[]", roleId));
        }

        if (values.manager_id) formData.append("manager_id", values.manager_id);
        if (values.user_category_id) formData.append("user_category_id", values.user_category_id);
        formData.append("status", values.status);

        const imageFile = values.image?.[0];
        if (imageFile) {
            if (imageFile.isFromGallery) {
                formData.append("image", imageFile.galleryPath);
            } else if (imageFile.originFileObj) {
                formData.append("image", imageFile.originFileObj);
            }
        }

        formData.append("_method", "PUT");

        try {
            setLoading(true);
            
            const res = await postData(`/admin/users/${id}`, formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });

            if(res && res?.success){
                setLoading(false);

                messageApi.open({
                    type: "success",
                    content: res.msg,
                });

                setTimeout(() => {
                    navigate("/employee");
                }, 500);
            } else {
                if (res?.errors) {
                    const formErrors = Object.keys(res.errors).map(key => ({
                        name: key,
                        errors: [res.errors[key][0]]
                    }));
                    form.setFields(formErrors);
                } else {
                    message.error(res?.msg || "Something went wrong");
                }
            }
        } catch (error) {
            console.error("Error updating user:", error.response?.data || error.message);
            message.error("Failed to update employee profile");
        }finally{
            setLoading(false);
        }
    }
    
    return (
        <div style={styles.container}>
            {contextHolder}
            
            <div style={styles.header}>
                <div className="head-left">
                    <Title level={2} style={{ margin: 0, fontWeight: 800, color: '#1e293b' }}>
                        <TeamOutlined style={{ marginRight: 12, color: '#6366f1' }} />
                        Edit Employee
                    </Title>
                    <Breadcrumb
                        style={{ marginTop: 8 }}
                        items={[
                            { title: <Link to="/dashboard">Dashboard</Link> },
                            { title: <Link to="/employee" style={{ color: '#64748b' }}>Employees</Link> },
                            { title: <span style={{ color: '#64748b' }}>Edit Profile</span> },
                        ]}
                    />
                </div>
                <div className="head-actions">
                    <Button 
                        icon={<ArrowLeftOutlined />} 
                        onClick={() => window.history.back()}
                        style={{ borderRadius: '10px', fontWeight: 500 }}
                    >
                        Back to List
                    </Button>
                </div>
            </div>

            <Form 
                form={form}
                onFinish={handleSubmit}
                layout="vertical"
                autoComplete="off"
                requiredMark={true}
            >
                <Row gutter={[24, 24]}>
                    <Col xs={24} lg={16}>
                        <Card style={styles.card} bodyStyle={{ padding: '32px' }}>
                            <div style={styles.sectionTitle}>
                                <UserOutlined /> Basic Information
                            </div>
                            
                            <Row gutter={16}>
                                <Col span={12}>
                                    <Form.Item 
                                        name="username" 
                                        label={<Text strong style={{ color: '#475569' }}>Full Name</Text>}
                                        rules={[{ required: true, message: 'Please enter employee name' }]}
                                    >
                                        <AntInput 
                                            size="large" 
                                            placeholder="Enter employee name" 
                                            prefix={<UserOutlined style={{ color: '#94a3b8' }} />} 
                                            style={styles.input}
                                        />
                                    </Form.Item>
                                </Col>
                                <Col span={12}>
                                    <Form.Item 
                                        name="phone_number" 
                                        label={<Text strong style={{ color: '#475569' }}>Phone Number</Text>}
                                        rules={[{ required: true, message: 'Please enter phone number' }]}
                                    >
                                        <AntInput 
                                            size="large" 
                                            placeholder="e.g. +1 234 567 890" 
                                            prefix={<PhoneOutlined style={{ color: '#94a3b8' }} />} 
                                            style={styles.input}
                                        />
                                    </Form.Item>
                                </Col>
                                <Col span={12}>
                                    <Form.Item 
                                        name="email" 
                                        label={<Text strong style={{ color: '#475569' }}>Email Address</Text>}
                                    >
                                        <AntInput 
                                            size="large" 
                                            placeholder="employee@company.com" 
                                            prefix={<MailOutlined style={{ color: '#94a3b8' }} />} 
                                            style={styles.input}
                                        />
                                    </Form.Item>
                                </Col>
                                <Col span={12}>
                                    <Form.Item 
                                        name="password" 
                                        label={<Text strong style={{ color: '#475569' }}>Update Password</Text>}
                                    >
                                        <AntInput.Password 
                                            size="large" 
                                            placeholder="Leave blank to keep current" 
                                            prefix={<LockOutlined style={{ color: '#94a3b8' }} />} 
                                            style={styles.input}
                                        />
                                    </Form.Item>
                                </Col>
                            </Row>

                            <Divider style={{ margin: '24px 0' }} />

                            <div style={styles.sectionTitle}>
                                <AppstoreOutlined /> Employment Details
                            </div>

                            <Row gutter={16}>
                                <Col span={12}>
                                    <Form.Item 
                                        name="role_ids" 
                                        label={<Text strong style={{ color: '#475569' }}>User Roles</Text>}
                                        rules={[{ required: true, message: 'Please assign roles' }]}
                                    >
                                        <AntSelect 
                                            mode="multiple" 
                                            allowClear 
                                            placeholder="Assign roles" 
                                            style={{ width: '100%' }}
                                            size="large"
                                            options={roleOptions}
                                        />
                                    </Form.Item>
                                </Col>
                                <Col span={12}>
                                    <Form.Item 
                                        name="salary" 
                                        label={<Text strong style={{ color: '#475569' }}>Salary</Text>}
                                    >
                                        <AntInput 
                                            size="large" 
                                            placeholder="0.00" 
                                            prefix={<DollarCircleOutlined style={{ color: '#94a3b8' }} />} 
                                            style={styles.input}
                                        />
                                    </Form.Item>
                                </Col>
                                <Col span={12}>
                                    <Form.Item 
                                        name="manager_id" 
                                        label={<Text strong style={{ color: '#475569' }}>Direct Manager</Text>}
                                    >
                                        <AntSelect 
                                            placeholder="Select manager" 
                                            style={{ width: '100%' }}
                                            size="large"
                                            options={managerOptions}
                                        />
                                    </Form.Item>
                                </Col>
                                <Col span={12}>
                                    <Form.Item 
                                        name="user_category_id" 
                                        label={<Text strong style={{ color: '#475569' }}>User Category</Text>}
                                        rules={[{ required: true, message: 'Please select category' }]}
                                    >
                                        <AntSelect 
                                            placeholder="Select category" 
                                            style={{ width: '100%' }}
                                            size="large"
                                            options={categoryOptions}
                                        />
                                    </Form.Item>
                                </Col>
                            </Row>
                        </Card>
                    </Col>

                    <Col xs={24} lg={8}>
                        <Card style={styles.card} bodyStyle={{ padding: '24px' }}>
                            <div style={styles.sectionTitle}>
                                <CheckCircleOutlined /> Account Status
                            </div>
                            <Form.Item 
                                name="status" 
                                rules={[{ required: true, message: 'Please select status' }]}
                            >
                                <AntSelect 
                                    placeholder="Select Status" 
                                    style={{ width: '100%' }}
                                    size="large"
                                >
                                    <Option value="active">
                                        <Space><span style={{ color: '#16a34a' }}>●</span> Active</Space>
                                    </Option>
                                    <Option value="inactive">
                                        <Space><span style={{ color: '#dc2626' }}>●</span> Inactive</Space>
                                    </Option>
                                </AntSelect>
                            </Form.Item>

                            <Divider />

                            <div style={styles.sectionTitle}>
                                <CameraOutlined /> Profile Picture
                            </div>
                            
                            <ImagePicker 
                                form={form}
                                name="image"
                                label=""
                                gallery={gallery}
                                fetchMore={handleFetchMore}
                                hasMore={hasMore}
                                loadingMore={loadingMore}
                                onUploadSuccess={handleUploadSuccess}
                            />

                            <div style={{ marginTop: 32 }}>
                                <Button 
                                    type="primary" 
                                    htmlType="submit" 
                                    loading={loading} 
                                    block
                                    size="large"
                                    icon={<SaveOutlined />}
                                    style={styles.submitBtn}
                                >
                                    {loading ? "Updating Profile..." : "Update Employee Profile"}
                                </Button>
                            </div>
                        </Card>
                    </Col>
                </Row>
            </Form>
        </div>
    );
}
