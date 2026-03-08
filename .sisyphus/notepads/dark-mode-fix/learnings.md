## 2026-03-08
- `tab-tech-stack.js` should not use Tailwind `dark:` variants; this project handles dark mode through `.dark-mode` overrides in `main.css`.
- Keep base utility classes (`bg-white`, `text-slate-800`, `border-slate-200`, etc.) so CSS variable/theme overrides can apply consistently.
- In `tab-rulers.js`, switch toggles must only flip `bg-slate-200`/`bg-brand-500` on the track and `translate-x-6` on the thumb to stay consistent with the ruler overlay switch behavior.
