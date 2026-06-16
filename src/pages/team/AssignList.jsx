import {Breadcrumb,message} from "antd";
import { useEffect, useState } from "react";
import useTitle from "../../hooks/useTitle"
import { Link } from "react-router-dom";
import { getDatas } from "../../api/common/common";

export default function AssignList() {
    // Hook
    useTitle("Unprepared Order List");

    // States
    const [loading, setLoading] = useState(false);
    const [orders, setOrders] = useState([]);
    const [messageApi, contextHolder]           = message.useMessage();

    const getUnprepareOrders = async () => {
        try {
            setLoading(true);

            const res = await getDatas('/admin/team/assign-by-list');

            if(res && res?.success){
                setOrders(res?.result || []);
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
                        Assigned Order List
                    </h1>
                </div>
                <div className="head-actions">
                    <Breadcrumb
                        items={[
                            { title: <Link to="/dashboard">Dashboard</Link> },
                            { title: "Assigned Order List" },
                        ]}
                    />
                </div>
            </div>
        </>
    )
}
