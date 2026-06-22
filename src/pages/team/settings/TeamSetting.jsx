import { EditOutlined} from "@ant-design/icons";
import { Breadcrumb, Table, Tag,Button } from "antd";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import useTitle from "../../../hooks/useTitle";
import { getDatas } from "../../../api/common/common";

export default function TeamSetting() {
    // Hook
    useTitle("Team Settings");

    // States
    const [loading, setLoading] = useState(false);
    const [setting, setSetting] = useState([]);

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
        console.log(item);
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
                    {text}
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
            <div className="pagehead">
                <div className="head-left">
                    <h1 className="title">Team Setting</h1>
                    <p className="subtitle">Manage Team Settings</p>
                </div>
                <div className="head-actions">
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
        </>
    )
}
