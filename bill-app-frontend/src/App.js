import logo from "./logo.svg";
import "./App.css";

import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Dashboard from "./component/Dashboard";
import Clients from "./component/Clients";
import CreateInvoice from "./component/CreateInvoice";
import Preview from "./component/Preview";
import Invoices from "./component/Invoices";
import Signup from "./component/Signup";
import Login from "./component/login";
import ClientDetails from "./component/ClientDetails";
import Trash from "./component/Trash";
import ForgotPassword from "./component/ForgotPassword";
import ResetPassword from "./component/ResetPassword";
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/clients" element={<Clients />} />
        <Route path="/create" element={<CreateInvoice />} />
        <Route path="/client/:id" element={<ClientDetails />} />
        <Route path="/preview" element={<Preview />} />
        <Route path="/invoices" element={<Invoices />} />
        <Route path="/trash" element={<Trash />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
      </Routes>
    </Router>
  );
}

export default App;
