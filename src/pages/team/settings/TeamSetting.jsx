import { EditOutlined, SaveOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import { Breadcrumb, Table, Tag, Button, Modal, Form, Input, Select, InputNumber, message } from "antd";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import useTitle from "../../../hooks/useTitle";
import { getDatas, postData } from "../../../api/common/common";

export default function TeamSetting() {
    // Hook
    useTitle("Team Settings");

    // States
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [submitting, setSubmitting]   = useState(false);
    const [setting, setSetting]         = useState([]);
    const [loading, setLoading]         = useState(false);
    const [messageApi, contextHolder]   = message.useMessage();
    const [form]                        = Form.useForm();

    const getSetting = async () => {
        try {
            setLoading(true);

            const res = await getDatas('/admin/team-setting');

            if(res && res?.success){
                setSetting(res?.result ? [res.result] : []);
            }
        } catch (error) {
            console.log(error);
        }finally{
            setLoading(false);
        }
    }

    useEffect(() => {
        getSetting();
    }, []);

    const handleEdit = (item) => {
        setIsModalOpen(true);
        form.setFieldsValue({
            ...item,
            otp_required: item.otp_required ? 1 : 0
        });
    }

    const onFinish = async (values) => {
        try {
            setSubmitting(true);
            const formData = new FormData();
            formData.append('team_id', setting[0]?.id || 1);
            formData.append('otp_required', values.otp_required);
            formData.append('screening_duration', values.screening_duration);
            formData.append('assign_rule', values.assign_rule);

            const res = await postData("/admin/team-setting", formData);

            if (res && res.success) {
                messageApi.open({
                    type: "success",
                    content: res.msg,
                });
                setIsModalOpen(false);
                getSetting();
            } else {
                messageApi.open({
                    type: "error",
                    content: res.msg,
                });
            }
        } catch (error) {
            console.log(error);
            messageApi.open({
                type: "error",
                content: "Something went wrong",
            });
        } finally {
            setSubmitting(false);
        }
    }

    const columns = 
    [
        { 
            title: 'OTP Required', 
            dataIndex: 'otp_required', 
            key: 'otp_required', 
            render: v => v ? <Tag color="green">Yes</Tag> : <Tag color="red">No</Tag> 
        },
        { 
            title: 'Screening Duration', 
            dataIndex: 'screening_duration', 
            key: 'screening_duration', 
            render: v => `${v} min` 
        },
        { 
            title: 'Assign Rule', 
            dataIndex: 'assign_rule', 
            key: 'assign_rule',
            render: (text) => (
                <Tag color="blue" style={{textTransform:"capitalize"}}>
                    {text === "manual_assign" ? "Manual Assign" : text === "auto_assign" ? "Auto Assign" : "All"}
                </Tag>
            )
        },
        {
            title: 'Action',
            key: 'action',
            width: 100,
            align: 'center',
            render: (_, record) => (
                <Button type="primary" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
                    Edit
                </Button>
            )
        }
    ];

    return (
        <>
            {contextHolder}
            <div className="pagehead">
                <div className="head-left">
                    <h1 className="title">Team Setting</h1>
                    <p className="subtitle">Manage Team Settings</p>
                </div>
                <div className="head-actions" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                    <Button 
                        icon={<ArrowLeftOutlined />} 
                        onClick={() => window.history.back()}
                    >
                        Back
                    </Button>
                    <Breadcrumb
                        items={[
                            { title: <Link to="/dashboard">Dashboard</Link> },
                            { title: "Team Setting" },
                        ]}
                    />
                </div>
            </div>
            <div style={{ marginTop: 16 }}>
                <Table
                    columns={columns}
                    dataSource={setting}
                    loading={loading}
                    rowKey="id"
                    pagination={false}
                />
            </div>

            <Modal title="Edit Team Settings" open={isModalOpen} onCancel={() => setIsModalOpen(false)} footer={null} destroyOnClose>
                <Form form={form} layout="vertical" onFinish={onFinish}
                    initialValues={{
                        otp_required      : 0,
                        assign_rule       : 'all',
                        screening_duration: 10
                    }}
                >
                    <Form.Item label="OTP Required" name="otp_required" rules={[{ required: true, message: 'Please select OTP requirement' }]}>
                        <Select>
                            <Select.Option value={1}>Yes</Select.Option>
                            <Select.Option value={0}>No</Select.Option>
                        </Select>
                    </Form.Item>

                    <Form.Item label="Screening Duration (Minutes)" name="screening_duration" rules={[{ required: true, message: 'Please enter screening duration' }]}>
                        <InputNumber style={{ width: '100%' }} min={1} />
                    </Form.Item>

                    <Form.Item label="Assign Rule" name="assign_rule" rules={[{ required: true, message: 'Please select assign rule' }]}>
                        <Select>
                            <Select.Option value="all">All</Select.Option>
                            <Select.Option value="manual_assign">Manual Assign</Select.Option>
                            <Select.Option value="auto_assign">Auto Assign</Select.Option>
                        </Select>
                    </Form.Item>

                    <Form.Item style={{ marginBottom: 0, marginTop: 24, textAlign: 'right' }}>
                        <Button style={{ marginRight: 8 }} onClick={() => setIsModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="primary" htmlType="submit" loading={submitting} icon={<SaveOutlined />}>
                            Save Changes
                        </Button>
                    </Form.Item>
                </Form>
            </Modal>
        </>
    )
}
