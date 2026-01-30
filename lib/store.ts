import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import employeeReducer from "./slices/employeeSlice";
import clientReducer from "./slices/clientSlice";
import productCategoryReducer from "./slices/productCategorySlice";
import productReducer from "./slices/productSlice";
import jobCardReducer from "./slices/jobCardSlice";
import saleReducer from "./slices/saleSlice";
import expenseReducer from "./slices/expenseSlice";
import clientIntegrationReducer from "./slices/clientIntegrationSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    employee: employeeReducer,
    client: clientReducer,
    clientIntegration: clientIntegrationReducer,
    productCategory: productCategoryReducer,
    product: productReducer,
    jobCard: jobCardReducer,
    sale: saleReducer,
    expense: expenseReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
