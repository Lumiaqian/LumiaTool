export interface ButtonProps {
  variant?: "primary" | "secondary" | "danger";
  disabled?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
  ariaLabel?: string;
}
export declare function Button(props: ButtonProps): React.ReactElement;
