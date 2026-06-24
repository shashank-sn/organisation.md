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

## importing a document

```
import_file → give the ai agent the file content
→ agent writes it to context/ and links it in organisation.md
→ pr opened automatically
```

## adding info naturally

```
add_info("our new project is called veridian, led by alice")
→ auto-detects the projects section → adds entry → opens pr
```

## removing stale info

```
remove_info("remove the project veridian entry")
→ finds matching lines → creates pr with the change
```

## reporting a bug

```
report_bug("read_section returns empty for nested headings")
→ auto-detects area as "mcp server" → files a github issue
```

## suggesting a feature

```
suggest_feature("add a get_timeline tool that shows history of changes")
→ files a github issue with the "enhancement" label
```

## checking team access

```
check_roles → shows which users control which paths
configure_codeowners("team-leads: docs/") → adds path-level ownership
check_permissions → verify what you can do in the repo
```
