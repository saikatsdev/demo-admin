import {Input as AntInput,Breadcrumb,Button,Tag,Space,Table,Form,Modal, Select,message, Upload} from "antd";
import { useEffect, useState } from "react";
import useTitle from "../../hooks/useTitle"
import { Link } from "react-router-dom";
import { PlusOutlined } from "@ant-design/icons";
import { getDatas } from "../../api/common/common";

export default function UnpreparedOrderList() {
    // Hook
    useTitle("Unprepared Order List");

    // States
    const [loading, setLoading] = useState(false);
    const [orders, setOrders] = useState([]);
    const [messageApi, contextHolder]           = message.useMessage();

    const getUnprepareOrders = async () => {
        try {
            setLoading(true);

            const res = await getDatas('/admin/team/unprepared/list');

            if(res && res?.success){
                setOrders(res?.result?.data || []);
            }
        } catch (error) {
            console.log(error);
        }finally{
            setLoading(false);
        }
    }

    useEffect(() => {
        getUnprepareOrders();
    }, []);

    return (
        <>
            {contextHolder}
            <div className="pagehead">
                <div className="head-left">
                    <h1 className="title" style={{ fontWeight: "600" }}>
                        Unprepared Order List
                    </h1>
                </div>
                <div className="head-actions">
                    <Breadcrumb
                        items={[
                            { title: <Link to="/dashboard">Dashboard</Link> },
                            { title: "Unprepared Order List" },
                        ]}
                    />
                </div>
            </div>
        </>
    )
}
