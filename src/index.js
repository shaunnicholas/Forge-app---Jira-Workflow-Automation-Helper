import Resolver from "@forge/resolver";
import { kvs } from "@forge/kvs";

const resolver = new Resolver();

/* -------------------- Save Rule -------------------- */

resolver.define("saveRule", async ({ payload }) => {
  const id = Date.now().toString();

  const rule = {
    id,
    name: payload.name,
    trigger: payload.trigger,
    issueType: payload.issueType,
    priority: payload.priority,
    label: payload.label || "",
    createSubtask: payload.createSubtask || false,
    assignee: payload.assignee || "",
    active: true
  };

  await kvs.set(`rule-${id}`, rule);

  return {
    success: true,
    rule
  };
});

/* -------------------- Get Rules -------------------- */

resolver.define("getRules", async () => {
  const result = await kvs.query().getMany();

  return result.results
    .map((item) => item.value)
    .filter((item) => item && item.id);
});

/* -------------------- Toggle Rule -------------------- */

resolver.define("toggleRule", async ({ payload }) => {
  const key = `rule-${payload.id}`;

  const rule = await kvs.get(key);

  if (!rule) {
    return {
      success: false,
      message: "Rule not found."
    };
  }

  rule.active = !rule.active;

  await kvs.set(key, rule);

  return {
    success: true,
    active: rule.active
  };
});

/* -------------------- Delete Rule -------------------- */

resolver.define("deleteRule", async ({ payload }) => {
  await kvs.delete(`rule-${payload.id}`);

  return {
    success: true
  };
});

export const handler = resolver.getDefinitions();