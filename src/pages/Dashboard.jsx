import { useEffect, useState, useCallback } from "react";
import { getDatas } from "../api/common/common.js";
import Intro from "../components/dashboard/Intro.jsx";
import OrderStatictisCard from "../components/dashboard/OrderStatictisCard.jsx";
import SummaryCard from "../components/dashboard/SummaryCard.jsx";
import Ticker from "../components/dashboard/Ticker.jsx";
import useTitle from "../hooks/useTitle.js";
import "./DashboardStyles.css";
import FullPageLoader from "../components/loader/FullPageLoader.jsx";
import {useRole} from "../hooks/useRole.js";
import EmployeeDashboard from "../components/dashboard/EmployeeDashboard.jsx";
import { useAppSettings } from "../contexts/useAppSettings.js";
import OrderByStatus from "../components/dashboard/OrderByStatus.jsx";
import SaleBreakdown from "../components/dashboard/SaleBreakdown.jsx";
import OrderSource from "../components/dashboard/OrderSource.jsx";
import StatusBreakDown from "../components/dashboard/StatusBreakDown.jsx";
import OrderAndProduct from "../components/dashboard/OrderAndProduct.jsx";
import LocationAndProduct from "../components/dashboard/LocationAndProduct.jsx";

export default function Dashboard() {
    // Hook
    useTitle("Admin Dashboard");

    const { settings } = useAppSettings();

    const { hasAnyRole } = useRole();
    
    const canSeeAdminWidgets = hasAnyRole(["superadmin", "admin"]);

    // State
    const [dashboardSummary, setDashboardSummary] = useState({});
    const [loading, setLoading]                   = useState(false);
    const [pipelineStatuses, setPipelineStatuses] = useState([]);
    const [graphStatuses, setGraphStatuses]       = useState([]);
    const [statuses, setStatuses]                 = useState([]);

    const bulletin                = Number(settings?.dashboard_bulletin);
    const orderByStatus           = Number(settings?.order_by_status);
    const orderStatistics         = Number(settings?.order_statistics);
    const orderSource             = Number(settings?.order_source);
    const statusBreakdown         = Number(settings?.status_breakdown);
    const orderProductReport      = Number(settings?.order_product_report);
    const customerLocationProduct = Number(settings?.customer_location_product);

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
    
    const getStatusData = useCallback(async () => {
        try {
            const res = await getDatas('/admin/statuses');
            if(res && res?.success){
                setStatuses(res?.result?.data || []);
            }
        } catch (error) {
            console.log(error);
        }
    }, []);

    const getPipelineData = useCallback(async (filter = "today", range = null) => {
        try {
            const params = { filter };
            if (filter === 'custom' && range && range[0] && range[1]) {
                params.start_date = range[0].format('YYYY-MM-DD');
                params.end_date   = range[1].format('YYYY-MM-DD');
            }
            const res = await getDatas('/admin/statuses', params);
            if(res && res?.success){
                setPipelineStatuses(res?.result?.data || []);
            }
        } catch (error) {
            console.log(error);
        }
    }, []);

    const getGraphData = useCallback(async (filter = "today", range = null) => {
        try {
            const params = { filter };
            if (filter === 'custom' && range && range[0] && range[1]) {
                params.start_date = range[0].format('YYYY-MM-DD');
                params.end_date   = range[1].format('YYYY-MM-DD');
            }
            const res = await getDatas('/admin/statuses', params);
            if(res && res?.success){
                setGraphStatuses(res?.result?.data || []);
            }
        } catch (error) {
            console.log(error);
        }
    }, []);

    useEffect(() => {
        if (canSeeAdminWidgets) {
            getDashboardSummary();
        }
    }, [canSeeAdminWidgets]);

    useEffect(() => {
        getStatusData();
    }, [getStatusData]);


    // New States
    useEffect(() => {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = "https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/tabler-icons.min.css";
        document.head.appendChild(link);
        return () => {
            document.head.removeChild(link);
        };
    }, []);

    return (
        <div className="dashboard-two-container">
            {loading && <FullPageLoader />}

            {bulletin === 1 && (
                <Ticker/>
            )}

            <Intro/>

            {canSeeAdminWidgets ? (
                <>
                    <SummaryCard dashboardSummary={dashboardSummary}/>

                    {orderByStatus && (
                        <OrderByStatus statuses={pipelineStatuses} onFilterChange={getPipelineData}/>
                    )}

                    {orderStatistics && (
                        <OrderStatictisCard statuses={graphStatuses} onFilterChange={getGraphData}/>
                    )}

                    <SaleBreakdown dashboardSummary={dashboardSummary} />

                    {(orderSource || statusBreakdown) && (
                        <>
                            <div className="sec-label">
                                Analytics
                            </div>

                            <div className="g1">
                                {orderSource && (
                                    <OrderSource />
                                )}

                                {statusBreakdown && (
                                    <StatusBreakDown statuses={statuses} />
                                )}
                            </div>
                        </>
                    )}

                    {orderProductReport && (
                        <>
                            <div className="sec-label" style={{ marginTop: "1.25rem" }}>
                                Orders & products
                            </div>

                            <OrderAndProduct />
                        </>
                    )}

                    {customerLocationProduct && (
                        <>
                            <div className="sec-label" style={{ marginTop: "1.25rem" }}>
                                Insights
                            </div>

                            <LocationAndProduct />
                        </>
                    )}

                </>
            ) : (
                <EmployeeDashboard/>
            )}
        </div>
    )
}
