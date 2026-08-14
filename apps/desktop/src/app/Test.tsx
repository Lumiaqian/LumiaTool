import { Icon } from "@/components";
import { all } from "@/lib/icon";

export default function Test() {
    return (
        <div style={{ display: "flex", flexWrap: "wrap", textAlign: "center" }}>
            {all.map((item) => (
                <div key={item} style={{ width: 100, height: 100 }}>
                    <div><Icon name={item} size={30} /></div>
                    <div>{item}</div>
                </div>
            ))}
        </div>
    );
}
