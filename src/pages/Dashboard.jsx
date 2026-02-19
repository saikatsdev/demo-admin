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
import {useRole} from "../hooks/useRole.js";
import EmployeeDashboard from "../components/dashboard/EmployeeDashboard.jsx";
import { useAppSettings } from "../contexts/useAppSettings.js";

export default function Dashboard() {
    // Hook
    useTitle("Admin Dashboard");

    const { settings } = useAppSettings();

    const { hasAnyRole } = useRole();
    
    const canSeeAdminWidgets = hasAnyRole(["superadmin", "admin"]);

    // State
    const [dashboardSummary, setDashboardSummary] = useState({});
    const [loading, setLoading]                   = useState(false);

    const bulletin = Number(settings?.dashboard_bulletin);


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

    useEffect(() => {
        if (canSeeAdminWidgets) {
            getDashboardSummary();
        }
    }, [canSeeAdminWidgets]);

    return (
        <div className="dashboard-container">
            {loading && <FullPageLoader />}

            {bulletin === 1 &&
                <Ticker/>
            }
            
            <Intro/>

            {canSeeAdminWidgets ? (
                <>
                    <SummaryCard dashboardSummary={dashboardSummary}/>
        
                    <ChartGrid />
                    
                    <OrderStatictisCard dashboardSummary={dashboardSummary}/>

                    <CustomerProductList/>

                    <OrderList/>
                </>
            ) : (
                <EmployeeDashboard/>
            )}
        </div>
    )
}
