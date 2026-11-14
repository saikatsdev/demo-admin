import { hrmModule } from "./hrm";
import { inventoryStockModule } from "./inventory-stock";
import { accountingModule } from "./accounting";
import { customerInboxModule } from "./customer-inbox";

export const moduleRegistry = [
    hrmModule,
    inventoryStockModule,
    accountingModule,
    customerInboxModule,
];
