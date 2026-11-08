EVAL 1: Has all required sections
Question: Does the SKILL.md contain all required sections: context gathering, step 1-7, output format?
Pass: All sections present with substantive content
Fail: Any required section missing or empty

EVAL 2: Binary evals enforced
Question: Does the skill explicitly require binary yes/no evals only, with no scales?
Pass: Skill forbids scales/vibe checks and requires binary evals
Fail: Skill allows or doesn't address scales

EVAL 3: Baseline before changes
Question: Does the skill require establishing baseline before making any changes?
Pass: Explicit instruction to run skill AS-IS first (experiment #0)
Fail: No baseline requirement or skill jumps to changes immediately

EVAL 4: One mutation at a time
Question: Does the skill instruct to change only ONE thing per experiment?
Pass: Explicit constraint of one mutation per experiment cycle
Fail: No constraint on number of simultaneous changes

EVAL 5: Complete output artifacts
Question: Does the skill define all required output files (results.tsv, changelog.md, dashboard.html)?
Pass: All three files specified in output format section
Fail: Any output file missing from requirements

EVAL 6: Keep/discard criteria defined
Question: Does the skill define clear keep/discard logic based on score comparison?
Pass: Explicit rules: keep if improved, discard if same/worse, with revert instruction
Fail: No clear decision criteria or missing revert instruction

EVAL 7: Autonomous loop
Question: Does the skill instruct to run continuously without pausing to ask permission?
Pass: Explicit instruction to loop until user stops, budget hit, or ceiling reached
Fail: Skill instructs to ask user between experiments

EVAL 8: Handles incomplete context
Question: Does the skill provide defaults or guidance when user provides incomplete context?
Pass: Skill has explicit defaults or "proceed with reasonable assumptions" guidance
Fail: Skill blocks progress ("STOP, ask user") without alternatives
