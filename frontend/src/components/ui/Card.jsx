import { classNames } from "../../utils/helpers";

export default function Card({ children, className = "", padding = true }) {
  return (
    <div className={classNames("card", padding && "p-5", className)}>
      {children}
    </div>
  );
}
