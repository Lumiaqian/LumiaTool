export interface PanelProps {
  title: string;
  surface?: "paper" | "editor";
  actions?: React.ReactNode;
  children: React.ReactNode;
}
export declare function Panel(props: PanelProps): React.ReactElement;
