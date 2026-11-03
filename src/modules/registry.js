import { hrmModule } from "./hrm";
import { inventoryStockModule } from "./inventory-stock";
import { accountingModule } from "./accounting";

export const moduleRegistry = [
    hrmModule,
    inventoryStockModule,
    accountingModule,
];
