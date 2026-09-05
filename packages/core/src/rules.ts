import axe from "axe-core";

export interface RuleHelp {
  ruleId: string;
  description: string;
  help: string;
  helpUrl: string;
  tags: string[];
  source: "axe-core";
}

export function getRuleHelp(ruleId: string): RuleHelp | undefined {
  const rule = axe.getRules().find((candidate) => candidate.ruleId === ruleId);
  if (!rule) return undefined;
  return {
    ruleId: rule.ruleId,
    description: rule.description,
    help: rule.help,
    helpUrl: rule.helpUrl,
    tags: [...rule.tags],
    source: "axe-core"
  };
}
