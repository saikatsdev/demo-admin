
import { Breadcrumb } from "antd";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getDatas } from "../../api/common/common";
import AllSettings from "../../components/settings/AllSettings";
import CheckoutSetting from "../../components/settings/CheckoutSetting";
import FrontendTheme from "../../components/settings/FrontendTheme";
import GeneralSetting from "../../components/settings/GeneralSetting";
import HeaderFooter from "../../components/settings/HeaderFooter";
import Logo from "../../components/settings/Logo";
import ProductSetting from "../../components/settings/ProductSetting";
import SettingCategory from "../../components/settings/SettingCategory";
import TopHeader from "../../components/settings/TopHeader";
import useTitle from "../../hooks/useTitle";
import { useSelector } from "react-redux";

export default function Settings() {
    // Hook
    useTitle("All Settings List");

    // State
    const [settingCategories,setSettingCategories] = useState([]);
    const [activeIndex, setActiveIndex] = useState(0);
    const [indexTitle, setIndexTitle] = useState();

    // Method
    useEffect(() => {
        const fetchSettingCategory = async () => {
            const res = await getDatas("/admin/setting-category");

            if(res?.success){
                const data = res?.result?.data || [];
                setSettingCategories(data);

                if (data.length > 0) {
                  setIndexTitle(data[0].name);
                } else {
                  setIndexTitle("General Setting");
                }
            }else{
                setIndexTitle("General Setting");
            }
        }

        fetchSettingCategory();
    }, []);

    const handleIndex = (index) => {
        setActiveIndex(index);
        if (settingCategories[index]) {
          setIndexTitle(settingCategories[index].name);
        } else if (index === 7) {
          setIndexTitle("Settings Category Data");
        } else if (index === 8) {
          setIndexTitle("All Settings");
        }
    }

    function formatText(text) {
        if (!text) return "";
        return text.replaceAll("_", " ").replace(/\b\w/g, (char) => char.toUpperCase());
    }

    const user = useSelector((state) => state.auth.user);

    return (
        <>
            <div className="pagehead">
                <div className="head-left">
                    <h1 className="title">All Settings List</h1>
                </div>
                <div className="head-actions">
                    <Breadcrumb
                        items={[
                            { title: <Link to="/dashboard">Dashboard</Link> },
                            { title: "All Settings List" },
                        ]}
                    />
                </div>
            </div>

            <div className="setting-btn">
                {settingCategories.length > 0 &&
                    settingCategories.map((item, index) => (
                        <button key={item.id || index} className={activeIndex === index ? 'active' : ''} onClick={() => handleIndex(index)}>{item.name}</button>
                    ))
                }

                {user.phone_number === "01700000017" && (
                    <>
                        <button className={activeIndex === 7 ? 'active' : ''} onClick={() => handleIndex(7)}>Setting Category</button>
                        <button className={activeIndex === 8 ? 'active' : ''} onClick={() => handleIndex(8)}>All Settings</button>
                    </>
                )}
            </div>

            <div className="setting-body-wrapper">
                <div className="setting-body">
                    <div className="setting-header">
                        <h2>{indexTitle}</h2>
                    </div>

                    <div className="body-content">
                        {activeIndex === 0 && (
                            <GeneralSetting formatText={formatText}/>
                        )}

                        {activeIndex === 1 && (
                            <Logo formatText={formatText}/>
                        )}

                        {activeIndex === 2 && (
                            <ProductSetting formatText={formatText}/>
                        )}

                        {activeIndex === 3 && (
                            <HeaderFooter formatText={formatText}/>
                        )}

                        {activeIndex === 4 && (
                            <TopHeader formatText={formatText}/>
                        )}

                        {activeIndex === 5 && (
                            <FrontendTheme formatText={formatText}/>
                        )}

                        {activeIndex === 6 && (
                            <CheckoutSetting formatText={formatText}/>
                        )}

                        {user.phone_number === "01700000017" && (
                            <>
                                {activeIndex === 7 && <SettingCategory />}
                                {activeIndex === 8 && <AllSettings />}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </>
    )
}
