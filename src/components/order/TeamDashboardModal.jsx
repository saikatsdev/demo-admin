import { Avatar, Button, Card, Col, Modal, Progress, Row, Space, Tag, Typography } from "antd";
import { CheckCircleOutlined, CloseCircleOutlined, TeamOutlined, UserOutlined } from "@ant-design/icons";

const getEmployeeMetrics = (employee, index) => {
    const base = (index % 5) + 1;
    const idValue = employee?.id ?? 0;

    return {
        assigned: 8 + base * 3 + (idValue % 4),
        active: 4 + base * 2 + (idValue % 3),
        cancelled: Math.max(0, base - 2),
        converted: 3 + base + (idValue % 5),
        successRate: Math.min(98, 72 + base * 4 + (idValue % 6)),
    };
};

const statCards = [
    { key: "assigned", label: "Assign Order", color: "#1677ff", bg: "#e6f4ff", icon: <TeamOutlined /> },
    { key: "active", label: "Active Order", color: "#52c41a", bg: "#f6ffed", icon: <CheckCircleOutlined /> },
    { key: "cancelled", label: "Cancelled Orders", color: "#ff4d4f", bg: "#fff2f0", icon: <CloseCircleOutlined /> },
    { key: "converted", label: "Convert Orders", color: "#722ed1", bg: "#f9f0ff", icon: <UserOutlined /> },
];

