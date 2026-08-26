export function Button({ variant = "secondary", disabled = false, children, onClick, ariaLabel }) {
  return <button className="lumia-button" data-variant={variant} disabled={disabled} aria-label={ariaLabel} onClick={onClick}>{children}</button>;
}
