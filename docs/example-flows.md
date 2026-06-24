# Example Flows

## Onboarding a new hire

```
read_org → "Here's the full org context"
read_section("Team") → read_section("Projects")
→ Agent now knows who's who, what's active, and how we work
```

## Recording a decision

```
read_section("Decisions")
→ Agent reads existing decisions to match format
update_section("Decisions", "...", "record decision about architecture")
→ PR created for review
```

## Updating project status

```
propose_change("CONTEXT/projects.md", "...", "update project X status to shipped")
→ PR created with the change
```
