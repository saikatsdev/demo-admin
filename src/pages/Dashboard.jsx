import { useEffect, useState } from "react";
import { getDatas } from "../api/common/common.js";
import ChartGrid from "../components/dashboard/ChartGrid.jsx";
import CustomerProductList from "../components/dashboard/CustomerProductList.jsx";
import Intro from "../components/dashboard/Intro.jsx";
import OrderList from "../components/dashboard/OrderList.jsx";
import OrderStatictisCard from "../components/dashboard/OrderStatictisCard.jsx";
import SummaryCard from "../components/dashboard/SummaryCard.jsx";
import Ticker from "../components/dashboard/Ticker.jsx";
import useTitle from "../hooks/useTitle.js";
import "./DashboardStyles.css";
import FullPageLoader from "../components/loader/FullPageLoader.jsx";

export default function Dashboard() {
    // Hook
    useTitle("Admin Dashboard");

    // State
    const [dashboardSummary, setDashboardSummary] = useState({});
    const [loading, setLoading]                   = useState(false);
    const [bulletin, setBulletin]                 = useState(false);

    // Method
    const getDashboardSummary = async () => {
        setLoading(true);
        try {
            const res = await getDatas("/admin/dashboard");

            if(res && res.success){
                setDashboardSummary(res.result || {});
            }
        } catch (error) {
            console.log(error);
        }finally{
            setLoading(false);
        }
    };

    const getSettings = async () => {
        const res = await getDatas("/admin/settings/list", { key: 'dashboard_bulletin' });

        if (res?.success) {
            const bulletinData = res?.result || [];

            const value = Number(bulletinData[0]?.value);

            setBulletin(value === 1);
        }
    };

    useEffect(() => {
        getDashboardSummary();
        getSettings();
    }, []);

    return (
        <div className="dashboard-container">
            {loading && <FullPageLoader />}

            {bulletin &&
                <Ticker/>
            }
            
            <Intro/>

            <SummaryCard dashboardSummary={dashboardSummary}/>

            <ChartGrid />

            <OrderStatictisCard dashboardSummary={dashboardSummary}/>

            <CustomerProductList/>

            <OrderList/>
        </div>
    )
}
