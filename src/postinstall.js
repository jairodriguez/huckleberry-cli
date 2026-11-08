// Post-install banner — runs after npm install -g @jairodri/huckleberry-cli
console.log(`
  ╔════════════════════════════════════════════════════════════╗
  ║           HUCKLEBERRY AI SYSTEM INSTALLED                  ║
  ╚════════════════════════════════════════════════════════════╝
  Get started:
    1. huckleberry install        — set up the system
    2. npm install -g opencode    — install opencode
    3. npm install -g kimaki      — install kimaki
    4. huckleberry interview      — configure your agent
  Commands:
    huckleberry help              — show all commands
    huckleberry doctor            — health check (run when anything feels off)
    huckleberry packs             — list skill packs
    huckleberry install-pack all  — deploy every skill pack
    huckleberry cro <url>         — CRO audit of a landing page
    huckleberry review            — weekly self-improvement review
    huckleberry update            — update to latest version
  Documentation: https://huckleberry.ai
`);
