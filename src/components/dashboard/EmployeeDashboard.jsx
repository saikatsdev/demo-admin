import { useMemo} from "react";
import { useAuth } from "../../hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Card, Row, Col, Statistic, Badge, Avatar, Typography, Divider, Button, Space, Tag, Descriptions } from "antd";
import { UserOutlined, MailOutlined, PhoneOutlined, DollarCircleOutlined, LoginOutlined, CheckCircleFilled, WarningFilled, SafetyCertificateOutlined, EditOutlined, CustomerServiceOutlined, IdcardOutlined, ClockCircleOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import "./css/EmployeeDashboard.css";
import TimeTrackingBanner from "./TimeTrackingBanner";

const { Title, Text } = Typography;

export default function EmployeeDashboard() {
    const { user } = useAuth();
    const data = user ?? {};

    const navigate = useNavigate();

    const {id,username,phone_number,email,status,salary,is_verified,image,login_at,logout_at,roles} = data;

    const safeStatus = useMemo(() => {
        const s = String(status || "unknown").toLowerCase();
        if (["active", "inactive", "suspended"].includes(s)) return s;
        return "unknown";
    }, [status]);

    const statusLabel = useMemo(() => {
        if (safeStatus === "active") return "ACTIVE";
        if (safeStatus === "inactive") return "INACTIVE";
        if (safeStatus === "suspended") return "SUSPENDED";
        return (status ? String(status).toUpperCase() : "UNKNOWN");
    }, [safeStatus, status]);


    const formatMoney = (value) => {
        const n = Number(value);
        if (!Number.isFinite(n)) return "—";
        return n.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
    };

    const valueOrDash = (v) => (v === null || v === undefined || v === "" ? "—" : v);

    const roleBadges = useMemo(() => {
        if (!Array.isArray(roles) || roles.length === 0) return [];
        return roles.map((r, idx) => {
            const name = r?.name || r?.title || r?.role || r?.slug || (typeof r === "string" ? r : `Role ${idx + 1}`);
            return {key: r?.id ?? `${idx}`,name: String(name).toUpperCase(),};
        });
    }, [roles]);    return (
        <div style={{ padding: "24px", background: "#f0f2f5", minHeight: "100vh" }}>
            <div className="dashboard-header" style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <Title level={2} style={{ margin: 0 }}>Employee Dashboard</Title>
                    <Text type="secondary" style={{textTransform: "capitalize"}}>
                        Welcome back, {username ?? "Employee"}! Here's what's happening with your account.
                    </Text>
                </div>
                <Space size="middle">
                    {is_verified ? (
                        <Tag color="success" icon={<CheckCircleFilled />}>VERIFIED ACCOUNT</Tag>
                    ) : (
                        <Tag color="warning" icon={<WarningFilled />}>UNVERIFIED ACCOUNT</Tag>
                    )}
                    <Badge status={safeStatus === "active" ? "processing" : "default"} text={<Tag color={safeStatus === "active" ? "blue" : "error"}>{statusLabel}</Tag>} />
                </Space>
            </div>

            <TimeTrackingBanner initialCheckIn={login_at} initialCheckOut={logout_at} />

            <Row gutter={[24, 24]}>
                <Col xs={24} sm={12} lg={6}>
                    <Card bordered={false} className="stat-card" hoverable>
                        <Statistic
                            title="Current Salary"
                            value={salary || 0}
                            precision={2}
                            prefix={<DollarCircleOutlined style={{ color: '#52c41a' }} />}
                            suffix="BDT"
                        />
                        <div style={{ marginTop: 8, fontSize: '12px', color: '#8c8c8c' }}>Assigned monthly base</div>
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card bordered={false} className="stat-card" hoverable>
                        <Statistic
                            title="Account Status"
                            value={statusLabel}
                            valueStyle={{ color: safeStatus === 'active' ? '#3f8600' : '#cf1322', fontSize: '20px', fontWeight: '600' }}
                            prefix={safeStatus === 'active' ? <CheckCircleFilled /> : <WarningFilled />}
                        />
                        <div style={{ marginTop: 8, fontSize: '12px', color: '#8c8c8c' }}>Currently {safeStatus}</div>
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card bordered={false} className="stat-card" hoverable>
                        <Statistic
                            title="Last Login"
                            value={login_at ? dayjs(login_at).format("HH:mm A") : "N/A"}
                            prefix={<LoginOutlined style={{ color: '#1890ff' }} />}
                            valueStyle={{ fontSize: '20px' }}
                        />
                        <div style={{ marginTop: 8, fontSize: '12px', color: '#8c8c8c' }}>{login_at ? dayjs(login_at).format("MMM DD, YYYY") : "No recent activity"}</div>
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card bordered={false} className="stat-card" hoverable>
                        <Statistic
                            title="Employee ID"
                            value={id || "—"}
                            prefix={<IdcardOutlined style={{ color: '#722ed1' }} />}
                        />
                        <div style={{ marginTop: 8, fontSize: '12px', color: '#8c8c8c' }}>Unique identification</div>
                    </Card>
                </Col>

                <Col xs={24} lg={8}>
                    <Card bordered={false} style={{ height: '100%', borderRadius: '12px', textAlign: 'center' }}>
                        <div style={{ padding: '32px 0' }}>
                            <Avatar 
                                size={120} 
                                src={image} 
                                icon={<UserOutlined />} 
                                style={{ 
                                    backgroundColor: '#1890ff', 
                                    border: '4px solid #e6f7ff',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                                }}
                            />

                            <Title level={3} style={{ marginTop: 16, marginBottom: 4, textTransform: "capitalize" }}>
                                {username || "Unnamed User"}
                            </Title>

                            <Text type="secondary">{roleBadges.length > 0 ? roleBadges[0].name : "General Employee"}</Text>
                            
                            <Divider />
                            
                            <Space direction="vertical" style={{ width: '100%' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <Text type="secondary"><PhoneOutlined /> Phone</Text>
                                    <Text strong>{valueOrDash(phone_number)}</Text>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <Text type="secondary"><MailOutlined /> Email</Text>
                                    <Text strong>{email || "N/A"}</Text>
                                </div>
                            </Space>

                            <Divider />

                            <div style={{ textAlign: 'left' }}>
                                <Text strong style={{ display: 'block', marginBottom: 8 }}>Assigned Roles</Text>
                                <Space wrap>
                                    {roleBadges.map(role => (
                                        <Tag color="blue" key={role.key}>{role.name}</Tag>
                                    ))}
                                    {roleBadges.length === 0 && <Text type="secondary">No roles assigned</Text>}
                                </Space>
                            </div>
                            
                            <div style={{ marginTop: 32 }}>
                                <Button type="primary" block icon={<EditOutlined />} onClick={() => navigate('/system/user-management')}>
                                    Update Profile
                                </Button>
                                <Button block style={{ marginTop: 12 }} icon={<CustomerServiceOutlined />}>
                                    Contact Support
                                </Button>
                            </div>
                        </div>
                    </Card>
                </Col>

                <Col xs={24} lg={16}>
                    <Card title="Detailed Information" bordered={false} style={{ borderRadius: '12px', height: '100%' }} extra={<Button type="link" icon={<ClockCircleOutlined />}>View Log History</Button>}>
                        <Descriptions bordered column={{ xxl: 2, xl: 2, lg: 2, md: 1, sm: 1, xs: 1 }}>

                            <Descriptions.Item label="Employee Name" style={{textTransform: 'capitalize'}}>
                                {username || "—"}
                            </Descriptions.Item>

                            <Descriptions.Item label="Employee ID">{id || "—"}</Descriptions.Item>
                            <Descriptions.Item label="Official Email">{email || "—"}</Descriptions.Item>
                            <Descriptions.Item label="Contact Number">{phone_number || "—"}</Descriptions.Item>
                            <Descriptions.Item label="Monthly Salary">{formatMoney(salary)} BDT</Descriptions.Item>
                            <Descriptions.Item label="Account Verification">
                                {is_verified ? <Tag color="success">Verified</Tag> : <Tag color="error">Unverified</Tag>}
                            </Descriptions.Item>
                            <Descriptions.Item label="Last Login Time">{login_at ? dayjs(login_at).format("MMMM DD, YYYY hh:mm A") : "—"}</Descriptions.Item>
                            <Descriptions.Item label="Last Logout Time">{logout_at ? dayjs(logout_at).format("MMMM DD, YYYY hh:mm A") : "—"}</Descriptions.Item>
                            <Descriptions.Item label="System Roles" span={2}>
                                <Space wrap>
                                    {roleBadges.map(role => (
                                        <Badge key={role.key} status="processing" text={role.name} />
                                    ))}
                                </Space>
                            </Descriptions.Item>
                        </Descriptions>

                        <Divider orientation="left">Quick Links & Resources</Divider>
                        <Row gutter={16}>
                            <Col span={8}>
                                <Card size="small" hoverable style={{ textAlign: 'center', background: '#f6ffed', border: '1px solid #b7eb8f' }}>
                                    <SafetyCertificateOutlined style={{ fontSize: 24, color: '#52c41a' }} />
                                    <div style={{ marginTop: 8, fontWeight: 500 }}>Security</div>
                                </Card>
                            </Col>
                            <Col span={8}>
                                <Card size="small" hoverable style={{ textAlign: 'center', background: '#e6f7ff', border: '1px solid #91d5ff' }}>
                                    <IdcardOutlined style={{ fontSize: 24, color: '#1890ff' }} />
                                    <div style={{ marginTop: 8, fontWeight: 500 }}>Documents</div>
                                </Card>
                            </Col>
                            <Col span={8}>
                                <Card size="small" hoverable style={{ textAlign: 'center', background: '#fff7e6', border: '1px solid #ffd591' }}>
                                    <ClockCircleOutlined style={{ fontSize: 24, color: '#faad14' }} />
                                    <div style={{ marginTop: 8, fontWeight: 500 }}>Attendance</div>
                                </Card>
                            </Col>
                        </Row>
                    </Card>
                </Col>
            </Row>
        </div>
    );
}
