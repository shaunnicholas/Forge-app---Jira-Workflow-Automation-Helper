import api, { route } from "@forge/api";
import { kvs } from "@forge/kvs";

export async function run(event) {
  console.log("Workflow Automation Trigger");
  console.log(JSON.stringify(event, null, 2));

  const issueId = event.issue.id;

  // Get complete issue details
  const issueResponse = await api.asApp().requestJira(
    route`/rest/api/3/issue/${issueId}`
  );

  const issue = await issueResponse.json();

  const isCreated =
    event.eventType === "avi:jira:created:issue";

  const isUpdated =
    event.eventType === "avi:jira:updated:issue";

  // Get all rules
  const result = await kvs.query().getMany();

  const rules = result.results
    .map(item => item.value)
    .filter(rule => rule && rule.active);

  console.log(`Found ${rules.length} active rule(s).`);

  for (const rule of rules) {

    // Trigger validation
    if (rule.trigger === "Issue Created" && !isCreated) {
      continue;
    }

    if (rule.trigger === "Issue Updated" && !isUpdated) {
      continue;
    }

    // Issue Type validation
    if (
      rule.issueType &&
      rule.issueType !== issue.fields.issuetype.name
    ) {
      continue;
    }

    // Priority validation
    if (
      rule.priority &&
      issue.fields.priority &&
      rule.priority !== issue.fields.priority.name
    ) {
      continue;
    }

    console.log(`Matched Rule : ${rule.name}`);

    await addLabel(issue, rule);

    await assignIssue(issue.id, rule);

    await createSubtask(issue, rule);
  }
}

async function addLabel(issue, rule) {

  if (!rule.label || rule.label.trim() === "") {
    return;
  }

  const labels = issue.fields.labels || [];

  // Prevent duplicate label
  if (labels.includes(rule.label)) {
    console.log("Label already exists.");
    return;
  }

  const response = await api.asApp().requestJira(
    route`/rest/api/3/issue/${issue.id}`,
    {
      method: "PUT",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        update: {
          labels: [
            {
              add: rule.label
            }
          ]
        }
      })
    }
  );

  console.log("Label Status:", response.status);
}

async function assignIssue(issueId, rule) {

  if (!rule.assignee || rule.assignee.trim() === "") {
    return;
  }

  const response = await api.asApp().requestJira(
    route`/rest/api/3/issue/${issueId}/assignee`,
    {
      method: "PUT",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        accountId: rule.assignee
      })
    }
  );

  console.log("Assignment Status:", response.status);
}

async function createSubtask(issue, rule) {

  if (!rule.createSubtask) {
    return;
  }

  const existingSubtask = issue.fields.subtasks.find(
    subtask => subtask.fields.summary === `Subtask for ${issue.key}`
  );

  if (existingSubtask) {
    console.log("Subtask already exists.");
    return;
  }

  const response = await api.asApp().requestJira(
    route`/rest/api/3/issue`,
    {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        fields: {
          project: {
            key: issue.fields.project.key
          },
          parent: {
            key: issue.key
          },
          summary: `Subtask for ${issue.key}`,
          issuetype: {
            name: "Sub-task"
          }
        }
      })
    }
  );

  console.log("Subtask Status:", response.status);
}