import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import "./CreateTicket.css";

function CreateTicket() {
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("MEDIUM");
  const [category, setCategory] = useState("3");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      await api.post("/tickets/", {
        title,
        description,
        priority,
        category: Number(category),
      });

      navigate("/dashboard");
    } catch (error) {
      console.error(error);

      if (error.response?.data) {
        const data = error.response.data;

        if (typeof data === "object") {
          const messages = Object.entries(data)
            .map(([field, value]) => {
              const message = Array.isArray(value)
                ? value.join(", ")
                : String(value);

              return `${field}: ${message}`;
            })
            .join(" | ");

          setError(messages);
        } else {
          setError("Unable to create ticket.");
        }
      } else {
        setError("Unable to create ticket. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-ticket-page">

      <header className="create-ticket-header">
        <div>
          <h1>SupportDeskPro</h1>
          <p>Create Support Ticket</p>
        </div>

        <button
          className="back-button"
          onClick={() => navigate("/dashboard")}
        >
          Back to Dashboard
        </button>
      </header>

      <main className="create-ticket-content">

        <div className="create-ticket-card">

          <div className="form-header">
            <h2>Create a New Ticket</h2>
            <p>
              Describe your issue and our support team will assist you.
            </p>
          </div>

          <form onSubmit={handleSubmit}>

            <div className="form-group">
              <label htmlFor="title">
                Ticket Title
              </label>

              <input
                id="title"
                type="text"
                placeholder="Enter your issue title"
                value={title}
                onChange={(event) =>
                  setTitle(event.target.value)
                }
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="description">
                Description
              </label>

              <textarea
                id="description"
                placeholder="Describe your issue in detail..."
                value={description}
                onChange={(event) =>
                  setDescription(event.target.value)
                }
                rows="6"
                required
              />
            </div>

            <div className="form-row">

              <div className="form-group">
                <label htmlFor="priority">
                  Priority
                </label>

                <select
                  id="priority"
                  value={priority}
                  onChange={(event) =>
                    setPriority(event.target.value)
                  }
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="category">
                  Category
                </label>

                <select
                  id="category"
                  value={category}
                  onChange={(event) =>
                    setCategory(event.target.value)
                  }
                >
                  <option value="1">Authentication</option>
                  <option value="2">Payment</option>
                  <option value="3">Technical</option>
                  <option value="4">Account</option>
                  <option value="5">Billing</option>
                  <option value="6">Orders</option>
                  <option value="7">General</option>
                </select>
              </div>

            </div>

            {error && (
              <div className="ticket-form-error">
                {error}
              </div>
            )}

            <div className="form-actions">

              <button
                type="button"
                className="cancel-button"
                onClick={() => navigate("/dashboard")}
                disabled={loading}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="submit-ticket-button"
                disabled={loading}
              >
                {loading ? "Creating Ticket..." : "Create Ticket"}
              </button>

            </div>

          </form>

        </div>

      </main>

    </div>
  );
}

export default CreateTicket;