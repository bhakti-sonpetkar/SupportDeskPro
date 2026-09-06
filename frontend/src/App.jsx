import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Register from "./pages/Register";
import TicketDetails from "./pages/TicketDetails";
import Login from "./pages/Login";
import CustomerDashboard from "./pages/CustomerDashboard";
import AgentDashboard from "./pages/AgentDashboard";
import CreateTicket from "./pages/CreateTicket";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/register" element={<Register />} />
        <Route
          path="/"
          element={<Navigate to="/login" replace />}
        />

        <Route
          path="/login"
          element={<Login />}
        />

        {/* Customer Dashboard */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute allowedRoles={["CUSTOMER"]}>
              <CustomerDashboard />
            </ProtectedRoute>
          }
        />

        {/* Agent Dashboard */}
        <Route
          path="/agent-dashboard"
          element={
            <ProtectedRoute allowedRoles={["AGENT"]}>
              <AgentDashboard />
            </ProtectedRoute>
          }
        />

        {/* Create Ticket - Customer Only */}
        <Route
          path="/tickets/create"
          element={
            <ProtectedRoute allowedRoles={["CUSTOMER"]}>
              <CreateTicket />
            </ProtectedRoute>
          }
        />

        {/* Ticket Details - Customer + Agent */}
        <Route
          path="/tickets/:id"
          element={
            <ProtectedRoute
              allowedRoles={["CUSTOMER", "AGENT"]}
            >
              <TicketDetails />
            </ProtectedRoute>
          }
        />

      </Routes>
    </BrowserRouter>
  );
}

export default App;