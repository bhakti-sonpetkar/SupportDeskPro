
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import "./AgentDashboard.css";

function AgentDashboard() {
  const navigate = useNavigate();
  const { username, logout } = useAuth();

  const [tickets, setTickets] = useState([]);

  // Dashboard statistics
  const [totalTickets, setTotalTickets] = useState(0);
  const [openTickets, setOpenTickets] = useState(0);
  const [inProgressTickets, setInProgressTickets] = useState(0);
  const [resolvedTickets, setResolvedTickets] = useState(0);
  const [closedTickets, setClosedTickets] = useState(0);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [nextPage, setNextPage] = useState(null);
  const [previousPage, setPreviousPage] = useState(null);

  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [error, setError] = useState("");

  // =====================================================
  // FETCH TICKETS
  // =====================================================

  const fetchTickets = async (url = "/tickets/") => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get(url);

      const data = response.data;

      setTickets(data.results || data);

      setNextPage(data.next || null);
      setPreviousPage(data.previous || null);

    } catch (error) {
      console.error(error);
      setError("Unable to load assigned tickets.");
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // FETCH DASHBOARD STATISTICS
  // =====================================================

  const fetchStats = async () => {
    try {
      setStatsLoading(true);

      const response = await api.get(
        "/tickets/dashboard/stats/"
      );

      const data = response.data;

      setTotalTickets(data.total || 0);
      setOpenTickets(data.open || 0);
      setInProgressTickets(data.in_progress || 0);
      setResolvedTickets(data.resolved || 0);
      setClosedTickets(data.closed || 0);

    } catch (error) {
      console.error(
        "Unable to load dashboard statistics:",
        error
      );
    } finally {
      setStatsLoading(false);
    }
  };

  // =====================================================
  // INITIAL LOAD
  // =====================================================

  useEffect(() => {
    fetchTickets();
    fetchStats();
  }, []);

  // =====================================================
  // LOGOUT
  // =====================================================

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // =====================================================
  // REFRESH
  // =====================================================

  const handleRefresh = () => {
    setCurrentPage(1);

    fetchTickets();
    fetchStats();
  };

  // =====================================================
  // PAGINATION
  // =====================================================

  const handleNextPage = () => {
    if (!nextPage || loading) {
      return;
    }

    setCurrentPage((page) => page + 1);

    fetchTickets(nextPage);
  };

  const handlePreviousPage = () => {
    if (!previousPage || loading) {
      return;
    }

    setCurrentPage((page) => page - 1);

    fetchTickets(previousPage);
  };

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="agent-dashboard">

      {/* =================================================
          HEADER
      ================================================= */}

      <header className="agent-dashboard-header">

        <div>
          <h1>SupportDeskPro</h1>
          <p>Agent Dashboard</p>
        </div>

        <button
          className="agent-logout-button"
          onClick={handleLogout}
        >
          Logout
        </button>

      </header>

      <main className="agent-dashboard-content">

        {/* =================================================
            WELCOME
        ================================================= */}

        <section className="agent-welcome-section">

          <div>

            <h2>
              Welcome back, {username || "Agent"}
            </h2>

            <p>
              Manage your assigned support tickets and
              help customers resolve their issues.
            </p>

          </div>

          <button
            className="agent-refresh-button"
            onClick={handleRefresh}
            disabled={loading || statsLoading}
          >
            {loading || statsLoading
              ? "Refreshing..."
              : "Refresh"}
          </button>

        </section>

        {/* =================================================
            STATISTICS
        ================================================= */}

        <section className="agent-stats-grid">

          <div className="agent-stat-card">
            <h3>Total Assigned</h3>

            <strong>
              {statsLoading ? "..." : totalTickets}
            </strong>
          </div>

          <div className="agent-stat-card">
            <h3>Open</h3>

            <strong>
              {statsLoading ? "..." : openTickets}
            </strong>
          </div>

          <div className="agent-stat-card">
            <h3>In Progress</h3>

            <strong>
              {statsLoading ? "..." : inProgressTickets}
            </strong>
          </div>

          <div className="agent-stat-card">
            <h3>Resolved / Closed</h3>

            <strong>
              {statsLoading
                ? "..."
                : resolvedTickets + closedTickets}
            </strong>
          </div>

        </section>

        {/* =================================================
            ASSIGNED TICKETS
        ================================================= */}

        <section className="agent-tickets-section">

          <div className="agent-section-header">

            <div>

              <h2>Assigned Tickets</h2>

              <p>
                Tickets currently assigned to you
              </p>

            </div>

            <button
              onClick={handleRefresh}
              disabled={loading || statsLoading}
            >
              {loading || statsLoading
                ? "Refreshing..."
                : "Refresh"}
            </button>

          </div>

          {/* Loading */}

          {loading && (
            <p className="agent-status-message">
              Loading assigned tickets...
            </p>
          )}

          {/* Error */}

          {error && (
            <p className="agent-error-message">
              {error}
            </p>
          )}

          {/* Empty */}

          {!loading &&
            !error &&
            tickets.length === 0 && (

              <div className="agent-empty-state">

                <h3>No tickets assigned</h3>

                <p>
                  There are currently no tickets assigned
                  to you.
                </p>

              </div>
            )}

          {/* Tickets */}

          {!loading &&
            !error &&
            tickets.length > 0 && (

              <>

                <div className="agent-tickets-table-container">

                  <table className="agent-tickets-table">

                    <thead>

                      <tr>
                        <th>ID</th>
                        <th>Title</th>
                        <th>Customer</th>
                        <th>Priority</th>
                        <th>Status</th>
                        <th>Created</th>
                      </tr>

                    </thead>

                    <tbody>

                      {tickets.map((ticket) => (

                        <tr
                          key={ticket.id}
                          onClick={() =>
                            navigate(
                              `/tickets/${ticket.id}`
                            )
                          }
                        >

                          <td>
                            #{ticket.id}
                          </td>

                          <td>
                            {ticket.title}
                          </td>

                          <td>
                            {ticket.customer_name ||
                              ticket.customer ||
                              "-"}
                          </td>

                          <td>

                            <span
                              className={`agent-priority ${
                                ticket.priority?.toLowerCase() || ""
                              }`}
                            >
                              {ticket.priority || "-"}
                            </span>

                          </td>

                          <td>

                            <span
                              className={`agent-status ${
                                ticket.status?.toLowerCase() || ""
                              }`}
                            >
                              {ticket.status
                                ?.replace("_", " ") || "-"}
                            </span>

                          </td>

                          <td>

                            {ticket.created_at
                              ? new Date(
                                  ticket.created_at
                                ).toLocaleDateString()
                              : "-"}

                          </td>

                        </tr>

                      ))}

                    </tbody>

                  </table>

                </div>

                {/* =================================================
                    PAGINATION
                ================================================= */}

                <div className="agent-pagination">

                  <button
                    onClick={handlePreviousPage}
                    disabled={!previousPage || loading}
                  >
                    Previous
                  </button>

                  <span>
                    Page {currentPage}
                  </span>

                  <button
                    onClick={handleNextPage}
                    disabled={!nextPage || loading}
                  >
                    Next
                  </button>

                </div>

              </>
            )}

        </section>

      </main>

    </div>
  );
}

export default AgentDashboard;

