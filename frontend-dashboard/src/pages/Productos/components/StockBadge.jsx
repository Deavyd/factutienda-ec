import { Badge } from "../../../components/ui";

export default function StockBadge({ stock }) {
  return <Badge tone={stock < 20 ? "warning" : "success"}>{stock} unids</Badge>;
}
