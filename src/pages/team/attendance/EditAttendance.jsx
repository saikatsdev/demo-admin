import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Form, Input, Button, Card, DatePicker, TimePicker, Select, Typography, Space, Breadcrumb, message, Spin, Divider, Avatar } from "antd";
import { ArrowLeftOutlined, SaveOutlined, RollbackOutlined, UserOutlined, InfoCircleOutlined } from "@ant-design/icons";
import useTitle from "../../../hooks/useTitle";
import { getDatas, postData, putData } from "../../../api/common/common";
import dayjs from "dayjs";

const { Title, Text } = Typography;
const { TextArea } = Input;

function EditAttendance() {
    // Hook
    useTitle("Edit Attendance");
    const { id } = useParams();
    const navigate = useNavigate();
    const [form] = Form.useForm();

    // States
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [employee, setEmployee] = useState(null);

    const getAttendance = async () => {
        setLoading(true);
        try {
            const res = await getDatas(`/admin/attendance/${id}`);
            if (res?.success) {
                const data = res.result;
                setEmployee(data.user);
                
                form.setFieldsValue({
                    attendance_date: data.attendance_date ? dayjs(data.attendance_date): null,
                    check_in_at    : data.check_in_at ? dayjs(data.check_in_at)        : null,
                    check_out_at   : data.check_out_at ? dayjs(data.check_out_at)      : null,
                    status         : data.status,
                    note           : data.note,
                });
            } else {
                message.error(res.message || "Failed to fetch attendance data");
            }
        } catch (error) {
            console.error(error);
            message.error("An error occurred while fetching data");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (id) {
            getAttendance();
        }
    }, [id]);

    const onFinish = async (values) => {
        setSubmitting(true);
        try {
            const selectedDate = values.attendance_date?.format("YYYY-MM-DD");
            
            const formData = new FormData();
            formData.append("_method", "PUT");
            formData.append("attendance_date", selectedDate);
            formData.append("status", values.status || "");
            formData.append("check_in_at", values.check_in_at ? `${selectedDate} ${values.check_in_at.format("HH:mm:ss")}` : "");
            formData.append("check_out_at", values.check_out_at ? `${selectedDate} ${values.check_out_at.format("HH:mm:ss")}` : "");
            formData.append("note", values.note || "");
            
            const res = await postData(`/admin/attendance/${id}`, formData);
            if (res?.success) {
                message.success(res.message || "Attendance record updated successfully");
                navigate("/team/attendance");
            } else {
                message.error(res.message || "Failed to update record");
            }
        } catch (error) {
            console.error(error);
            message.error("An error occurred while updating the record");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div style={{ padding: '4px' }}>
            <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'end' }}>
                <Space align="start" size="middle">
                    <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)} style={{ marginTop: 8 }}/>
                    <div>
                        <Breadcrumb
                            items={[
                                { title: <Link to="/">Dashboard</Link> },
                                { title: 'Team Management' },
                                { title: <Link to="/team/attendance">Attendance</Link> },
                                { title: 'Edit Attendance' },
                            ]}
                            style={{ marginBottom: 4 }}
                        />
                        <Title level={3} style={{ margin: 0 }}>Edit Attendance Record</Title>
                    </div>
                </Space>
            </div>

            <Card style={{ borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', maxWidth: '900px' }} bodyStyle={{ padding: '0px' }}>
                <Spin spinning={loading}>
                    {employee && (
                        <div style={{ padding: '20px 24px', backgroundColor: '#f9f9f9', borderBottom: '1px solid #f0f0f0', borderRadius: '12px 12px 0 0' }}>
                            <Space size="middle">
                                <Avatar size={48} icon={<UserOutlined />} src={employee.avatar} style={{ backgroundColor: '#1677ff' }}/>
                                <div>
                                    <Title level={5} style={{ margin: 0 }}>{employee.username}</Title>
                                    <Text type="secondary">{employee.email} • {employee.phone_number}</Text>
                                </div>
                            </Space>
                        </div>
                    )}

                    <div style={{ padding: '24px' }}>
                        <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                            <InfoCircleOutlined style={{ color: '#1677ff' }} />
                            <Text strong style={{ fontSize: 16 }}>Attendance Details</Text>
                        </div>
                        
                        <Form form={form} layout="vertical" onFinish={onFinish} requiredMark="optional">
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
                                <Form.Item label="Attendance Date" name="attendance_date" rules={[{ required: true, message: 'Date is required' }]}>
                                    <DatePicker style={{ width: '100%' }} placeholder="Select date" />
                                </Form.Item>

                                <Form.Item label="Status" name="status" rules={[{ required: true, message: 'Status is required' }]}>
                                    <Select
                                        placeholder="Select Status"
                                        options={[
                                            { label: 'Present', value: 'present' },
                                            { label: 'Late', value: 'late' },
                                            { label: 'Absent', value: 'absent' },
                                            { label: 'Half Day', value: 'half_day' },
                                        ]}
                                    />
                                </Form.Item>

                                <Form.Item label="Check In Time" name="check_in_at">
                                    <TimePicker style={{ width: '100%' }} format="HH:mm:ss" placeholder="00:00:00" />
                                </Form.Item>

                                <Form.Item label="Check Out Time" name="check_out_at">
                                    <TimePicker style={{ width: '100%' }} format="HH:mm:ss" placeholder="00:00:00" />
                                </Form.Item>
                            </div>

                            <Divider style={{ margin: '12px 0 24px' }} />

                            <Form.Item label="Note / Remarks" name="note">
                                <TextArea rows={4} placeholder="Enter any additional notes or reasons for late/absence..." style={{ borderRadius: '8px' }}/>
                            </Form.Item>

                            <Form.Item style={{ marginBottom: 0, marginTop: 32 }}>
                                <Space size="middle">
                                    <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={submitting} size="medium" >
                                        Update Record
                                    </Button>
                                    <Button icon={<RollbackOutlined />} size="medium" onClick={() => navigate("/team/attendance")}>
                                        Cancel
                                    </Button>
                                </Space>
                            </Form.Item>
                        </Form>
                    </div>
                </Spin>
            </Card>
        </div>
    );
}

export default EditAttendance;
