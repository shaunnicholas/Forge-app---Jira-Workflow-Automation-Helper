import React, { useState, useEffect } from "react";
import { invoke } from "@forge/bridge";

function App() {
  const [showForm, setShowForm] = useState(false);
  const [rules, setRules] = useState([]);

  const defaultRule = {
    name: "",
    trigger: "Issue Created",
    issueType: "Story",
    priority: "High",
    label: "",
    createSubtask: false,
    assignee: ""
  };

  const [rule, setRule] = useState(defaultRule);

  const loadRules = async () => {
    try {
      const data = await invoke("getRules");
      setRules(data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadRules();
  }, []);

  const handleSave = async () => {
    if (!rule.name.trim()) {
      alert("Rule Name is required.");
      return;
    }

    const response = await invoke("saveRule", rule);

    if (response.success) {
      await loadRules();
      setRule(defaultRule);
      setShowForm(false);
    }
  };

  const toggleRule = async (id) => {
    await invoke("toggleRule", { id });
    loadRules();
  };

  const deleteRule = async (id) => {
    if (!window.confirm("Delete this rule?")) return;

    await invoke("deleteRule", { id });
    loadRules();
  };

  return (
    <div
      style={{
        padding: 30,
        fontFamily: "Arial, sans-serif"
      }}
    >
      <h1>Jira Workflow Automation Helper</h1>

      <p>Create automation rules for Jira issues.</p>

      <button
        onClick={() => setShowForm(true)}
        style={{
          background: "#0052CC",
          color: "#fff",
          border: "none",
          padding: "10px 18px",
          borderRadius: 4,
          cursor: "pointer"
        }}
      >
        + Create Rule
      </button>

      {showForm && (
        <div
          style={{
            marginTop: 30,
            border: "1px solid #ccc",
            borderRadius: 6,
            padding: 20,
            background: "#fafafa",
            width: 450
          }}
        >
          <h2>Create Automation Rule</h2>

          <div style={{ marginBottom: 15 }}>
            <label>Rule Name</label>
            <br />
            <input
              value={rule.name}
              onChange={(e) =>
                setRule({
                  ...rule,
                  name: e.target.value
                })
              }
              style={{
                width: "100%",
                padding: 8
              }}
            />
          </div>

          <div style={{ marginBottom: 15 }}>
            <label>Trigger</label>
            <br />
            <select
              value={rule.trigger}
              onChange={(e) =>
                setRule({
                  ...rule,
                  trigger: e.target.value
                })
              }
              style={{
                width: "100%",
                padding: 8
              }}
            >
              <option>Issue Created</option>
              <option>Issue Updated</option>
            </select>
          </div>

          <div style={{ marginBottom: 15 }}>
            <label>Issue Type</label>
            <br />
            <select
              value={rule.issueType}
              onChange={(e) =>
                setRule({
                  ...rule,
                  issueType: e.target.value
                })
              }
              style={{
                width: "100%",
                padding: 8
              }}
            >
              <option>Story</option>
              <option>Task</option>
              <option>Bug</option>
            </select>
          </div>

          <div style={{ marginBottom: 15 }}>
            <label>Priority</label>
            <br />
            <select
              value={rule.priority}
              onChange={(e) =>
                setRule({
                  ...rule,
                  priority: e.target.value
                })
              }
              style={{
                width: "100%",
                padding: 8
              }}
            >
              <option>High</option>
              <option>Medium</option>
              <option>Low</option>
            </select>
          </div>

          <div style={{ marginBottom: 15 }}>
            <label>Add Label</label>
            <br />
            <input
              value={rule.label}
              placeholder="auto-high"
              onChange={(e) =>
                setRule({
                  ...rule,
                  label: e.target.value
                })
              }
              style={{
                width: "100%",
                padding: 8
              }}
            />
          </div>

          <div style={{ marginBottom: 15 }}>
            <label>Create Subtask</label>
            <br />
            <input
              type="checkbox"
              checked={rule.createSubtask}
              onChange={(e) =>
                setRule({
                  ...rule,
                  createSubtask: e.target.checked
                })
              }
            />{" "}
            Yes
          </div>

          <div style={{ marginBottom: 15 }}>
            <label>Reassign Issue To</label>
            <br />
            <input
              value={rule.assignee}
              placeholder="Atlassian Account ID"
              onChange={(e) =>
                setRule({
                  ...rule,
                  assignee: e.target.value
                })
              }
              style={{
                width: "100%",
                padding: 8
              }}
            />
          </div>

          <button
            onClick={handleSave}
            style={{
              background: "#0052CC",
              color: "#fff",
              border: "none",
              padding: "10px 18px",
              borderRadius: 4,
              cursor: "pointer"
            }}
          >
            Save Rule
          </button>

          <button
            onClick={() => {
              setShowForm(false);
              setRule(defaultRule);
            }}
            style={{
              marginLeft: 10,
              padding: "10px 18px"
            }}
          >
            Cancel
          </button>

        </div>
      )}

      <hr style={{ margin: "30px 0" }} />

      <h2>Automation Rules</h2>

      {rules.length === 0 ? (
        <p>No rules available.</p>
      ) : (
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse"
          }}
          border="1"
          cellPadding="8"
        >
          <thead>
            <tr>
              <th>Name</th>
              <th>Trigger</th>
              <th>Issue Type</th>
              <th>Priority</th>
              <th>Label</th>
              <th>Subtask</th>
              <th>Assignee</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {rules.map((r) => (
              <tr key={r.id}>
                <td>{r.name}</td>
                <td>{r.trigger}</td>
                <td>{r.issueType}</td>
                <td>{r.priority}</td>
                <td>{r.label || "-"}</td>
                <td>{r.createSubtask ? "Yes" : "No"}</td>
                <td>{r.assignee || "-"}</td>
                <td>{r.active ? "🟢 Active" : "⚪ Inactive"}</td>

                <td>
                  <button onClick={() => toggleRule(r.id)}>
                    {r.active ? "Disable" : "Enable"}
                  </button>

                  <button
                    style={{ marginLeft: 8 }}
                    onClick={() => deleteRule(r.id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>

        </table>
      )}
    </div>
  );
}

export default App;