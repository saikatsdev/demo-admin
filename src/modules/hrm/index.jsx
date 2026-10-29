import { TeamOutlined } from "@ant-design/icons";
import { lazy } from "react";

const Team                = lazy(() => import("./pages/Team"));
const Attendance          = lazy(() => import("./pages/attendance/Attendance"));
const EditAttendance      = lazy(() => import("./pages/attendance/EditAttendance"));
const HRSettings          = lazy(() => import("./pages/settings/HRSettings"));
const PrepareOrderList    = lazy(() => import("./pages/PrepareOrderList"));
const UnpreparedOrderList = lazy(() => import("./pages/UnpreparedOrderList"));
const AssignList          = lazy(() => import("./pages/AssignList"));
const UnAssignList        = lazy(() => import("./pages/UnAssignList"));
const Department          = lazy(() => import("./pages/department/Department"));
const Designation         = lazy(() => import("./pages/designation/Designation"));
const EmployeeType        = lazy(() => import("./pages/employee-type/EmployeeType"));
const ShiftHoliday        = lazy(() => import("./pages/shift-holiday/ShiftHoliday"));
const HrmEmployee         = lazy(() => import("./pages/employee/HrmEmployee"));
const EmployeeHrmProfile  = lazy(() => import("./pages/employee/EmployeeHrmProfile"));
const Leave               = lazy(() => import("./pages/leave/Leave"));
const MyLeave             = lazy(() => import("./pages/leave/MyLeave"));
const PayrollAccess       = lazy(() => import("./pages/payroll/PayrollAccess"));
const SalaryAdvance       = lazy(() => import("./pages/advance/SalaryAdvance"));
const Performance         = lazy(() => import("./pages/performance/Performance"));

const routes = [
    { path: "/teams", component: Team },
    { path: "/hrm/employees", component: HrmEmployee },
    { path: "/hrm/employees/:id/profile", component: EmployeeHrmProfile },
    { path: "/team/attendance", component: Attendance },
    { path: "/team/attendance/edit/:id", component: EditAttendance },
    { path: "/hrm/leaves", component: Leave },
    { path: "/hrm/my-leaves", component: MyLeave },
    { path: "/hrm/departments", component: Department },
    { path: "/hrm/designations", component: Designation },
    { path: "/hrm/employment-types", component: EmployeeType },
    { path: "/hrm/shifts-holidays", component: ShiftHoliday },
    { path: "/hrm/payroll", component: PayrollAccess },
    { path: "/hrm/salary-advances", component: SalaryAdvance },
    { path: "/hrm/performance", component: Performance },
    { path: "/prepared/list", component: PrepareOrderList },
    { path: "/unprepared/list", component: UnpreparedOrderList },
    { path: "/assign-by-list", component: AssignList },
    { path: "/unassign/list", component: UnAssignList },
    { path: "/team-settings", component: HRSettings },
];

const getNavigation = ({ can, canAny }) => {
    const submenus = [
        can("hrm-dashboard-read") && { label: "HRM Dashboard", path: "/teams" },
        can("employees-read") && { label: "Employees", path: "/hrm/employees" },
        canAny("attendance-read", "attendance-self-read") && { label: "Attendance", path: "/team/attendance" },
        canAny("leave-requests-read", "leave-approvals-read") && { label: "Leave Management", path: "/hrm/leaves" },
        can("departments-read") && { label: "Departments", path: "/hrm/departments" },
        can("designations-read") && { label: "Designations", path: "/hrm/designations" },
        can("employment-types-read") && { label: "Employment Types", path: "/hrm/employment-types" },
        canAny("shifts-read", "holidays-read") && { label: "Shifts & Holidays", path: "/hrm/shifts-holidays" },
        canAny("payroll-read", "self-payslips-read") && { label: "Payroll", path: "/hrm/payroll" },
        can("salary-advances-read") && { label: "Salary Advances", path: "/hrm/salary-advances" },
        can("performance-read") && { label: "Performance", path: "/hrm/performance" },
        can("orders-team-list-read") && { label: "Prepared Order List", path: "/prepared/list" },
        can("orders-team-list-read") && { label: "Unprepare Order List", path: "/unprepared/list" },
        can("orders-team-list-read") && { label: "Assign Order List", path: "/assign-by-list" },
        can("orders-team-list-read") && { label: "Unassign Order List", path: "/unassign/list" },
        canAny("hr-settings-read", "orders-team-settings-read") && { label: "HR Settings", path: "/team-settings" },
    ].filter(Boolean);

    if (!submenus.length) return null;

    return {
        title: "HRM & Team",
        icon: <TeamOutlined />,
        submenus,
    };
};

export const hrmModule = {
    key: "HRM",
    routes,
    getNavigation,
};
