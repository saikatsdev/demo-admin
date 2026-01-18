import {Input as AntInput,Breadcrumb,Button,Form,Space,message, Select} from "antd";
import { ArrowLeftOutlined, UnorderedListOutlined } from "@ant-design/icons";
import { Link, useNavigate } from "react-router-dom";
import useTitle from "../../hooks/useTitle"
import { useEffect, useState } from "react";
import { getDatas, postData } from "../../api/common/common";


export default function StoreCreate() {
    // Hook
    useTitle("Pathao Store Create");

    // Variable
    const navigate = useNavigate();

    // State
    const [form]                          = Form.useForm();
    const [loading, setLoading]           = useState(false);
    const [messageApi, contextHolder]     = message.useMessage();
    const [cities, setCities]             = useState([]);
    const [zones, setZones]               = useState([]);
    const [areas, setAreas]               = useState([]);
    const [loadingZones, setLoadingZones] = useState(false);
    const [loadingArea, setLoadingAreas]  = useState(false);

    // Method
    useEffect(() => {
        const getCities = async () => {
            const res = await getDatas("/admin/pathao/cities");

            if(res && res?.success){
                setCities(res?.result?.data?.data || []);
            }
        }

        getCities();
    }, []);

    const handleStoreList = () => {
        navigate("/all/store");
    }

    const handleCityChange = async (cityId) => {
        try {
            setLoadingZones(true);

            const res = await getDatas(`/admin/pathao/zones/${cityId}`);

            if (res?.success) {
                setZones(res?.result?.data?.data || []);
            } else {
                setZones([]);
            }
        } finally {
            setLoadingZones(false);
        }
    };

    const handleZoneChange = async (zoneId) => {
        try {
            setLoadingAreas(true);

            const res = await getDatas(`/admin/pathao/areas/${zoneId}`);

            if (res?.success) {
                setAreas(res?.result?.data?.data || []);
            } else {
                setAreas([]);
            }
        } finally {
            setLoadingAreas(false);
        }
    };


    const handleSubmit = async () => {
        const values = await form.validateFields();

        try {
            setLoading(true);

            const res = await postData("/admin/pathao/stores", values);

            if(res && res?.success){
                messageApi.open({
                    type: "success",
                    content: res?.msg,
                });

                setTimeout(() => {
                    navigate("/all/store");
                }, 400);
            }else if (res?.errors) {
                const fieldErrors = Object.keys(res.errors).map((field) => ({
                    name: field,
                    errors: res.errors[field],
                }));

                form.setFields(fieldErrors);
            }
        } catch (err) {
            console.error(err);
        }finally{
            setLoading(false);
        }
    }

    return (
        <>
            {contextHolder}
            <div className="pagehead">
                <div className="head-left">
                    <h1 className="title">Create Pathao Store</h1>
                </div>
                <div className="head-actions">
                    <Breadcrumb
                        items={[
                            { title: <Link to="/dashboard">Dashboard</Link> },
                            { title: "Create Pathao Store" },
                        ]}
                    />
                </div>
            </div>

            <div style={{ marginTop: 12, display: "flex", justifyContent:"flex-end" }}>
                <Space>
                    <Button type="primary" icon={<UnorderedListOutlined />} onClick={handleStoreList}>
                        Store List
                    </Button>

                    <Button icon={<ArrowLeftOutlined />}>
                        Back
                    </Button>
                </Space>
            </div>

            <div className="single-form-layout">
                <Form layout="horizontal" form={form}>
                    <div className="pathao-dis">
                        <Form.Item label="Store Name" name="name" rules={[{ required: true, message: "name is required" }]}>
                            <AntInput placeholder="Enter name" />
                        </Form.Item>

                        <Form.Item label="Contact Name" name="contact_name" rules={[{ required: true, message: "Contact Name is required" }]}>
                            <AntInput placeholder="Enter Contact Name" />
                        </Form.Item>

                        <Form.Item label="Contact Number" name="contact_number" rules={[{ required: true, message: "Contact Number is required" }]}>
                            <AntInput placeholder="Enter Contact Number" />
                        </Form.Item>

                        <Form.Item label="Secondary Number" name="secondary_contact">
                            <AntInput placeholder="Enter Secondary Contact Number" />
                        </Form.Item>

                        <Form.Item label="Address" name="address" rules={[{ required: true, message: "Address is required" }]}>
                            <AntInput placeholder="Enter address" />
                        </Form.Item>

                        <Form.Item label="Select City" name="city_id" rules={[{ required: true, message: "Please select a city" }]}>
                            <Select placeholder="Choose a city" showSearch optionFilterProp="children" onChange={handleCityChange}>
                                {cities.map((city) => (
                                    <Select.Option key={city.city_id} value={city.city_id}>
                                        {city.city_name}
                                    </Select.Option>
                                ))}
                            </Select>
                        </Form.Item>

                        <Form.Item label="Select Zone" name="zone_id" rules={[{ required: true, message: "Please select a zone" }]}>
                            <Select placeholder="Choose a zone" loading={loadingZones} disabled={!zones.length} showSearch optionFilterProp="children" onChange={handleZoneChange}>
                                {zones.map((zone) => (
                                    <Select.Option key={zone.zone_id} value={zone.zone_id}>
                                        {zone.zone_name}
                                    </Select.Option>
                                ))}
                            </Select>
                        </Form.Item>

                        <Form.Item label="Select Area" name="area_id" rules={[{ required: true, message: "Please select a area" }]}>
                            <Select placeholder="Choose a zone" loading={loadingArea} disabled={!areas.length} showSearch optionFilterProp="children">
                                {areas.map((area) => (
                                    <Select.Option key={area.area_id} value={area.area_id}>
                                        {area.area_name}
                                    </Select.Option>
                                ))}
                            </Select>
                        </Form.Item>

                        <div style={{ textAlign: "right" }}>
                            <Form.Item>
                                <Space>
                                    <Button type="primary" onClick={handleSubmit}>
                                        {loading ? "Updating..." : "Update Info"}
                                    </Button>
                                    <Button onClick={() => window.history.back()}>Back</Button>
                                </Space>
                            </Form.Item>
                        </div>
                    </div>
                </Form>
            </div>
        </>
    )
}
