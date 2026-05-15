import { ArrowLeftOutlined, DeleteOutlined, EditOutlined, PlusOutlined, DesktopOutlined, TabletOutlined, MobileOutlined, ExpandOutlined, CheckCircleOutlined, StopOutlined } from "@ant-design/icons";
import { Breadcrumb, Button, Skeleton, Space, Typography, Tag, Empty, Tooltip } from "antd";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { deleteData, getDatas } from "../../../api/common/common";
import useTitle from "../../../hooks/useTitle";
import "./Slider.css";

const { Title, Text } = Typography;

export default function Slider() {
    // Variable
    const navigate = useNavigate();

    // State
    const [sliders, setSlider] = useState([]);
    const [loading, setLoading] = useState(false);

    // Hook
    useTitle("Manage Home Sliders | Admin");

    // Method
    const openCreate = () => {
        navigate("/add/slider");
    }

    const handleEdit = (id) => {
        navigate(`/slider/edit/${id}`);
    }

    const fetchSliders = async (isMounted = true) => {
        setLoading(true);
        try {
            const res = await getDatas("/admin/sliders");
            const list = res?.result?.data || [];
            if (isMounted) {
                setSlider(list);
            }
        } catch (error) {
            console.error("Failed to fetch sliders", error);
        } finally {
            if (isMounted) setLoading(false);
        }
    };

    useEffect(() => {
        let isMounted = true;
        fetchSliders(isMounted);
        return () => {
            isMounted = false;
        }
    }, []);

    const handleDelete = (id) => {
        Swal.fire({
            title: "Delete Slider?",
            text: "This artwork will be permanently removed from the homepage.",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#ef4444",
            cancelButtonColor: "#64748b",
            confirmButtonText: "Yes, delete it",
            cancelButtonText: "Cancel",
            customClass: {
                popup: 'premium-swal-popup',
                confirmButton: 'premium-swal-confirm'
            }
        }).then(async (result) => {
            if (result.isConfirmed) {
                const res = await deleteData(`/admin/sliders/${id}`);
                if (res?.success) {
                    fetchSliders();
                    Swal.fire({
                        title: "Deleted!",
                        text: res?.msg || "Slider has been removed.",
                        icon: "success",
                        timer: 2000,
                        showConfirmButton: false
                    });
                }
            }
        });
    };

    const getDeviceIcon = (type) => {
        switch (type?.toLowerCase()) {
            case 'desktop': return <DesktopOutlined />;
            case 'tablet': return <TabletOutlined />;
            case 'mobile': return <MobileOutlined />;
            default: return <DesktopOutlined />;
        }
    };

    return (
        <div className="slider-container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 32 }}>
                <div>
                    <Title level={2} style={{ margin: 0, fontWeight: 800 }}>Home Sliders</Title>
                    <Breadcrumb
                        style={{ marginTop: 8 }}
                        items={[
                            { title: <Link to="/dashboard">Dashboard</Link> },
                            { title: "CMS Management" },
                            { title: "Home Sliders" },
                        ]}
                    />
                </div>
                <Space size="middle">
                    <Button className="add-new-slider-btn" icon={<PlusOutlined />} onClick={openCreate}>
                        ADD NEW SLIDER
                    </Button>
                    <Button className="premium-back-btn" icon={<ArrowLeftOutlined />} onClick={() => window.history.back()}>
                        Back
                    </Button>
                </Space>
            </div>

            {/* Slider Grid */}
            <div className="premium-slider-grid">
                {loading ? (
                    Array.from({ length: 6 }).map((_, idx) => (
                        <div key={idx} className="premium-slider-card skeleton-card">
                            <Skeleton.Button active block className="skeleton-img" />
                            <div style={{ padding: '20px' }}>
                                <Skeleton active paragraph={{ rows: 2 }} title={true} />
                            </div>
                        </div>
                    ))
                ) : sliders?.length > 0 ? (
                    sliders.map((slider) => (
                        <div key={slider.id} className="premium-slider-card">
                            {/* Image Section */}
                            <div className="card-image-wrapper">
                                <img src={slider.image} alt={slider.title} className="card-img" />
                                <div className="card-overlay-badges">
                                    <div className={`status-badge ${slider.status === 'active' ? 'active' : 'inactive'}`}>
                                        {slider.status === 'active' ? <CheckCircleOutlined /> : <StopOutlined />}
                                        {slider.status === 'active' ? 'Active' : 'Inactive'}
                                    </div>
                                    <div className="device-badge">
                                        {getDeviceIcon(slider.type)}
                                        {slider.type?.toUpperCase()}
                                    </div>
                                </div>
                            </div>

                            {/* Info Section */}
                            <div className="card-info-content">
                                <Tooltip title={slider.title}>
                                    <Title level={5} className="card-title-text">{slider.title || "Untitled Slider"}</Title>
                                </Tooltip>
                                <Space>
                                    <div className="dimension-tag">
                                        <ExpandOutlined />
                                        {slider.width} × {slider.height} px
                                    </div>
                                    <Tag color={slider.status === 'active' ? 'blue' : 'default'} style={{ borderRadius: '6px' }}>
                                        {slider.status === 'active' ? 'Published' : 'Draft'}
                                    </Tag>
                                </Space>
                            </div>

                            <div className="card-action-footer">
                                <div className="footer-btn edit-btn" onClick={() => handleEdit(slider.id)}>
                                    <EditOutlined /> Edit
                                </div>
                                <div className="footer-btn delete-btn" onClick={() => handleDelete(slider.id)}>
                                    <DeleteOutlined /> Delete
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div style={{ gridColumn: '1 / -1', padding: '80px 0' }}>
                        <Empty 
                            description={
                                <Text type="secondary" style={{ fontSize: '16px' }}>
                                    No homepage sliders found. Start by adding a new one!
                                </Text>
                            }
                        >
                            <Button type="primary" size="large" onClick={openCreate} className="add-new-slider-btn">
                                Create Your First Slider
                            </Button>
                        </Empty>
                    </div>
                )}
            </div>
        </div>
    );
}
