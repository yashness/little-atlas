import type { DialogView } from "../../contracts/ui";
import { element, escapeHtml as h } from "../../utils/html";
import { icon } from "../../shared/ui/art";

export function showDialog(view: DialogView): void {
  const dialog = element<HTMLDialogElement>("#adventure");
  const step = view.step;
  element("#dialog-content").innerHTML =
    `<div class="dialog-header"><div><div class="eyebrow">${h(view.eyebrow)}</div><h2 id="dialog-title" tabindex="-1">${h(view.title)}</h2></div>${step !== undefined ? `<div class="steps" aria-label="Step ${step + 1} of 3">${[0, 1, 2].map((i) => `<span class="step ${i === step ? "active" : i < step ? "done" : ""}"></span>`).join("")}</div>` : ""}<button class="close-button" data-action="close" aria-label="Close adventure">${icon("close")}</button></div>${view.body}<div class="dialog-actions">${view.actions}</div>`;
  if (!dialog.open) dialog.showModal();
  dialog.scrollTop = 0;
  element("#dialog-title").focus({ preventScroll: true });
}
