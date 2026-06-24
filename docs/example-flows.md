# example flows

## onboarding a new hire

```
read_org → "here's the full org context"
read_section("team") → read_section("projects")
→ agent now knows who's who, what's active, and how we work
```

## recording a decision

```
read_section("decisions")
→ agent reads existing decisions to match format
update_section("decisions", "...", "record decision about architecture")
→ pr created for review
```

## updating project status

```
propose_change("CONTEXT/projects.md", "...", "update project x status to shipped")
→ pr created with the change
```
