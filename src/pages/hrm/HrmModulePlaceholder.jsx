import { ArrowLeftOutlined, ClockCircleOutlined, TeamOutlined } from "@ant-design/icons";
import { Breadcrumb, Button, Card, Space, Tag, Typography } from "antd";
import { Link, useNavigate } from "react-router-dom";
import useTitle from "../../hooks/useTitle";

const { Title, Text, Paragraph } = Typography;

export default function HrmModulePlaceholder({ title, description }) {
    useTitle(title);
    const navigate = useNavigate();

    return (
        <div style={{ minHeight: "calc(100vh - 120px)", padding: 4 }}>
            <Card
                bordered={false}
                style={{
                    borderRadius: 16,
                    border: "1px solid #e2e8f0",
                    boxShadow: "0 10px 30px rgba(15, 23, 42, 0.06)",
                    overflow: "hidden",
                }}
                styles={{ body: { padding: 0 } }}
            >
                <div style={{ padding: "20px 24px", borderBottom: "1px solid #e2e8f0", background: "linear-gradient(135deg, #ffffff 0%, #f4f8fc 100%)" }}>
                    <Space size="middle" align="start">
                        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)} />
                        <div>
                            <Breadcrumb items={[{ title: <Link to="/dashboard">Dashboard</Link> }, { title: "HRM" }, { title }]} />
                            <Title level={3} style={{ margin: "8px 0 0" }}>{title}</Title>
                        </div>
                    </Space>
                </div>

                <div style={{ padding: "72px 24px", textAlign: "center", maxWidth: 680, margin: "0 auto" }}>
                    <div style={{ width: 72, height: 72, margin: "0 auto 20px", display: "grid", placeItems: "center", borderRadius: 20, color: "#1c558b", background: "#e8f1f8", fontSize: 30 }}>
                        <TeamOutlined />
                    </div>
                    <Tag icon={<ClockCircleOutlined />} color="processing" style={{ marginBottom: 14 }}>Planned HRM Module</Tag>
                    <Title level={2} style={{ margin: "0 0 10px" }}>{title}</Title>
                    <Paragraph style={{ margin: "0 auto", color: "#64748b", fontSize: 15, lineHeight: 1.7 }}>
                        {description}
                    </Paragraph>
                    <Text type="secondary" style={{ display: "block", marginTop: 18 }}>
                        The navigation and route are ready. This screen will be connected when its backend API is implemented.
                    </Text>
                </div>
            </Card>
        </div>
    );
}
