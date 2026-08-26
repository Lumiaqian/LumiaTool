export interface ResultRowProps {
  label: string;
  value?: string;
  state?: "default" | "error";
  action?: React.ReactNode;
}
export declare function ResultRow(props: ResultRowProps): React.ReactElement;
