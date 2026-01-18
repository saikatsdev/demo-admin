import useTitle from "../../../hooks/useTitle"
import {Breadcrumb, message} from "antd";
import { Link, useNavigate } from "react-router-dom";
import "./upsell.css";
import { useEffect, useState } from "react";
import { getDatas, postData } from "../../../api/common/common";

export default function UpsellSetting() {
    // Hook
    useTitle("Thank You Page Settings");

    const navigate = useNavigate();

    // State
    const [settingData, setSettingData] = useState(null);
    const [messageApi, contextHolder]   = message.useMessage();
    const [loading, setLoading]         = useState(false);

    // getData
    useEffect(() => {
        let isMounted = true;
        setLoading(true);

        const getSettings = async () => {
            const res = await getDatas("/admin/up-sell-settings");

            if(res && res.success){
                if(isMounted){
                    setSettingData(res?.result || []);
                }

                setLoading(false);
            }
        }

        getSettings();

        return () => {
            isMounted = false;
        }
    }, []);


    const handleChange = (e) => {
        const {name, value} = e.target;

        setSettingData((prev) => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const formData = new FormData(e.target);

        const data = Object.fromEntries(formData.entries());

        data._method = "PUT";

        try {
            setLoading(true);

            const res = await postData("/admin/up-sell-settings", data);

            if(res && res?.success){
                messageApi.open({
                    type: "success",
                    content: res.msg,
                });

                setTimeout(() => {
                    navigate("/upsell");
                }, 500);
            }
        } catch (error) {
            console.log(error);
        }finally{
            setLoading(false)
        }
    }

    return (
        <>
            {contextHolder}
            {loading && (
                <p>Loading...</p>
            )}
            <div className="pagehead">
                <div className="head-left">
                    <h1 className="title">Page Settings</h1>
                </div>
                <div className="head-actions">
                    <Breadcrumb
                        items={[
                            { title: <Link to="/dashboard">Dashboard</Link> },
                            { title: "Page Settings" },
                        ]}
                    />
                </div>
            </div>

            <div className="raw-sell-container">
                <form onSubmit={handleSubmit} className="raw-up-sell-form">
                    <div className="raw-up-sell-form-header" style={{marginBottom:"10px"}}>
                        <h2 className="page-title">Page Settings</h2>

                        <button type="button" className="back-btn" onClick={() => window.history.back()} aria-label="Go back" title="Go back">
                            <svg className="icon" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false">
                                <path d="M15 18l-6-6 6-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            <span className="label">Back</span>
                        </button>
                    </div>

                    <div className="row">
                        <div className="col-lg-6 col-12">
                            <div className="raw-sell-row">
                                <label className="raw-sell-label">Greetings:</label>
                                <input type="text" className="raw-sell-input" placeholder="Enter greetings" name="greetings" value={settingData?.greetings || ""} onChange={handleChange}/>
                            </div>
                        </div>

                        <div className="col-lg-6 col-12">
                            <div className="raw-sell-row">
                                <label className="raw-sell-label">Title:</label>
                                <input type="text" className="raw-sell-input" placeholder="Enter title" name="title" value={settingData?.title || ""} onChange={handleChange}/>
                            </div>
                        </div>

                        <div className="col-lg-6 col-12">
                            <div className="raw-sell-row">
                                <label className="raw-sell-label">Sub Title:</label>
                                <input type="text" className="raw-sell-input" placeholder="Enter sub title" name="sub_title" value={settingData?.sub_title || ""} onChange={handleChange}/>
                            </div>
                        </div>

                        <div className="col-lg-6 col-12">
                            <div className="raw-sell-row">
                                <label className="raw-sell-label">Button Text:</label>
                                <input type="text" className="raw-sell-input" placeholder="Enter button text" name="button_text" value={settingData?.button_text || ""} onChange={handleChange}/>
                            </div>
                        </div>

                        <div className="col-lg-6 col-12">
                            <div className="raw-sell-row">
                                <label className="raw-sell-label">Button Text Color:</label>
                                <input type="text" className="raw-sell-input" placeholder="Enter button text color" name="button_text_color" value={settingData?.button_text_color || ""} onChange={handleChange}/>
                            </div>
                        </div>

                        <div className="col-lg-6 col-12">
                            <div className="raw-sell-row">
                                <label className="raw-sell-label">Button Background Color:</label>
                                <input type="text" className="raw-sell-input" placeholder="Enter background color" name="button_bg_color" value={settingData?.button_bg_color || ""} onChange={handleChange}/>
                            </div>
                        </div>

                        <div className="col-12">
                            <div className="raw-sell-submit">
                                <button type="submit" className="raw-sell-btn">
                                    {loading ? "Updating..." : "Update Settings"}
                                </button>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </>
    )
}