export default function TeamDashboardModal({ open, onClose, employees = [], selectedEmployee, onSelectEmployee }) {
    const activeEmployee = employees.find((employee) => employee.id === selectedEmployee) || employees[0] || null;
    const activeIndex = employees.findIndex((employee) => employee.id === activeEmployee?.id);
    const metrics = activeEmployee ? getEmployeeMetrics(activeEmployee, activeIndex >= 0 ? activeIndex : 0) : null;

    return (
        <Modal
            open={open}
            onCancel={onClose}
            footer={null}
            width={1200}
            centered
            title={
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 38, height: 38, borderRadius: 12, background: "#e6f4ff", display: "flex", alignItems: "center", justifyContent: "center", color: "#1677ff" }}>
                        <TeamOutlined style={{ fontSize: 18 }} />
                    </div>
                    <div>
                        <div style={{ fontSize: 16, fontWeight: 700 }}>Team Dashboard</div>
                        <div style={{ fontSize: 12, color: "#8c8c8c" }}>Monitor follow-up performance by team member</div>
                    </div>
                </div>
            }
            styles={{ body: { padding: 0, background: "#f7f9fc" } }}
        >
            <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", minHeight: 620, background: "#f7f9fc" }}>
                <div style={{ borderRight: "1px solid #e8edf5", padding: 18, background: "#fff" }}>
                    <div style={{ marginBottom: 12 }}>
                        <Typography.Text strong style={{ fontSize: 14 }}>
                            Employee List
                        </Typography.Text>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        {employees.length ? (
                            employees.map((employee, index) => {
                                const isActive = activeEmployee?.id === employee.id;
                                const itemMetrics = getEmployeeMetrics(employee, index);

                                return (
                                    <Button
                                        key={employee.id}
                                        onClick={() => onSelectEmployee(employee.id)}
                                        type={isActive ? "primary" : "default"}
                                        style={{
                                            height: "auto",
                                            padding: "12px",
                                            borderRadius: 12,
                                            textAlign: "left",
                                            background: isActive ? "#1677ff" : "#fff",
                                            borderColor: isActive ? "#1677ff" : "#e8edf5",
                                        }}
                                    >
                                        <Space align="start" style={{ width: "100%" }}>
                                            <Avatar
                                                size={38}
                                                icon={<UserOutlined />}
                                                style={{
                                                    background: isActive ? "#fff" : "#e6f4ff",
                                                    color: isActive ? "#1677ff" : "#1677ff",
                                                    flexShrink: 0,
                                                }}
                                            />
                                            <div style={{ minWidth: 0, flex: 1 }}>
                                                <div style={{ fontWeight: 600, color: isActive ? "#fff" : "#262626", textTransform:"capitalize" }}>
                                                    {employee.username || "Employee"}
                                                </div>
                                                <div style={{ fontSize: 12, color: isActive ? "rgba(255,255,255,0.88)" : "#8c8c8c", marginTop: 2 }}>
                                                    {employee.phone_number || "No phone number"}
                                                </div>
                                                <div style={{ marginTop: 6 }}>
                                                    <Tag color={isActive ? "cyan" : "blue"} style={{ margin: 0, borderRadius: 999 }}>
                                                        {itemMetrics.active} active
                                                    </Tag>
                                                </div>
                                            </div>
                                        </Space>
                                    </Button>
                                );
                            })
                        ) : (
                            <div style={{ padding: 20, border: "1px dashed #d9d9d9", borderRadius: 12, textAlign: "center", color: "#8c8c8c" }}>
                                No employees available yet.
                            </div>
                        )}
                    </div>
                </div>

                <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 16 }}>
                    <Card
                        style={{ borderRadius: 16, overflow: "hidden", border: "1px solid #e8edf5", background: "linear-gradient(135deg, #1677ff 0%, #722ed1 100%)" }}
                        bodyStyle={{ padding: 20, color: "#fff" }}
                    >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
                            <div>
                                <div style={{ fontSize: 12, opacity: 0.9, textTransform: "uppercase", letterSpacing: 1 }}>Selected Rep</div>
                                <div style={{ fontSize: 24, fontWeight: 700, marginTop: 4, textTransform:"capitalize" }}>
                                    {activeEmployee?.username || "Select an employee"}
                                </div>
                                <div style={{ fontSize: 13, marginTop: 6, opacity: 0.95 }}>
                                    {activeEmployee?.phone_number || "Choose a team member to view performance"}
                                </div>
                            </div>
                            <div style={{ padding: "10px 12px", borderRadius: 12, background: "rgba(255,255,255,0.18)", minWidth: 140 }}>
                                <div style={{ fontSize: 12, opacity: 0.9 }}>Success Rate</div>
                                <div style={{ fontSize: 22, fontWeight: 700, marginTop: 2 }}>{metrics?.successRate ?? 0}%</div>
                            </div>
                        </div>
                    </Card>

                    <Row gutter={[12, 12]}>
                        {statCards.map((stat) => (
                            <Col xs={24} sm={12} lg={6} key={stat.key}>
                                <Card
                                    hoverable
                                    style={{ borderRadius: 14, border: "1px solid #e8edf5", background: "#fff" }}
                                    bodyStyle={{ padding: "16px 16px 14px" }}
                                >
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                        <div>
                                            <div style={{ fontSize: 12, color: "#8c8c8c", fontWeight: 500 }}>{stat.label}</div>
                                            <div style={{ fontSize: 22, fontWeight: 700, color: "#262626", marginTop: 4 }}>
                                                {metrics?.[stat.key] ?? 0}
                                            </div>
                                        </div>
                                        <div style={{ width: 42, height: 42, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", background: stat.bg, color: stat.color, fontSize: 18 }}>
                                            {stat.icon}
                                        </div>
                                    </div>
                                </Card>
                            </Col>
                        ))}
                    </Row>

                    <Card style={{ borderRadius: 14, border: "1px solid #e8edf5" }} bodyStyle={{ padding: 16 }}>
                        <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>Performance Snapshot</div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                            <div>
                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                                    <span style={{ color: "#8c8c8c" }}>Follow-up Coverage</span>
                                    <span style={{ fontWeight: 600 }}>{Math.min(100, (metrics?.active ?? 0) * 6)}%</span>
                                </div>
                                <Progress percent={Math.min(100, (metrics?.active ?? 0) * 6)} strokeColor="#1677ff" showInfo={false} />
                            </div>
                            <div>
                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                                    <span style={{ color: "#8c8c8c" }}>Conversion Focus</span>
                                    <span style={{ fontWeight: 600 }}>{Math.min(100, (metrics?.converted ?? 0) * 8)}%</span>
                                </div>
                                <Progress percent={Math.min(100, (metrics?.converted ?? 0) * 8)} strokeColor="#52c41a" showInfo={false} />
                            </div>
                            <div>
                                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                                    <span style={{ color: "#8c8c8c" }}>Retention Health</span>
                                    <span style={{ fontWeight: 600 }}>{metrics?.successRate ?? 0}%</span>
                                </div>
                                <Progress percent={metrics?.successRate ?? 0} strokeColor="#722ed1" showInfo={false} />
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </Modal>
    );
}
