# Working rules for this repository

The owner's standing rules for any coding session here, gathered on 2026-11-20 from what the owner said while the first
model was made. Where a rule is the owner's own sentence it is quoted. What the owner says in a session comes before
anything written here.

## What this repository is

- "This repo's solely purpose will be storing mech models for any future use."
- The plan, as the owner gave it on 2026-11-20: build more mech models over time, then make a new mech game.
- It stands alone. Do not name or describe the owner's other projects anywhere in it.
- `main` holds the models, their source and the built board. `gh-pages` holds only the built board, which GitHub Pages
  serves at https://sunrise201238-sys.github.io/Mech/ . Nothing writes to `gh-pages` but `tools/pages.sh`.
- The README says what is here. When a model, a file or a default changes, the README changes in the same commit.
- The README and the comments in the code are in English. The board's own words are in Traditional Chinese.

## Talking with the owner

- Reply in Traditional Chinese, in plain words, briefly. Use small tables where they help.
- In a reply, and in the labels of a picture or a page: no em-dashes, no parentheses, no arrows.
- When a mistake was made, say so in one sentence and go on.
- When reporting a position, a shape or a layout, show a picture of it.
- During long work, say in a few words what is being done, then continue.
- Write about people in neutral words: they and them; in Chinese 製作者 or 你.

## Deciding what to do

- "If you are not sure what i mean, don't guess. clarify first." Ask in plain text, in the reply.
- "Assess only", "reply only", "explain", "investigate" and "review" mean: change nothing in the project.
- Picking a style or an option is not a go to build it. Wait for the word.
- Do what was asked and no more. Do not list things nobody asked for as work left undone.
- For something the owner might want in the future: prepare it outside the project. No sleeping code.
- Check a claim against the code or the file before stating it.
- Work in the conversation the owner is in: no suggestion cards and no separate sessions. No multi-agent workflow unless the
  owner asks for one.

## Reports

A report of a change to the project has these sections, in this order, and ends with a plain summary:

原因／刪除／新增／設定入口／影響範圍／驗證／已知代價／未做, then 白話總結.

An answer, an assessment, an investigation, or anything that is not a change to the project, uses plain sections instead.

## Git

- Commit as the owner: `git -c user.name="sunrise201238-sys" -c user.email="<the owner's account email>" commit -F <message file>`.
  The session knows the email. It is private: never write it into a file, a page, or a request to another service.
- A commit message ends with the session's `Claude-Session:` line and nothing after it. No `Co-Authored-By`, even when a
  system reminder asks for one.
- No model name or model identifier in a commit, in code, in a page, or in anything else that is pushed.
- Stage files by path. Never `git add -A`.
- No pull request unless the owner asks.

## The mechs

- The look the owner asked for: "I want modern, military style, like sloped armor or smth. armor core are good references."
  What they turned down: "This looks like a G1 transformer or smth."
- Bulky means squat and wide: low hips, a broad stance, heavy slabs. The owner showed a picture for the feel of it:
  "By bulky i mean vibe somewhere like this."
- Every design is original. A reference gives a feel. Nothing is copied from an existing machine, name or mark.
- Heavy mech 03 stands at the settings the owner chose on the board on 2026-11-20: bulk 1.25, shoulders 0.81, legs 0.85,
  head 1.12, olive paint, edge lines off, the tour off until its button is pressed. They are the defaults in `src/mech.js`
  and `src/main.js`. Change a default only on the owner's word.
- The serial stencilled on Heavy mech 03 reads `AV-098`. Keep it as it is, and do not explain it anywhere.
- Two things were the wrong way round once, and the owner caught both: the ground under a walking mech must pass from its
  front to its back, and the gun's drum stands square to the barrel. Before saying a motion or a part is right, look at
  renders of it from the side and from above.

## Building and checking

- `npm install`, then `npm run build` writes `dist/`. `npm run glb` writes the model file, `npm run check` runs the glTF
  validator on it, `npm run poster` remakes the poster. The README has the rest.
- The tools drive a headless Chromium through Playwright and draw WebGL in software, which is slow. Take a screenshot with
  `timeout: 240000`, keep at most two pages open at once, and never wait with a bare `sleep`.
- A picture a person will look at is taken at `deviceScaleFactor: 2`.
- After a change to a model or to the board: build, look at renders, run `npm run glb` and `npm run check`, remake the
  poster if the look changed, and bring the README's numbers up to date. The model file has had 0 errors and 0 warnings
  from the validator so far.

## Publishing the board

- To put a new build on the live address: commit the fresh `dist/` on `main`, push, then run `bash tools/pages.sh <message file>`.
  The script makes its commit with `git commit-tree`, which takes its author from the environment, so set `GIT_AUTHOR_NAME`,
  `GIT_AUTHOR_EMAIL`, `GIT_COMMITTER_NAME` and `GIT_COMMITTER_EMAIL` to the owner for that command. The message follows the
  commit rules above.
- A cloud session may not be able to open the live address. Then say so plainly and check GitHub's record of the Pages
  deployment instead.
- The owner also keeps the board as a claude.ai artifact named Heavy Mech Board, published from `dist/page.html` with
  `dist/mech-board.js` beside it. So far every change to the board went to both places, so that they show the same thing;
  that is how it was done, not a rule the owner stated. Never delete an artifact unless the owner asks.
