import { message } from "antd";
import { useEffect, useState } from "react";
import { getDatas, postData } from "../../api/common/common";

export default function FrontendTheme({formatText}) {
    // State
    const [frontendThemeSetting, setFrontendThemeSetting] = useState([]);
    const [messageApi, contextHolder]                     = message.useMessage();
    const [loading, setLoading]                           = useState(false);

    // Method
    useEffect(() => {
        let isMounted = true;

        const fetchedSetting = async () => {
            const res = await getDatas("/admin/settings", {setting_category_id:6});

            const data = res?.result?.data || [];

            if(isMounted){
                setFrontendThemeSetting(data);
            }
        }

        fetchedSetting();

        return () => {
            isMounted = false;
        }
    }, []);

    const handleInputChange = (id, newValue) => {
        setFrontendThemeSetting((prev) =>
            prev.map((item) =>
                item.id === id ? { ...item, value: newValue } : item
            )
        );
    };

    const filteredData = frontendThemeSetting.filter((item) => item.category?.id == 6);

    const handleSubmit = async (e) => {
        e.preventDefault();

        const payload = {
            items: filteredData.map((item) => ({
                key                : item.key,
                type               : item.type || "text",
                value              : item.value ?? null,
                setting_category_id: item.category?.id || null,
                instruction        : item.instruction || null,
            })),
        };
    
        try {
            setLoading(true);
            const res = await postData("/admin/settings", payload);
    
            if (res?.status === 200 || res?.success) {
                messageApi.open({
                    type: "success",
                    content: res.msg,
                });
            } else {
                console.error("❌ Update failed:", res);
            }
        } catch (error) {
            console.error("⚠️ Error submitting settings:", error);
        }finally{
            setLoading(false);
        }
    }

    return (
        <>
            {contextHolder}
            <form onSubmit={handleSubmit}>
                <table className="setting-table">
                    <tbody>
                        {filteredData.map((item, index) => (
                            item.key !== null && (
                              <tr key={index} className="tr-card">
                                    <th className="setting-table-label">{formatText(item.key)}</th>
                                    <th className="setting-table-separator">:</th>
                                    <td className="setting-table-value">
                                        <input className="custom-input" type="text" value={item.value} onChange={(e) => handleInputChange(item.id, e.target.value)}/>
                                    </td>
                                        <td className="setting-table-value">
                                    <p className="setting-table-text ">
                                            {item.instruction}
                                        </p>
                                    </td>
                                </tr>
                            )
                        ))}
                    </tbody>
                </table>

                <div style={{textAlign:"right"}}>
                    <button className="update-btn">
                        {loading ? "Updating..." : "Update"}
                    </button>
                </div>
            </form>
        </>
    )
}
