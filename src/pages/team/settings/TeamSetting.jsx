import { Breadcrumb } from "antd";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import useTitle from "../../../hooks/useTitle";
import { getDatas } from "../../../api/common/common";

export default function TeamSetting() {
    // Hook
    useTitle("Team Settings");

    // States
    const [loading, setLoading] = useState(false);
    const [setting, setSetting] = useState({});

    const getSetting = async () => {
        try {
            setLoading(true);

            const res = await getDatas('/admin/team-setting');

            if(res && res?.success){
                setSetting(res?.result);
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
        </>
    )
}
