import Link from "next/link";
export default function Home() {
  return (
    <div className="h-screen flex items-center justify-center">
      <div className="mx-auto w-full max-w-md bg-white p-4 rounded text-black">
        <p>Solve math problems to fuel your rocket. Answer correctly and gain 30 fuel to climb higher. Answer wrong and lose 100 fuel. Race against time - you have 8 seconds to solve each equation. Master algebra and arithmetic to reach orbit. The faster you solve, the higher you fly.</p>
        <Link href="/liftoff" className="block">
          <div className="mx-auto w-full max-w-md bg-red-200 p-4 rounded-lg text-center cursor-pointer hover:bg-red-300">
            Go to Liftoff!!
          </div>
        </Link>
      </div>
    </div>
  );
}
