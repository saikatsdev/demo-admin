import { usePermission } from "../../../hooks/usePermission";
import Payroll from "./Payroll";
import MyPayslips from "./MyPayslips";

export default function PayrollAccess(){
    const {can} = usePermission();
    return can("payroll-read") ? <Payroll/> : <MyPayslips/>;
}
