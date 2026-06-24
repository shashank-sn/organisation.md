every team using ai agents has the same problem. you explain your context, the agent understands it, then the next session starts fresh. re-explain. repeat. each new agent starts from zero.

the obvious solution is a database. a hosted service. something to store all that context centrally and keep it synced. i went the other direction — a plain git repo with markdown files.

organisation.md turns any github repository into your team's shared memory. start the mcp server, and every agent connected to it reads and writes the same context. read the org file, search across sections, update decisions, import documentation — all through pull requests. fourteen tools now, from browsing context to filing bugs to managing access with codeowners. one environment variable to start.

it works like a library's card catalog. one file that indexes everything. every entry points to something real. nothing lives in a silo.

the whole thing is mit, open source. no signup, no pricing page, no demo call. fork it, run it, see if it holds.

i'm looking for honest feedback. what breaks. what's confusing. what you needed that wasn't there. that's the only way this gets better.
