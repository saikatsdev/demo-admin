import {Table,Breadcrumb,Button,Space} from "antd";
import { ArrowLeftOutlined, PlusOutlined  } from "@ant-design/icons";
import { Link,useNavigate } from "react-router-dom";
import useTitle from "../../hooks/useTitle"
import { useEffect, useState } from "react";
import { getDatas } from "../../api/common/common";

export default function PathaStore() {
    // Hook
    useTitle("Pathao Store List");

    // Variable
    const navigate = useNavigate();

    // State
    const [stores, setStores] = useState([]);
    const [loading, setLoading] = useState(false);

    // Columns
    const columns = 
    [
        {
            title : "SL",
            dataIndex : "sl",
            render: (_, __, index) => index + 1,
            width: 70
        },
        {
            title: "Store Id",
            dataIndex: "store_id",
            key: "store_id"
        },
        {
            title: "Store Name",
            dataIndex: "store_name",
            key: "store_name"
        },
        {
            title: "Store Address",
            dataIndex: "store_address",
            key: "store_address"
        },
    ]

    // Method
    useEffect(() => {
        const getStores = async () => {
            try {
                setLoading(true);

                const res = await getDatas("/admin/pathao/stores");

                if(res && res?.success){
                    setStores(res?.result?.data?.data);
                }
            } catch (error) {
                console.log(error);
            }finally{
                setLoading(false);
            }
        }

        getStores();
    }, []);

    const handleStoreCreate = () => {
        navigate("/store/create");
    }
    
    return (
        <>
            <div className="pagehead">
                <div className="head-left">
                    <h1 className="title">All Pathao Store</h1>
                </div>
                <div className="head-actions">
                    <Breadcrumb
                        items={[
                            { title: <Link to="/dashboard">Dashboard</Link> },
                            { title: "All Pathao Store" },
                        ]}
                    />
                </div>
            </div>

            <div style={{ marginTop: 12, display: "flex", justifyContent:"flex-end", marginBottom:"10px" }}>
                <Space>
                    <Button type="primary" icon={<PlusOutlined  />} onClick={handleStoreCreate}>
                        Create Store
                    </Button>

                    <Button icon={<ArrowLeftOutlined />} onClick={() => window.history.back()}>
                        Back
                    </Button>
                </Space>
            </div>

            <Table columns={columns} dataSource={stores} rowKey="store_id" loading={loading} pagination={{ pageSize: 10 }}/>
        </>
    )
}
