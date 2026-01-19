import { OverlayUI } from "@/components/OverlayUI";
import { SpaceScene } from "@/components/SpaceScene";

export default function Home() {
  return (
    <div className="relative h-dvh w-screen overflow-hidden bg-[#040712] text-white">
      <SpaceScene />
      <OverlayUI />
    </div>
  );
}
