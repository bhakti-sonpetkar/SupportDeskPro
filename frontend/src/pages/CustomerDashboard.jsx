
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import "./CustomerDashboard.css";

function CustomerDashboard() {
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
  // FETCH CUSTOMER TICKETS
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
      setError("Unable to load your tickets.");
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // FETCH CUSTOMER STATISTICS
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
    <div className="customer-dashboard">

      {/* =================================================
          HEADER
      ================================================= */}

      <header className="dashboard-header">

        <div>
          <h1>SupportDeskPro</h1>
          <p>Customer Dashboard</p>
        </div>

        <button
          className="logout-button"
          onClick={handleLogout}
        >
          Logout
        </button>

      </header>

      <main className="dashboard-content">

        {/* =================================================
            WELCOME
        ================================================= */}

        <section className="welcome-section">

          <div>

            <h2>
              Welcome back, {username || "Customer"}
            </h2>

            <p>
              Manage your support tickets and track their
              progress.
            </p>

          </div>

          <button
            className="create-ticket-button"
            onClick={() => navigate("/tickets/create")}
          >
            + Create Ticket
          </button>

        </section>

        {/* =================================================
            STATISTICS
        ================================================= */}

        <section className="stats-grid">

          <div className="stat-card">

            <h3>Total Tickets</h3>

            <strong>
              {statsLoading ? "..." : totalTickets}
            </strong>

          </div>

          <div className="stat-card">

            <h3>Open</h3>

            <strong>
              {statsLoading ? "..." : openTickets}
            </strong>

          </div>

          <div className="stat-card">

            <h3>In Progress</h3>

            <strong>
              {statsLoading ? "..." : inProgressTickets}
            </strong>

          </div>

          <div className="stat-card">

            <h3>Resolved / Closed</h3>

            <strong>
              {statsLoading
                ? "..."
                : resolvedTickets + closedTickets}
            </strong>

          </div>

        </section>

        {/* =================================================
            MY TICKETS
        ================================================= */}

        <section className="tickets-section">

          <div className="section-header">

            <div>
              <h2>My Tickets</h2>

              <p>
                Tickets created by you
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
            <p className="status-message">
              Loading tickets...
            </p>
          )}

          {/* Error */}

          {error && (
            <p className="error-message">
              {error}
            </p>
          )}

          {/* Empty */}

          {!loading &&
            !error &&
            tickets.length === 0 && (

              <div className="empty-state">

                <h3>No tickets yet</h3>

                <p>
                  Create your first support ticket to get
                  started.
                </p>

                <button
                  onClick={() =>
                    navigate("/tickets/create")
                  }
                >
                  Create Ticket
                </button>

              </div>
            )}

          {/* Tickets */}

          {!loading &&
            !error &&
            tickets.length > 0 && (

              <>

                <div className="tickets-table-container">

                  <table className="tickets-table">

                    <thead>

                      <tr>
                        <th>ID</th>
                        <th>Title</th>
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

                            <span
                              className={`priority ${
                                ticket.priority?.toLowerCase() || ""
                              }`}
                            >
                              {ticket.priority || "-"}
                            </span>

                          </td>

                          <td>

                            <span
                              className={`status ${
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

                <div className="customer-pagination">

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

export default CustomerDashboard;

