export default function F() {

    return "default-export";
}

export var isHoisted = (F() === "default-export");
