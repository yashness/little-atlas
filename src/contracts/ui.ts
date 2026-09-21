export interface DialogView {
  title: string;
  eyebrow: string;
  body: string;
  actions: string;
  step?: number;
  canForward?: boolean;
}
